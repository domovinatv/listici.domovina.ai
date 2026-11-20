// Spremanje profila listića i broja s rasporedom misa (urednička strana).
// Javni upit je u javni-raspored.ts i ne dijeli SQL s ovim modulom (odluka 103).
import type { Baza } from "./baza.ts";
import { brojShema, profilShema, type Sekcija } from "./listic-shema.ts";
import { raspored, NeispravanDokument } from "./raspored-shema.ts";
import { provjeriSezone, type Sezone } from "./tjedne-mise.ts";

export const PORUKA_106_RASPORED =
  "broj se ne može objaviti bez rasporeda misa: treba bar stalni raspored ili tjedne mise (odluka 106)";
export const PORUKA_106_KONTAKT =
  "broj se ne može objaviti bez kontakta: profil treba telefon ili e-mail (odluka 106)";

const sada = () => new Date().toISOString();
const odbij = (...greske: string[]): never => {
  throw new NeispravanDokument(greske);
};

/** Novi profil listića (bez `id`) ili izmjena postojećeg. Vraća id listića. */
export async function spremiProfil(db: Baza, ulaz: unknown, o: { id?: number; sada?: string } = {}): Promise<number> {
  const p = profilShema.parse(ulaz);
  const t = o.sada ?? sada();
  if (!(await db.prepare("SELECT 1 FROM zupe WHERE slug = ?").bind(p.zupa_slug).first()))
    odbij(`zupa_slug: župa „${p.zupa_slug}” ne postoji u uvezenim župama`);
  const polja = [
    p.zupa_slug, p.naziv, p.podnaslov, p.kontakt.adresa, p.kontakt.telefon, p.kontakt.email, p.kontakt.web,
    p.uredovno_vrijeme, p.iban, p.primatelj, p.sezone ? JSON.stringify(p.sezone) : null,
  ];
  let id = o.id;
  if (id === undefined) {
    const r = await db
      .prepare(
        `INSERT INTO listici (zupa_slug, naziv, podnaslov, adresa, telefon, email, web, uredovno_vrijeme, iban,
           primatelj, sezone, stvoreno_u, promijenjeno_u) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      )
      .bind(...polja, t, t)
      .first<{ id: number }>();
    id = r!.id;
  } else {
    const postoji = await db.prepare("SELECT zupa_slug FROM listici WHERE id = ?").bind(id).first<{ zupa_slug: string }>();
    if (!postoji) odbij(`listić ${id} ne postoji`);
    if (postoji!.zupa_slug !== p.zupa_slug) odbij("zupa_slug: glavna župa listića se ne mijenja izmjenom profila");
    const { results } = await db
      .prepare(
        `SELECT DISTINCT s.sezona FROM stalni_raspored s JOIN listic_crkve c ON c.id = s.crkva_id
         WHERE c.listic_id = ? AND s.sezona IS NOT NULL`,
      )
      .bind(id)
      .all<{ sezona: "zimsko" | "ljetno" }>();
    for (const { sezona } of results)
      if (!p.sezone?.[sezona]) odbij(`sezone: stalni raspored ima pravila za sezonu „${sezona}”, pa granice ne smiju nestati`);
  }
  await db.batch([
    db
      .prepare(
        `UPDATE listici SET zupa_slug = ?, naziv = ?, podnaslov = ?, adresa = ?, telefon = ?, email = ?, web = ?,
           uredovno_vrijeme = ?, iban = ?, primatelj = ?, sezone = ?, promijenjeno_u = ? WHERE id = ?`,
      )
      .bind(...polja, t, id),
    db.prepare("INSERT OR IGNORE INTO listici_zupe (listic_id, zupa_slug) VALUES (?, ?)").bind(id, p.zupa_slug),
    db.prepare("DELETE FROM profil_blokovi WHERE listic_id = ?").bind(id),
    ...ubaciSekcije(db, "profil_blokovi", "listic_id", "?", [id], p.blokovi),
  ]);
  return id!;
}

function ubaciSekcije(db: Baza, tablica: string, stupac: string, vlasnik: string, vez: unknown[], s: Sekcija[]) {
  if (!s.length) return [];
  return [
    db
      .prepare(
        `INSERT INTO ${tablica} (${stupac}, tip, naslov, sadrzaj, redoslijed, osjetljivo)
         SELECT ${vlasnik}, json_extract(j.value, '$.tip'), json_extract(j.value, '$.naslov'),
                json_extract(j.value, '$.sadrzaj'), j.key, json_extract(j.value, '$.osjetljivo')
         FROM json_each(?) j`,
      )
      .bind(...vez, JSON.stringify(s)),
  ];
}

/**
 * Spremi dokument rasporeda (crkve, stalni raspored, tjedne mise s nakanama, ostali
 * termini) i broj sa sekcijama, u jednoj transakciji (D1 batch). Broj je ključ
 * (listić, godište, redni broj): ponovno spremanje ga zamjenjuje.
 *
 * Crkve se spajaju po `crkve[].id`; crkva koje više nema u dokumentu briše se samo ako je
 * nijedna misa ni termin ne koristi. Stalni raspored listića zamjenjuje se cijeli.
 * Broj od nekoliko desetaka misa je i dalje desetak naredbi: retci idu kao JSON kroz
 * json_each, ne naredba po misi.
 */
export async function spremiRaspored(
  db: Baza,
  listicId: number,
  dokument: unknown,
  brojUlaz: unknown,
  o: { sada?: string } = {},
): Promise<{ brojId: number }> {
  const d = raspored(dokument);
  const b = brojShema.parse(brojUlaz);
  const t = o.sada ?? sada();

  const l = await db
    .prepare("SELECT zupa_slug, telefon, email, sezone FROM listici WHERE id = ?")
    .bind(listicId)
    .first<{ zupa_slug: string; telefon: string | null; email: string | null; sezone: string | null }>();
  if (!l) return odbij(`listić ${listicId} ne postoji`);
  if (d.zupa.slug !== l.zupa_slug) odbij(`zupa.slug: „${d.zupa.slug}” nije glavna župa listića (${l.zupa_slug})`);

  const greske: string[] = [];
  const zupe = [d.zupa.slug, ...(d.zupa.dodatne_zupe ?? [])];
  const { results: postojece } = await db
    .prepare("SELECT slug FROM zupe WHERE slug IN (SELECT value FROM json_each(?))")
    .bind(JSON.stringify(zupe))
    .all<{ slug: string }>();
  for (const z of zupe)
    if (!postojece.some((p) => p.slug === z)) greske.push(`zupa: župa „${z}” ne postoji u uvezenim župama`);

  // crkve_ref je meka veza (migracija 0002): postojanje i župa provjeravaju se ovdje.
  const refovi = d.crkve.flatMap((c) => (c.crkve_ref ? [c.crkve_ref] : []));
  const { results: izvor } = await db
    .prepare("SELECT slug, zupa_slug FROM crkve_izvor WHERE slug IN (SELECT value FROM json_each(?))")
    .bind(JSON.stringify(refovi))
    .all<{ slug: string; zupa_slug: string }>();
  const zupaIzvora = new Map(izvor.map((c) => [c.slug, c.zupa_slug]));
  const crkve = d.crkve.map((c, i) => {
    let zupa = c.zupa_slug;
    if (c.crkve_ref) {
      const iz = zupaIzvora.get(c.crkve_ref);
      if (!iz) greske.push(`crkve[${i}].crkve_ref: crkva „${c.crkve_ref}” ne postoji u crkve_izvor`);
      else if (!zupe.includes(iz)) greske.push(`crkve[${i}].crkve_ref: crkva „${c.crkve_ref}” pripada župi „${iz}” koja nije na listiću`);
      else if (zupa && zupa !== iz) greske.push(`crkve[${i}].zupa_slug: crkva „${c.crkve_ref}” pripada župi „${iz}”, ne „${zupa}”`);
      zupa ??= iz;
    }
    return { ...c, zupa_slug: zupa ?? d.zupa.slug, redoslijed: i };
  });

  const sezone = l.sezone ? (JSON.parse(l.sezone) as Sezone) : undefined;
  try {
    provjeriSezone(d.stalni, sezone);
  } catch (e) {
    greske.push(`stalni: ${(e as Error).message}; granice se zadaju u profilu listića (sezone)`);
  }

  if (b.stanje === "objavljen") {
    if (!d.stalni.length && !d.tjedni.mise.length) greske.push(PORUKA_106_RASPORED);
    if (!l.telefon && !l.email) greske.push(PORUKA_106_KONTAKT);
    const preklop = await db
      .prepare(
        `SELECT godiste, redni_broj FROM brojevi WHERE listic_id = ? AND stanje = 'objavljen'
           AND NOT (godiste = ? AND redni_broj = ?) AND datum_od <= ? AND datum_do >= ? LIMIT 1`,
      )
      .bind(listicId, b.godiste, b.redni_broj, d.tjedni.do, d.tjedni.od)
      .first<{ godiste: number; redni_broj: number }>();
    if (preklop)
      greske.push(
        `tjedni: razdoblje se preklapa s objavljenim brojem ${preklop.redni_broj}/${preklop.godiste}; javni raspored bi imao mise dvaput`,
      );
  }
  if (greske.length) odbij(...greske);

  const broj = "(SELECT id FROM brojevi WHERE listic_id = ? AND godiste = ? AND redni_broj = ?)";
  const bv = [listicId, b.godiste, b.redni_broj];
  const crkva = (izraz: string) => `(SELECT id FROM listic_crkve WHERE listic_id = ? AND kljuc = ${izraz})`;
  const mise = d.tjedni.mise.map((m) => ({ ...m, uz_misu: m.uz_misu ?? null }));
  const nakane = d.tjedni.mise.flatMap((m) =>
    m.nakana ? [{ datum: m.datum, sat: m.sat, crkva: m.crkva, ...m.nakana }] : [],
  );
  const J = (s: string) => `json_extract(j.value, '$.${s}')`;

  await db.batch([
    db.prepare("DELETE FROM listici_zupe WHERE listic_id = ?").bind(listicId),
    db
      .prepare("INSERT INTO listici_zupe (listic_id, zupa_slug) SELECT ?, value FROM json_each(?)")
      .bind(listicId, JSON.stringify(zupe)),

    db
      .prepare(
        `INSERT INTO brojevi (listic_id, godiste, redni_broj, datum_od, datum_do, stanje, objavljeno_u, stvoreno_u, promijenjeno_u)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (listic_id, godiste, redni_broj) DO UPDATE SET
           datum_od = excluded.datum_od, datum_do = excluded.datum_do, stanje = excluded.stanje,
           objavljeno_u = CASE WHEN excluded.stanje = 'objavljen' THEN coalesce(brojevi.objavljeno_u, excluded.objavljeno_u) END,
           promijenjeno_u = excluded.promijenjeno_u`,
      )
      .bind(...bv, d.tjedni.od, d.tjedni.do, b.stanje, b.stanje === "objavljen" ? t : null, t, t),
    db.prepare(`DELETE FROM mise WHERE broj_id = ${broj}`).bind(...bv), // nakane kaskadno
    db.prepare(`DELETE FROM ostali_termini WHERE broj_id = ${broj}`).bind(...bv),
    db.prepare(`DELETE FROM sekcije WHERE broj_id = ${broj}`).bind(...bv),

    db
      .prepare(
        `INSERT INTO listic_crkve (listic_id, kljuc, crkva_izvor_slug, naziv, mjesto, zupa_slug, uloga, redoslijed)
         SELECT ?, ${J("id")}, ${J("crkve_ref")}, ${J("naziv")}, ${J("mjesto")}, ${J("zupa_slug")}, ${J("uloga")}, ${J("redoslijed")}
         FROM json_each(?) j WHERE true
         ON CONFLICT (listic_id, kljuc) DO UPDATE SET crkva_izvor_slug = excluded.crkva_izvor_slug,
           naziv = excluded.naziv, mjesto = excluded.mjesto, zupa_slug = excluded.zupa_slug,
           uloga = excluded.uloga, redoslijed = excluded.redoslijed`,
      )
      .bind(listicId, JSON.stringify(crkve)),
    db
      .prepare(
        `DELETE FROM listic_crkve WHERE listic_id = ? AND kljuc NOT IN (SELECT value FROM json_each(?))
           AND NOT EXISTS (SELECT 1 FROM mise WHERE crkva_id = listic_crkve.id)
           AND NOT EXISTS (SELECT 1 FROM ostali_termini WHERE crkva_id = listic_crkve.id)`,
      )
      .bind(listicId, JSON.stringify(crkve.map((c) => c.id))),

    db
      .prepare("DELETE FROM stalni_raspored WHERE crkva_id IN (SELECT id FROM listic_crkve WHERE listic_id = ?)")
      .bind(listicId),
    db
      .prepare(
        `INSERT INTO stalni_raspored (crkva_id, dani, sat, vrsta, jezik, tjedni_u_mjesecu, vrijedi_od, vrijedi_do,
           sezona, napomena, redoslijed)
         SELECT ${crkva(J("crkva"))}, json_extract(j.value, '$.dani'), ${J("sat")}, ${J("vrsta")}, ${J("jezik")},
           json_extract(j.value, '$.tjedni_u_mjesecu'), ${J("vrijedi_od")}, ${J("vrijedi_do")}, ${J("sezona")},
           ${J("napomena")}, j.key
         FROM json_each(?) j`,
      )
      .bind(listicId, JSON.stringify(d.stalni)),

    db
      .prepare(
        `INSERT INTO mise (broj_id, datum, sat, crkva_id, vrsta, jezik, otkazana, iz_stalnog, uz_misu, napomena)
         SELECT ${broj}, ${J("datum")}, ${J("sat")}, ${crkva(J("crkva"))}, ${J("vrsta")}, ${J("jezik")},
           ${J("otkazana")}, coalesce(${J("iz_stalnog")}, 0), ${J("uz_misu")}, ${J("napomena")}
         FROM json_each(?) j`,
      )
      .bind(...bv, listicId, JSON.stringify(mise)),
    db
      .prepare(
        `INSERT INTO mise_nakane (misa_id, tekst, vrsta, objava)
         SELECT m.id, ${J("tekst")}, ${J("vrsta")}, ${J("objava")}
         FROM json_each(?) j
         JOIN mise m ON m.broj_id = ${broj} AND m.datum = ${J("datum")} AND m.sat = ${J("sat")}
           AND m.crkva_id = ${crkva(J("crkva"))}`,
      )
      .bind(JSON.stringify(nakane), ...bv, listicId),
    db
      .prepare(
        `INSERT INTO ostali_termini (broj_id, datum, sat, do_sata, crkva_id, vrsta, napomena)
         SELECT ${broj}, ${J("datum")}, ${J("sat")}, ${J("do_sata")},
           CASE WHEN ${J("crkva")} IS NULL THEN NULL ELSE ${crkva(J("crkva"))} END, ${J("vrsta")}, ${J("napomena")}
         FROM json_each(?) j`,
      )
      .bind(...bv, listicId, JSON.stringify(d.tjedni.ostali_termini ?? [])),
    ...ubaciSekcije(db, "sekcije", "broj_id", broj, bv, b.sekcije),
    db.prepare("UPDATE listici SET promijenjeno_u = ? WHERE id = ?").bind(t, listicId),
  ]);

  const r = await db.prepare(broj.slice(1, -1)).bind(...bv).first<{ id: number }>();
  return { brojId: r!.id };
}

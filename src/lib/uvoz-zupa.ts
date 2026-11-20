// Uvoz župa iz crkve.domovina.ai u tablice zupe i crkve_izvor (odluke 300–306).
//
// Idempotentan: zapis se piše samo kad se hash preuzetih polja promijeni, pa drugi
// uzastopni uvoz ne mijenja ništa. Slug koji nestane iz indeksa dobiva nestalo_u
// (redak ostaje); ako isti OIB ili SBT_ID dođe pod novim slugom, to je preimenovanje.
import { izvrsi, type Baza, type Upit } from "./baza.ts";
import { izZupeJson, type ZupaIzvor } from "./zupa-izvor.ts";

export const CRKVE_OSNOVA = "https://crkve.domovina.ai/data";

export interface Opcije {
  db: Baza;
  /** Dohvat JSON-a s URL-a; u testovima fixture, u skripti fetch. */
  dohvati: (url: string) => Promise<unknown>;
  osnova?: string;
  /** Koliko detalja župa se dohvaća istodobno (≤ 4 prema crkve.domovina.ai). */
  paralela?: number;
  sada?: () => string;
  /** Ispod ovog udjela aktivnih župa u indeksu uvoz staje (zaštita od pokvarenog indeksa). */
  minUdio?: number;
  napredak?: (gotovo: number, ukupno: number) => void;
}

export interface Rezultat {
  u_indeksu: number;
  nove: string[];
  promijenjene: string[];
  nestale: string[];
  vracene: string[];
  preimenovane: { stari: string; novi: string; kljuc: "oib" | "registry_id" }[];
  greske: { slug: string; poruka: string }[];
  promjena: number;
}

interface Postojeca {
  slug: string;
  oib: string | null;
  registry_id: number | null;
  izvor_hash: string;
  nestalo_u: string | null;
  novi_slug: string | null;
}

async function uParalelu<T, R>(stavke: T[], n: number, f: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(stavke.length);
  let i = 0;
  const radnik = async () => {
    while (i < stavke.length) {
      const k = i++;
      out[k] = await f(stavke[k]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(n, stavke.length) }, radnik));
  return out;
}

function upisi(db: Baza, z: ZupaIzvor, sada: string, nova: boolean): Upit[] {
  const p = z.zupa;
  const polja = [
    p.oib, p.registry_id, p.kind, p.diocese, p.name, p.short_name, p.titular, p.address,
    p.city, p.county, p.lat, p.lng, p.geocode_source, z.trazi, z.hash,
  ];
  const upiti: Upit[] = [
    nova
      ? db.prepare(
          `INSERT INTO zupe (oib, registry_id, kind, diocese, name, short_name, titular, address,
             city, county, lat, lng, geocode_source, trazi, izvor_hash, slug, uvezeno_u, promijenjeno_u)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).bind(...polja, p.slug, sada, sada)
      : db.prepare(
          `UPDATE zupe SET oib = ?, registry_id = ?, kind = ?, diocese = ?, name = ?, short_name = ?,
             titular = ?, address = ?, city = ?, county = ?, lat = ?, lng = ?, geocode_source = ?,
             trazi = ?, izvor_hash = ?, promijenjeno_u = ?, nestalo_u = NULL, novi_slug = NULL
           WHERE slug = ?`,
        ).bind(...polja, sada, p.slug),
    db.prepare("DELETE FROM crkve_izvor WHERE zupa_slug = ?").bind(p.slug),
  ];
  for (const c of z.crkve) {
    upiti.push(
      db.prepare(
        `INSERT OR REPLACE INTO crkve_izvor (slug, zupa_slug, name, kind, city, lat, lng,
           is_parish_church, heritage_id, redoslijed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(c.slug, p.slug, c.name, c.kind, c.city, c.lat, c.lng, c.is_parish_church, c.heritage_id, c.redoslijed),
    );
  }
  return upiti;
}

export async function uveziZupe(o: Opcije): Promise<Rezultat> {
  const { db, dohvati } = o;
  const osnova = o.osnova ?? CRKVE_OSNOVA;
  const sada = o.sada ?? (() => new Date().toISOString());
  const pocetak = sada();

  const indeks = (await dohvati(`${osnova}/zupe-index.json`)) as { items?: { slug?: unknown; kind?: unknown }[] };
  if (!indeks || !Array.isArray(indeks.items)) throw new Error("zupe-index.json nema items");
  const slugovi = [
    ...new Set(indeks.items.filter((i) => i.kind === "zupa" && typeof i.slug === "string").map((i) => i.slug as string)),
  ];

  const { results: stare } = await db
    .prepare("SELECT slug, oib, registry_id, izvor_hash, nestalo_u, novi_slug FROM zupe")
    .all<Postojeca>();
  const postojece = new Map(stare.map((s) => [s.slug, s]));
  const aktivnih = stare.filter((s) => s.nestalo_u === null).length;
  if (aktivnih > 0 && slugovi.length < aktivnih * (o.minUdio ?? 0.5)) {
    throw new Error(`indeks ima ${slugovi.length} župa, a baza ${aktivnih} aktivnih: uvoz zaustavljen`);
  }

  const r: Rezultat = {
    u_indeksu: slugovi.length, nove: [], promijenjene: [], nestale: [], vracene: [], preimenovane: [], greske: [], promjena: 0,
  };

  let gotovo = 0;
  const detalji = await uParalelu(slugovi, Math.min(o.paralela ?? 4, 4), async (slug) => {
    try {
      const z = await izZupeJson(await dohvati(`${osnova}/zupa/${encodeURIComponent(slug)}.json`));
      if (!z) throw new Error("neispravan JSON župe");
      if (z.zupa.slug !== slug) throw new Error(`slug u JSON-u je ${z.zupa.slug}`);
      return z;
    } catch (e) {
      r.greske.push({ slug, poruka: e instanceof Error ? e.message : String(e) });
      return null;
    } finally {
      o.napredak?.(++gotovo, slugovi.length);
    }
  });

  const upiti: Upit[] = [];
  const noviSlugovi: ZupaIzvor[] = [];
  for (const z of detalji) {
    if (!z) continue;
    const st = postojece.get(z.zupa.slug);
    if (!st) {
      r.nove.push(z.zupa.slug);
      noviSlugovi.push(z);
      upiti.push(...upisi(db, z, sada(), true));
    } else if (st.nestalo_u !== null) {
      r.vracene.push(z.zupa.slug);
      upiti.push(...upisi(db, z, sada(), false));
    } else if (st.izvor_hash !== z.hash) {
      r.promijenjene.push(z.zupa.slug);
      upiti.push(...upisi(db, z, sada(), false));
    }
  }

  // Nestanak se računa iz indeksa, ne iz grešaka dohvata: župa čiji detalj nije stigao
  // ostaje kakva je bila.
  const uIndeksu = new Set(slugovi);
  const kandidati: Postojeca[] = [];
  for (const s of stare) {
    if (s.nestalo_u === null && !uIndeksu.has(s.slug)) {
      r.nestale.push(s.slug);
      kandidati.push(s);
      upiti.push(db.prepare("UPDATE zupe SET nestalo_u = ? WHERE slug = ?").bind(sada(), s.slug));
    } else if (s.nestalo_u !== null && s.novi_slug === null && !uIndeksu.has(s.slug)) {
      kandidati.push(s); // nestala ranije, novi slug se možda pojavio tek sad
    }
  }

  for (const s of kandidati) {
    for (const n of noviSlugovi) {
      const kljuc =
        s.oib !== null && s.oib === n.zupa.oib ? "oib"
        : s.registry_id !== null && s.registry_id === n.zupa.registry_id ? "registry_id"
        : null;
      if (!kljuc) continue;
      r.preimenovane.push({ stari: s.slug, novi: n.zupa.slug, kljuc });
      upiti.push(
        db.prepare("UPDATE zupe SET novi_slug = ? WHERE slug = ?").bind(n.zupa.slug, s.slug),
        db.prepare("INSERT OR IGNORE INTO zupe_preimenovanja (stari_slug, novi_slug, kljuc, u) VALUES (?, ?, ?, ?)")
          .bind(s.slug, n.zupa.slug, kljuc, sada()),
      );
      break;
    }
  }

  r.promjena = r.nove.length + r.promijenjene.length + r.nestale.length + r.vracene.length + r.preimenovane.length;
  await izvrsi(db, upiti);
  await db
    .prepare(
      `INSERT INTO uvozi (pocetak, kraj, u_indeksu, nove, promijenjene, nestale, vracene, preimenovane, greske)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(pocetak, sada(), r.u_indeksu, r.nove.length, r.promijenjene.length, r.nestale.length,
      r.vracene.length, r.preimenovane.length, r.greske.length)
    .run();
  return r;
}

// Javni raspored misa župe: ono što smije vidjeti svatko (web, API, „mise u blizini”).
// Odluka 103: samo datum, sat, crkva, vrsta, jezik, napomena (i je li otkazana). Ovaj
// modul svjesno ne čita tablicu s osobnim podacima uz misu; test to provjerava nad
// izvornim kodom i nad SQL-om koji se izvrši.
import type { Baza } from "./baza.ts";
import { brojDana, dani, jeDatum } from "./datum.ts";
import type { Pravilo, VrstaMise } from "./raspored-shema.ts";
import { tjedneMise, type Sezone } from "./tjedne-mise.ts";

export interface JavnaMisa {
  datum: string;
  sat: string;
  crkva: { naziv: string; mjesto: string | null; slug: string | null };
  vrsta: VrstaMise;
  jezik: string;
  napomena: string | null;
  otkazana: boolean;
  /** false = izračun iz stalnog rasporeda: „stalni raspored, nije potvrđen za ovaj tjedan”. */
  potvrdeno: boolean;
}

/** Najdulje razdoblje jednog upita (javni API ne smije vrtjeti generator godinama). */
export const NAJVISE_DANA = 92;

type CrkvaRed = {
  id: number; listic_id: number; naziv: string; mjesto: string | null; slug: string | null;
  redoslijed: number; sezone: string | null;
};
type MisaRed = {
  datum: string; sat: string; crkva_id: number; vrsta: VrstaMise; jezik: string; napomena: string | null; otkazana: number;
};
type PraviloRed = {
  crkva_id: number; dani: string; sat: string; vrsta: VrstaMise; jezik: string; tjedni_u_mjesecu: string | null;
  vrijedi_od: string | null; vrijedi_do: string | null; sezona: Pravilo["sezona"]; napomena: string | null;
};

/**
 * Mise župe za [od, do]. Ulaze samo listići s bar jednim objavljenim brojem i samo crkve
 * te župe (listić može pokrivati više župa). Dani koje pokriva objavljeni broj s tjednim
 * misama daju te mise (`potvrdeno: true`); ostali dani, i broj bez tjednih misa („samo
 * stalni raspored”), izračun iz stalnog rasporeda (`false`). Nacrti se nikad ne vide.
 */
export async function javneMise(
  db: Baza,
  zupaSlug: string,
  od: string,
  do_: string,
  opcije: { jeBlagdan?: (datum: string) => boolean } = {},
): Promise<JavnaMisa[]> {
  if (!jeDatum(od) || !jeDatum(do_) || od > do_) throw new RangeError(`Neispravno razdoblje ${od} – ${do_}`);
  if (brojDana(od, do_) > NAJVISE_DANA) throw new RangeError(`Razdoblje je dulje od ${NAJVISE_DANA} dana`);

  const { results: crkve } = await db
    .prepare(
      `SELECT c.id, c.listic_id, c.naziv, c.mjesto, c.crkva_izvor_slug AS slug, c.redoslijed, l.sezone
       FROM listic_crkve c JOIN listici l ON l.id = c.listic_id
       WHERE c.zupa_slug = ?
         AND EXISTS (SELECT 1 FROM brojevi b WHERE b.listic_id = c.listic_id AND b.stanje = 'objavljen')`,
    )
    .bind(zupaSlug)
    .all<CrkvaRed>();
  if (!crkve.length) return [];

  const { results: brojevi } = await db
    .prepare(
      `SELECT listic_id, datum_od, datum_do FROM brojevi
       WHERE stanje = 'objavljen' AND datum_od <= ? AND datum_do >= ?
         AND listic_id IN (SELECT listic_id FROM listic_crkve WHERE zupa_slug = ?)
         AND EXISTS (SELECT 1 FROM mise WHERE mise.broj_id = brojevi.id)`,
    )
    .bind(do_, od, zupaSlug)
    .all<{ listic_id: number; datum_od: string; datum_do: string }>();

  const { results: mise } = await db
    .prepare(
      `SELECT m.datum, m.sat, m.crkva_id, m.vrsta, m.jezik, m.napomena, m.otkazana
       FROM mise m
       JOIN brojevi b ON b.id = m.broj_id
       JOIN listic_crkve c ON c.id = m.crkva_id
       WHERE b.stanje = 'objavljen' AND c.zupa_slug = ? AND m.datum BETWEEN ? AND ?`,
    )
    .bind(zupaSlug, od, do_)
    .all<MisaRed>();

  const { results: pravila } = await db
    .prepare(
      `SELECT s.crkva_id, s.dani, s.sat, s.vrsta, s.jezik, s.tjedni_u_mjesecu, s.vrijedi_od, s.vrijedi_do,
              s.sezona, s.napomena
       FROM stalni_raspored s JOIN listic_crkve c ON c.id = s.crkva_id
       WHERE c.zupa_slug = ?
       ORDER BY c.listic_id, s.redoslijed, s.id`,
    )
    .bind(zupaSlug)
    .all<PraviloRed>();

  const crkvaPoId = new Map(crkve.map((c) => [c.id, c]));
  const javna = (c: CrkvaRed) => ({ naziv: c.naziv, mjesto: c.mjesto, slug: c.slug });
  const van: (JavnaMisa & { red: [number, number] })[] = mise.map((m) => {
    const c = crkvaPoId.get(m.crkva_id)!;
    return {
      datum: m.datum, sat: m.sat, crkva: javna(c), vrsta: m.vrsta, jezik: m.jezik,
      napomena: m.napomena, otkazana: m.otkazana === 1, potvrdeno: true, red: [c.listic_id, c.redoslijed],
    };
  });

  // Dani bez objavljenog broja: stalni raspored, po listiću.
  for (const listicId of new Set(crkve.map((c) => c.listic_id))) {
    const pokriveno = new Set(
      brojevi
        .filter((b) => b.listic_id === listicId)
        .flatMap((b) => dani(b.datum_od > od ? b.datum_od : od, b.datum_do < do_ ? b.datum_do : do_)),
    );
    if (pokriveno.size === brojDana(od, do_)) continue;
    const svoje = crkve.filter((c) => c.listic_id === listicId).sort((a, b) => a.redoslijed - b.redoslijed);
    const sezone = svoje[0].sezone ? (JSON.parse(svoje[0].sezone) as Sezone) : {};
    const ids = new Set(svoje.map((c) => c.id));
    const p: Pravilo[] = pravila
      .filter((r) => ids.has(r.crkva_id) && (!r.sezona || sezone[r.sezona])) // sezona bez granica se preskače
      .map((r) => ({
        crkva: String(r.crkva_id),
        dani: JSON.parse(r.dani),
        sat: r.sat,
        vrsta: r.vrsta,
        jezik: r.jezik,
        tjedni_u_mjesecu: r.tjedni_u_mjesecu ? JSON.parse(r.tjedni_u_mjesecu) : undefined,
        vrijedi_od: r.vrijedi_od,
        vrijedi_do: r.vrijedi_do,
        sezona: r.sezona,
        napomena: r.napomena ?? undefined,
      }));
    const izracun = tjedneMise(svoje.map((c) => ({ id: String(c.id) })), p, od, do_, { sezone, jeBlagdan: opcije.jeBlagdan });
    for (const m of izracun) {
      if (pokriveno.has(m.datum)) continue;
      const c = crkvaPoId.get(Number(m.crkva))!;
      van.push({
        datum: m.datum, sat: m.sat, crkva: javna(c), vrsta: m.vrsta, jezik: m.jezik,
        napomena: m.napomena ?? null, otkazana: false, potvrdeno: false, red: [c.listic_id, c.redoslijed],
      });
    }
  }

  return van
    .sort(
      (a, b) =>
        a.datum.localeCompare(b.datum) || a.sat.localeCompare(b.sat) || a.red[0] - b.red[0] || a.red[1] - b.red[1],
    )
    .map(({ red: _, ...m }) => m);
}

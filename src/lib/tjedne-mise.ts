// Tjedne mise iz stalnog rasporeda, iznimke kao operacije nad listom i razlika
// stvarno ↔ stalno za prikaz „promjena!” (odluka 104: iznimka se ne zapisuje, izračuna se).
import { danUTjednu, dani, dodajDane, tjedanUMjesecu } from "./datum.ts";
import { misaShema, type Misa, type MisaUlaz, type Pravilo, type Sezona } from "./raspored-shema.ts";

/** Granice sezone kao 'MM-DD'; od > do znači preko Nove godine (zimsko 10-01 – 04-30). */
export interface GranicaSezone {
  od: string;
  do: string;
}
export type Sezone = Partial<Record<Sezona, GranicaSezone>>;

export interface OpcijeGeneratora {
  sezone?: Sezone;
  /** Liturgijski kalendar (S3). Bez nje pravila s danom „blagdan” ne daju misu. */
  jeBlagdan?: (datum: string) => boolean;
}

export class GreskaRasporeda extends Error {
  constructor(poruka: string) {
    super(poruka);
    this.name = "GreskaRasporeda";
  }
}

export interface KljucMise {
  datum: string;
  sat: string;
  crkva: string;
}
type CrkvaId = { id: string };

const kljuc = (m: KljucMise) => `${m.datum} ${m.sat} ${m.crkva}`;
const MM_DD = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

function uSezoni(datum: string, g: GranicaSezone): boolean {
  const md = datum.slice(5);
  return g.od <= g.do ? md >= g.od && md <= g.do : md >= g.od || md <= g.do;
}

export function provjeriSezone(pravila: Pravilo[], sezone: Sezone | undefined): void {
  for (const [ime, g] of Object.entries(sezone ?? {})) {
    if (!g || !MM_DD.test(g.od) || !MM_DD.test(g.do))
      throw new GreskaRasporeda(`Granice sezone „${ime}” moraju biti {od: 'MM-DD', do: 'MM-DD'}`);
  }
  for (const p of pravila) {
    if (p.sezona && !sezone?.[p.sezona])
      throw new GreskaRasporeda(
        `Pravilo ${p.crkva} ${p.dani.join(",")} ${p.sat} vrijedi u sezoni „${p.sezona}”, a granice te sezone nisu zadane (opcija sezone)`,
      );
  }
}

/** Deterministički poredak: datum, sat, redoslijed crkve u listiću. */
export function poredaj<T extends KljucMise>(mise: T[], crkve: CrkvaId[]): T[] {
  const red = new Map(crkve.map((c, i) => [c.id, i]));
  const r = (id: string) => red.get(id) ?? Number.MAX_SAFE_INTEGER;
  return [...mise].sort(
    (a, b) => a.datum.localeCompare(b.datum) || a.sat.localeCompare(b.sat) || r(a.crkva) - r(b.crkva),
  );
}

/**
 * Mise iz stalnih pravila za [od, do], sve s `iz_stalnog: true`.
 *
 * - `vrijedi_od`/`vrijedi_do` i `sezona` ograničavaju pravilo; sezona bez granica je greška.
 * - `tjedni_u_mjesecu` [1, 3] = prvi i treći takav dan u mjesecu (5 = peti, kad ga ima);
 *   vrijedi samo za dane u tjednu, ne za „blagdan”.
 * - Na blagdan (`jeBlagdan`) blagdanska pravila crkve zamjenjuju njena pravila tog dana u
 *   tjednu; crkva bez blagdanskog pravila ima svoj redovni raspored.
 * - Ista crkva, dan i sat iz dva pravila daju jednu misu (prvo pravilo pobjeđuje).
 */
export function tjedneMise(
  crkve: CrkvaId[],
  pravila: Pravilo[],
  od: string,
  do_: string,
  opcije: OpcijeGeneratora = {},
): Misa[] {
  provjeriSezone(pravila, opcije.sezone);
  const poznate = new Set(crkve.map((c) => c.id));
  for (const p of pravila)
    if (!poznate.has(p.crkva)) throw new GreskaRasporeda(`Pravilo navodi crkvu „${p.crkva}” koje nema u crkvama`);

  const vrijedi = (p: Pravilo, d: string) =>
    (!p.vrijedi_od || d >= p.vrijedi_od) &&
    (!p.vrijedi_do || d <= p.vrijedi_do) &&
    (!p.sezona || uSezoni(d, opcije.sezone![p.sezona]!));

  const van = new Map<string, Misa>();
  for (const d of dani(od, do_)) {
    const dan = danUTjednu(d);
    const blagdan = opcije.jeBlagdan?.(d) ?? false;
    const vazeca = pravila.filter((p) => vrijedi(p, d));
    const sBlagdanom = new Set(blagdan ? vazeca.filter((p) => p.dani.includes("blagdan")).map((p) => p.crkva) : []);
    for (const p of vazeca) {
      const pogodak =
        (blagdan && p.dani.includes("blagdan")) ||
        (p.dani.includes(dan) &&
          !sBlagdanom.has(p.crkva) &&
          (!p.tjedni_u_mjesecu?.length || p.tjedni_u_mjesecu.includes(tjedanUMjesecu(d))));
      if (!pogodak) continue;
      const m: Misa = {
        datum: d,
        sat: p.sat,
        crkva: p.crkva,
        vrsta: p.vrsta,
        jezik: p.jezik,
        otkazana: false,
        iz_stalnog: true,
        ...(p.napomena ? { napomena: p.napomena } : {}),
      };
      if (!van.has(kljuc(m))) van.set(kljuc(m), m);
    }
  }
  return poredaj([...van.values()], crkve);
}

function nadi(mise: Misa[], k: KljucMise): number {
  const i = mise.findIndex((m) => kljuc(m) === kljuc(k));
  if (i < 0) throw new GreskaRasporeda(`Nema mise ${kljuc(k)}`);
  return i;
}

/** „Nema svete mise”: misa ostaje u listi s `otkazana: true` (prikazuje se, ne briše). */
export function otkazi(mise: Misa[], k: KljucMise, napomena?: string): Misa[] {
  const i = nadi(mise, k);
  return mise.map((m, j) => (j === i ? { ...m, otkazana: true, ...(napomena ? { napomena } : {}) } : m));
}

/** Dodatna misa (sprovodna, zavjetna…), `iz_stalnog: false`. */
export function dodaj(mise: Misa[], misa: MisaUlaz, crkve: CrkvaId[]): Misa[] {
  const nova = misaShema.parse({ ...misa, iz_stalnog: false });
  if (mise.some((m) => kljuc(m) === kljuc(nova))) throw new GreskaRasporeda(`Misa ${kljuc(nova)} već postoji`);
  return poredaj([...mise, nova], crkve);
}

/** Drugi sat, datum ili crkva; premještena misa više nije iz stalnog rasporeda. */
export function premjesti(mise: Misa[], k: KljucMise, u: Partial<KljucMise>, crkve: CrkvaId[]): Misa[] {
  const i = nadi(mise, k);
  const nova: Misa = { ...mise[i], ...u, iz_stalnog: false };
  if (mise.some((m, j) => j !== i && kljuc(m) === kljuc(nova)))
    throw new GreskaRasporeda(`Misa ${kljuc(nova)} već postoji`);
  return poredaj(
    mise.map((m, j) => (j === i ? nova : m)),
    crkve,
  );
}

/**
 * Promjena stalnog rasporeda od datuma (zimski → ljetni, „od 1. 11.”): pravila crkava u
 * opsegu koja vrijede na `datum` ili kasnije dobivaju `vrijedi_do` = dan prije, pravila koja
 * počinju tek od `datum` otpadaju, a nova dobivaju `vrijedi_od` = `datum`. Opseg su crkve
 * novih pravila, ili `crkve` kad su zadane (prazna nova pravila uz crkve = ukidanje).
 */
export function promijeniRasporedOd(
  pravila: Pravilo[],
  datum: string,
  nova: Pravilo[],
  crkve?: string[],
): Pravilo[] {
  const opseg = new Set(crkve ?? nova.map((p) => p.crkva));
  const dan_prije = dodajDane(datum, -1);
  const stara = pravila.flatMap((p): Pravilo[] => {
    if (!opseg.has(p.crkva)) return [p];
    if (p.vrijedi_od && p.vrijedi_od >= datum) return [];
    if (p.vrijedi_do && p.vrijedi_do < datum) return [p];
    return [{ ...p, vrijedi_do: dan_prije }];
  });
  return [
    ...stara,
    ...nova.map((p) => ({ ...p, vrijedi_od: p.vrijedi_od && p.vrijedi_od > datum ? p.vrijedi_od : datum })),
  ];
}

export interface Razlika {
  /** U tjednom, a stalni ih ne predviđa. */
  dodane: Misa[];
  /** „Nema svete mise”. */
  otkazane: Misa[];
  /** Isti dan, druga crkva (isti sat) ili drugi sat (ista crkva, najbliži). */
  premjestene: { iz: Misa; u: Misa }[];
  /** Isti dan, sat i crkva, druga vrsta ili jezik. */
  promijenjene: { stalno: Misa; stvarno: Misa; polja: ("vrsta" | "jezik")[] }[];
  /** Stalni ih predviđa, a u tjednom ih nema (ni kao otkazane). */
  izostavljene: Misa[];
}

/**
 * Razlika tjednih misa prema stalnom rasporedu za isto razdoblje. Premještaj na drugi dan
 * se ne prepoznaje (dvosmisleno): vidi se kao izostavljena + dodana.
 */
export function razlika(
  mise: Misa[],
  pravila: Pravilo[],
  crkve: CrkvaId[],
  od: string,
  do_: string,
  opcije: OpcijeGeneratora = {},
): Razlika {
  const ocekivane = tjedneMise(crkve, pravila, od, do_, opcije);
  const poKljucu = new Map(ocekivane.map((m) => [kljuc(m), m]));
  const r: Razlika = { dodane: [], otkazane: [], premjestene: [], promijenjene: [], izostavljene: [] };
  const neupareneStvarne: Misa[] = [];

  for (const m of poredaj(mise, crkve)) {
    const e = poKljucu.get(kljuc(m));
    if (m.otkazana) r.otkazane.push(m);
    if (!e) {
      if (!m.otkazana) neupareneStvarne.push(m);
      continue;
    }
    poKljucu.delete(kljuc(m));
    if (m.otkazana) continue;
    const polja = (["vrsta", "jezik"] as const).filter((p) => m[p] !== e[p]);
    if (polja.length) r.promijenjene.push({ stalno: e, stvarno: m, polja: [...polja] });
  }

  // Uparivanje u premještaje: prvo isti dan i sat (druga crkva), zatim ista crkva i dan
  // s najbližim satom.
  const preostale = [...poKljucu.values()];
  const minute = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3));
  const upari = (a: Misa, isti: (e: Misa) => boolean) => {
    let i = -1;
    for (const [j, e] of preostale.entries())
      if (isti(e) && (i < 0 || Math.abs(minute(e.sat) - minute(a.sat)) < Math.abs(minute(preostale[i].sat) - minute(a.sat))))
        i = j;
    if (i < 0) return false;
    r.premjestene.push({ iz: preostale[i], u: a });
    preostale.splice(i, 1);
    return true;
  };
  const ostale = neupareneStvarne.filter((a) => !upari(a, (e) => e.datum === a.datum && e.sat === a.sat));
  r.dodane = ostale.filter((a) => !upari(a, (e) => e.datum === a.datum && e.crkva === a.crkva));
  r.premjestene = poredaj(r.premjestene.map((p) => ({ ...p.u, p })), crkve).map((x) => x.p);
  r.izostavljene = preostale;
  return r;
}

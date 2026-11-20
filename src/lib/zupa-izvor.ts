// Pretvorba JSON-a župe iz crkve.domovina.ai u retke za bazu.
//
// Polja se preuzimaju po POPISU DOPUŠTENIH, ne brišu se zabranjena: što god crkve
// sutra doda (npr. još jedno polje iz Google Placesa), ovdje ne ulazi dok ga netko
// svjesno ne doda u popis. Odluka 3 i 303: phone, website, email, google_maps_uri i
// koordinate s geocode_source == 'places' su iz Google Placesa i ne preuzimaju se.

/** Izvori koordinata župe u crkve koji NISU Google (scripts/11, 12, 14 i najavljeni DGU). */
export const DOPUSTENI_GEO_IZVORI = new Set(["church", "naselje-centroid", "nominatim", "dgu"]);

export interface Zupa {
  slug: string;
  oib: string | null;
  registry_id: number | null;
  kind: string;
  diocese: string | null;
  name: string;
  short_name: string | null;
  titular: string | null;
  address: string | null;
  city: string | null;
  county: string | null;
  lat: number | null;
  lng: number | null;
  geocode_source: string | null;
}

export interface Crkva {
  slug: string;
  name: string;
  kind: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  is_parish_church: number;
  heritage_id: string | null;
  redoslijed: number;
}

export interface ZupaIzvor {
  zupa: Zupa;
  crkve: Crkva[];
  trazi: string;
  hash: string;
}

type Sirovo = Record<string, unknown>;

const tekst = (v: unknown): string | null => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);
const broj = (v: unknown): number | null => {
  const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
};

/** Mala slova bez dijakritika (č→c, đ→d), za pretragu bez obzira na tipkovnicu. */
export function normaliziraj(s: string): string {
  return s
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function sha256(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function crkva(c: Sirovo, i: number): Crkva | null {
  const slug = tekst(c.slug);
  const name = tekst(c.name);
  if (!slug || !name) return null;
  return {
    slug,
    name,
    kind: tekst(c.kind),
    city: tekst(c.city),
    // Koordinate crkava su iz OSM-a/Wikidate; Places u crkve za crkve samo
    // potvrđuje (geo_verified), a to polje se ne izvozi niti preuzima.
    lat: broj(c.lat),
    lng: broj(c.lng),
    is_parish_church: c.is_parish_church ? 1 : 0,
    heritage_id: tekst(c.heritage_id),
    redoslijed: i,
  };
}

/** JSON iz data/zupa/<slug>.json → zapis za bazu, ili null ako nije upotrebljiv. */
export async function izZupeJson(j: unknown): Promise<ZupaIzvor | null> {
  if (!j || typeof j !== "object") return null;
  const r = j as Sirovo;
  const slug = tekst(r.slug);
  const name = tekst(r.name);
  const kind = tekst(r.kind);
  if (!slug || !name || !kind) return null;

  const geocode_source = tekst(r.geocode_source);
  const geoSmije = geocode_source !== null && DOPUSTENI_GEO_IZVORI.has(geocode_source);
  const zupa: Zupa = {
    slug,
    oib: tekst(r.oib),
    registry_id: broj(r.registry_id),
    kind,
    diocese: tekst(r.diocese),
    name,
    short_name: tekst(r.short_name),
    titular: tekst(r.titular),
    address: tekst(r.address),
    city: tekst(r.city),
    county: tekst(r.county),
    lat: geoSmije ? broj(r.lat) : null,
    lng: geoSmije ? broj(r.lng) : null,
    geocode_source,
  };
  const crkve = (Array.isArray(r.churches) ? r.churches : [])
    .map((c, i) => (c && typeof c === "object" ? crkva(c as Sirovo, i) : null))
    .filter((c): c is Crkva => c !== null);
  const trazi = normaliziraj([zupa.name, zupa.short_name, zupa.titular, zupa.city].filter(Boolean).join(" "));
  // Hash samo preuzetih polja: promjena telefona ili weba u crkve nije promjena ovdje.
  const hash = await sha256(JSON.stringify({ zupa, crkve }));
  return { zupa, crkve, trazi, hash };
}

/** Naslov za prikaz: „Župa sv. Nikole Biskupa, Jastrebarsko”. */
export function naslov(z: { name: string; short_name: string | null; city: string | null; kind: string }): string {
  const ime = z.kind === "zupa" && z.short_name ? `Župa ${z.short_name}` : (z.short_name ?? z.name);
  // Neki short_name već završava mjestom („Preobraženja Gospodnjega, Jastrebarsko”).
  return z.city && !normaliziraj(ime).endsWith(normaliziraj(z.city)) ? `${ime}, ${z.city}` : ime;
}

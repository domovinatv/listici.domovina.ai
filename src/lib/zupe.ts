// Čitanje uvezenih župa za stranice.
import type { Baza } from "./baza.ts";
import { normaliziraj } from "./zupa-izvor.ts";

export interface ZupaRed {
  slug: string;
  name: string;
  short_name: string | null;
  kind: string;
  titular: string | null;
  diocese: string | null;
  address: string | null;
  city: string | null;
  county: string | null;
  nestalo_u: string | null;
  novi_slug: string | null;
}

export interface CrkvaRed {
  slug: string;
  name: string;
  kind: string | null;
  city: string | null;
  is_parish_church: number;
}

const STUPCI = "slug, name, short_name, kind, titular, diocese, address, city, county, nestalo_u, novi_slug";

export async function zupa(db: Baza, slug: string): Promise<{ zupa: ZupaRed; crkve: CrkvaRed[] } | null> {
  const z = await db.prepare(`SELECT ${STUPCI} FROM zupe WHERE slug = ?`).bind(slug).first<ZupaRed>();
  if (!z) return null;
  const { results } = await db
    .prepare("SELECT slug, name, kind, city, is_parish_church FROM crkve_izvor WHERE zupa_slug = ? ORDER BY redoslijed")
    .bind(slug)
    .all<CrkvaRed>();
  return { zupa: z, crkve: results };
}

/** Aktivne župe čiji naziv, titular ili mjesto sadrži sve riječi upita (bez dijakritika). */
export async function trazi(db: Baza, upit: string, limit = 50): Promise<ZupaRed[]> {
  const rijeci = normaliziraj(upit).split(" ").filter((r) => r.length > 0).slice(0, 6);
  if (rijeci.length === 0) return [];
  const uvjet = rijeci.map(() => "trazi LIKE ? ESCAPE '\\'").join(" AND ");
  const vrijednosti = rijeci.map((r) => `%${r.replace(/[\\%_]/g, (z) => `\\${z}`)}%`);
  const { results } = await db
    .prepare(`SELECT ${STUPCI} FROM zupe WHERE nestalo_u IS NULL AND ${uvjet} ORDER BY city, name LIMIT ?`)
    .bind(...vrijednosti, limit)
    .all<ZupaRed>();
  return results;
}

// Primjer rasporeda iz obrasca: čita se iz markdowna, da dokument i test ne mogu razići.
import { readFileSync } from "node:fs";

export const OBRAZAC = new URL("../docs/research/2026-11-20-obrazac-listica.md", import.meta.url);

/** ```json blok iz pododjeljka „### Primjer” u obrascu. */
export function primjerIzObrasca(): unknown {
  const md = readFileSync(OBRAZAC, "utf8");
  const pocetak = md.indexOf("\n### Primjer\n");
  if (pocetak < 0) throw new Error("obrazac nema pododjeljak ### Primjer");
  const kraj = md.indexOf("\n## ", pocetak);
  const blok = md.slice(pocetak, kraj < 0 ? undefined : kraj).match(/```json\n([\s\S]*?)\n```/);
  if (!blok) throw new Error("### Primjer nema ```json blok");
  return JSON.parse(blok[1]);
}

/** Granice sezona koje primjer pretpostavlja (u profilu listića). */
export const SEZONE_PRIMJERA = { zimsko: { od: "10-01", do: "04-30" }, ljetno: { od: "05-01", do: "09-30" } };

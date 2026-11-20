// Sat mise u zapisima iz listića („8,00”, „8h”, „18:30h”, „8 i 10”, „u 18 sati”) → 'HH:MM'.

export class NeispravanSat extends Error {
  constructor(
    readonly zapis: string,
    readonly tekst: string,
  ) {
    super(`Neispravan sat „${zapis}” u „${tekst}”: sat mora biti 0–23, minute dvije znamenke 00–59`);
    this.name = "NeispravanSat";
  }
}

/**
 * Svi sati iz teksta, sortirani i bez ponavljanja.
 *
 * Tekst bez ijednog broja („nema mise”, prazno) daje []: polje sata u slobodnom tekstu
 * smije biti bez sata. Broj koji jest zapis sata, ali nemoguć („25:00”, „8:75”, „8:5”,
 * „830”), baca `NeispravanSat`: tiho ispuštanje bi izgubilo misu iz rasporeda.
 * Redni broj („3. nedjelja”: broj, točka, bez znamenke iza) nije sat i preskače se.
 */
export function normalizirajSate(tekst: string): string[] {
  const sati = new Set<string>();
  for (const m of tekst.matchAll(/(\d+)(?:([:.,])(\d+))?/g)) {
    const [zapis, h, sep, min] = m;
    const iza = tekst.slice(m.index! + zapis.length);
    if (sep === undefined && /^\.(?!\d)/.test(iza)) continue; // redni broj
    if (h.length > 2 || Number(h) > 23) throw new NeispravanSat(zapis, tekst);
    if (min !== undefined && (min.length !== 2 || Number(min) > 59)) throw new NeispravanSat(zapis, tekst);
    sati.add(`${h.padStart(2, "0")}:${min ?? "00"}`);
  }
  return [...sati].sort();
}

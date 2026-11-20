// Profil listića (unosi se jednom, odluka 101) i broj sa sekcijama.
import { z } from "zod";

/** Kanonski tipovi sekcija: tablica „Sekcije” u docs/research/2026-11-20-obrazac-listica.md. */
export const TIPOVI_SEKCIJA = [
  "zaglavlje", "raspored_misa", "kontakt", "obavijesti", "liturgijski_naslov", "razmatranje",
  "evandjelje", "navod_citanja", "dogadaji", "darovi", "zajednice", "sakramenti",
  "ispovijed_klanjanje", "kateheza", "pokojnici", "slobodni",
] as const;

/**
 * Uvijek osjetljive po odluci 204 (sakramenti uključuju ženidbene navještaje). Darovi i
 * zajednice su osjetljivi kad nose imena ili iznose: to označi urednik. Nakane nisu sekcija,
 * nego tablica mise_nakane.
 */
export const UVIJEK_OSJETLJIVE: readonly TipSekcije[] = ["sakramenti", "pokojnici"];

export type TipSekcije = (typeof TIPOVI_SEKCIJA)[number];

export const sekcijaShema = z
  .strictObject({
    tip: z.enum(TIPOVI_SEKCIJA),
    naslov: z.string().optional(),
    sadrzaj: z.string().optional(),
    osjetljivo: z.boolean().optional(),
  })
  .superRefine((s, ctx) => {
    if (UVIJEK_OSJETLJIVE.includes(s.tip) && s.osjetljivo === false)
      ctx.addIssue({
        code: "custom",
        path: ["osjetljivo"],
        message: `sekcija „${s.tip}” je uvijek osjetljiva (odluka 204) i ne može imati osjetljivo: false`,
      });
  })
  .transform((s) => ({ ...s, osjetljivo: s.osjetljivo ?? UVIJEK_OSJETLJIVE.includes(s.tip) }));

/** IBAN bez razmaka, velikim slovima, s ispravnim kontrolnim brojem (ISO 13616, mod 97). */
const iban = z
  .string()
  .transform((s) => s.replace(/\s+/g, "").toUpperCase())
  .refine((s) => /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(s) && mod97(s) === 1, "IBAN nije ispravan");

function mod97(iban: string): number {
  const preslozen = iban.slice(4) + iban.slice(0, 4);
  let ostatak = 0;
  for (const z of preslozen) {
    const broj = /\d/.test(z) ? z : String(z.charCodeAt(0) - 55);
    for (const c of broj) ostatak = (ostatak * 10 + Number(c)) % 97;
  }
  return ostatak;
}

const granica = z.strictObject({
  od: z.string().regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, "granica sezone je MM-DD"),
  do: z.string().regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, "granica sezone je MM-DD"),
});

export const profilShema = z.strictObject({
  zupa_slug: z.string().trim().min(1),
  naziv: z.string().trim().min(1, "listić mora imati naziv"),
  podnaslov: z.string().optional(),
  /** Samo ono što urednik sam unese (odluka 206), nikad iz Google Placesa (odluka 303). */
  kontakt: z
    .strictObject({
      adresa: z.string().optional(),
      telefon: z.string().regex(/^\+?[0-9 ()/-]{6,20}$/, "telefon smije imati znamenke, razmake, + ( ) / -").optional(),
      email: z.email("e-mail nije ispravan").optional(),
      web: z.httpUrl("web mora biti http(s) adresa").optional(),
    })
    .default({}),
  uredovno_vrijeme: z.string().optional(),
  iban: iban.optional(),
  primatelj: z.string().optional(),
  /** Granice sezona za pravila sa `sezona` (opcija generatora tjednih misa). */
  sezone: z.strictObject({ zimsko: granica.optional(), ljetno: granica.optional() }).optional(),
  blokovi: z.array(sekcijaShema).default([]),
});

export const brojShema = z.strictObject({
  godiste: z.number().int().positive(),
  redni_broj: z.number().int().positive(),
  stanje: z.enum(["nacrt", "objavljen"]).default("nacrt"),
  sekcije: z.array(sekcijaShema).default([]),
});

export type Profil = z.infer<typeof profilShema>;
export type ProfilUlaz = z.input<typeof profilShema>;
export type Sekcija = z.infer<typeof sekcijaShema>;
export type Broj = z.infer<typeof brojShema>;
export type BrojUlaz = z.input<typeof brojShema>;

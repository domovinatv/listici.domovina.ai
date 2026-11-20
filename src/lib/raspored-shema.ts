// Dokument rasporeda misa listića, vjerno JSON shemi `raspored-misa.json` iz
// docs/research/2026-11-20-obrazac-listica.md, plus provjere koje JSON shema ne može
// izraziti (crkve po id-u, datumi unutar razdoblja, odluka 203).
import { z } from "zod";
import { jeDatum } from "./datum.ts";

export const VRSTE_MISE = [
  "redovna", "nedjeljna", "blagdanska", "zornica", "vjencana", "sprovodna",
  "obiteljska", "djecja", "mladi", "ostalo",
] as const;
export const DANI_PRAVILA = ["pon", "uto", "sri", "cet", "pet", "sub", "ned", "blagdan"] as const;
export const ULOGE_CRKVE = ["zupna", "filijala", "kapela", "ostalo"] as const;
export const UZ_MISU = ["krunica", "ispovijed", "klanjanje", "blagoslov", "procesija", "ostalo"] as const;
export const VRSTE_NAKANE = ["pojedinacna", "skupna", "zajednicka", "bez_nakane"] as const;
export const VRSTE_TERMINA = ["klanjanje", "ispovijed", "krunica", "pobožnost", "ostalo"] as const;
export const SEZONE = ["zimsko", "ljetno"] as const;

export const PORUKA_203 =
  "objava 'papir_i_web' nije dopuštena: nakane se nikad ne objavljuju na webu ni u API-ju (odluka 203); dopušteno je 'papir' ili 'nigdje'";

const datum = z.string().refine(jeDatum, "datum mora biti postojeći dan u obliku YYYY-MM-DD");
const sat = z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/, "sat mora biti HH:MM (00:00–23:59)");
const jezik = z
  .string()
  .regex(/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/, "jezik mora biti oznaka BCP 47 (hr, sq, de-AT)")
  .default("hr");
const vrsta = z.enum(VRSTE_MISE).default("redovna");
const neprazan = z.string().trim().min(1, "ne smije biti prazno");

export const crkvaShema = z.strictObject({
  id: neprazan,
  crkve_ref: z.string().nullable().optional(),
  naziv: neprazan,
  mjesto: z.string().optional(),
  zupa_slug: z.string().optional(),
  uloga: z.enum(ULOGE_CRKVE),
});

export const praviloShema = z
  .strictObject({
    crkva: neprazan,
    dani: z.array(z.enum(DANI_PRAVILA)).min(1, "pravilo mora imati bar jedan dan"),
    sat,
    vrsta,
    jezik,
    tjedni_u_mjesecu: z.array(z.number().int().min(1).max(5)).optional(),
    vrijedi_od: datum.nullable().optional(),
    vrijedi_do: datum.nullable().optional(),
    sezona: z.enum(SEZONE).nullable().default(null),
    napomena: z.string().optional(),
  })
  .refine((p) => !p.vrijedi_od || !p.vrijedi_do || p.vrijedi_od <= p.vrijedi_do, {
    message: "vrijedi_od mora biti prije ili jednak vrijedi_do",
    path: ["vrijedi_do"],
  });

export const nakanaShema = z.strictObject({
  tekst: z.string().optional(),
  vrsta: z.enum(VRSTE_NAKANE).optional(),
  objava: z
    .enum(["papir", "nigdje"], {
      error: (iss) => (iss.input === "papir_i_web" ? PORUKA_203 : "objava mora biti 'papir' ili 'nigdje'"),
    })
    .default("papir"),
});

export const misaShema = z.strictObject({
  datum,
  sat,
  crkva: neprazan,
  vrsta,
  jezik,
  otkazana: z.boolean().default(false),
  iz_stalnog: z.boolean().optional(),
  nakana: nakanaShema.nullable().optional(),
  uz_misu: z.array(z.enum(UZ_MISU)).optional(),
  napomena: z.string().optional(),
});

export const terminShema = z.strictObject({
  datum,
  sat, // shema obrasca ne traži uzorak; ovdje isti HH:MM kao misa
  do_sata: sat.nullable().optional(),
  crkva: z.string().optional(),
  vrsta: z.enum(VRSTE_TERMINA),
  napomena: z.string().optional(),
});

export const rasporedShema = z
  .strictObject({
    zupa: z.strictObject({
      slug: neprazan,
      dodatne_zupe: z.array(neprazan).optional(),
    }),
    crkve: z.array(crkvaShema).min(1, "listić mora imati bar jednu crkvu"),
    stalni: z.array(praviloShema),
    tjedni: z.strictObject({
      od: datum,
      do: datum,
      mise: z.array(misaShema),
      ostali_termini: z.array(terminShema).optional(),
    }),
  })
  .superRefine((d, ctx) => {
    const greska = (path: (string | number)[], message: string) => ctx.addIssue({ code: "custom", path, message });

    const zupe = new Set([d.zupa.slug]);
    for (const [i, s] of (d.zupa.dodatne_zupe ?? []).entries()) {
      if (zupe.has(s)) greska(["zupa", "dodatne_zupe", i], `župa „${s}” je navedena dvaput`);
      zupe.add(s);
    }

    const crkve = new Set<string>();
    const refovi = new Set<string>();
    for (const [i, c] of d.crkve.entries()) {
      if (crkve.has(c.id)) greska(["crkve", i, "id"], `id crkve „${c.id}” nije jedinstven`);
      crkve.add(c.id);
      if (c.crkve_ref) {
        if (refovi.has(c.crkve_ref)) greska(["crkve", i, "crkve_ref"], `crkva „${c.crkve_ref}” je navedena dvaput`);
        refovi.add(c.crkve_ref);
      }
      if (c.zupa_slug !== undefined && !zupe.has(c.zupa_slug))
        greska(["crkve", i, "zupa_slug"], `župa „${c.zupa_slug}” nije ni glavna ni u dodatne_zupe`);
    }
    const crkva = (path: (string | number)[], id: string | undefined) => {
      if (id !== undefined && !crkve.has(id)) greska(path, `crkva „${id}” ne postoji u crkve[].id`);
    };

    for (const [i, p] of d.stalni.entries()) crkva(["stalni", i, "crkva"], p.crkva);

    const { od, do: do_ } = d.tjedni;
    if (od > do_) greska(["tjedni", "do"], `razdoblje: od (${od}) mora biti prije ili jednako do (${do_})`);
    const unutar = (path: (string | number)[], datum: string) => {
      if (datum < od || datum > do_) greska(path, `datum ${datum} je izvan razdoblja ${od} – ${do_}`);
    };
    const vidjene = new Set<string>();
    for (const [i, m] of d.tjedni.mise.entries()) {
      crkva(["tjedni", "mise", i, "crkva"], m.crkva);
      unutar(["tjedni", "mise", i, "datum"], m.datum);
      const k = `${m.datum} ${m.sat} ${m.crkva}`;
      if (vidjene.has(k)) greska(["tjedni", "mise", i], `misa ${k} je navedena dvaput`);
      vidjene.add(k);
    }
    for (const [i, t] of (d.tjedni.ostali_termini ?? []).entries()) {
      crkva(["tjedni", "ostali_termini", i, "crkva"], t.crkva);
      unutar(["tjedni", "ostali_termini", i, "datum"], t.datum);
      if (t.do_sata && t.do_sata <= t.sat) greska(["tjedni", "ostali_termini", i, "do_sata"], "do_sata mora biti nakon sata");
    }
  });

export type RasporedMisa = z.infer<typeof rasporedShema>;
export type RasporedMisaUlaz = z.input<typeof rasporedShema>;
export type Crkva = z.infer<typeof crkvaShema>;
export type Pravilo = z.infer<typeof praviloShema>;
export type PraviloUlaz = z.input<typeof praviloShema>;
export type Misa = z.infer<typeof misaShema>;
export type MisaUlaz = z.input<typeof misaShema>;
export type Nakana = z.infer<typeof nakanaShema>;
export type Termin = z.infer<typeof terminShema>;
export type VrstaMise = (typeof VRSTE_MISE)[number];
export type Sezona = (typeof SEZONE)[number];

/** Greške zoda kao čitljivi redci „put: poruka”. */
export function opisGresaka(e: z.ZodError): string[] {
  return e.issues.map((i) => {
    const put = i.path.map((p, n) => (typeof p === "number" ? `[${p}]` : `${n ? "." : ""}${String(p)}`)).join("");
    return put ? `${put}: ${i.message}` : i.message;
  });
}

export class NeispravanDokument extends Error {
  constructor(readonly greske: string[]) {
    super(`Neispravan dokument:\n- ${greske.join("\n- ")}`);
    this.name = "NeispravanDokument";
  }
}

export function validirajRaspored(
  ulaz: unknown,
): { ok: true; dokument: RasporedMisa } | { ok: false; greske: string[] } {
  const r = rasporedShema.safeParse(ulaz);
  return r.success ? { ok: true, dokument: r.data } : { ok: false, greske: opisGresaka(r.error) };
}

/** Kao validirajRaspored, ali baca NeispravanDokument. */
export function raspored(ulaz: unknown): RasporedMisa {
  const r = validirajRaspored(ulaz);
  if (!r.ok) throw new NeispravanDokument(r.greske);
  return r.dokument;
}

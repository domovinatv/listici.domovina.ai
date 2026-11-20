import { describe, expect, it } from "vitest";
import { PORUKA_203, raspored, validirajRaspored, type RasporedMisaUlaz } from "../src/lib/raspored-shema.ts";
import { primjerIzObrasca } from "./primjer.ts";

const primjer = () => structuredClone(primjerIzObrasca()) as RasporedMisaUlaz;

/** Greške dokumenta koji je primjer s izmjenom. */
function greske(izmjena: (d: any) => void): string[] {
  const d = primjer();
  izmjena(d);
  const r = validirajRaspored(d);
  if (r.ok) throw new Error("dokument je prošao, a nije smio");
  return r.greske;
}

describe("primjer iz obrasca", () => {
  it("prolazi validaciju", () => {
    const r = validirajRaspored(primjerIzObrasca());
    expect(r.ok ? [] : r.greske).toEqual([]);
  });

  it("dobiva zadane vrijednosti iz sheme", () => {
    const d = raspored(primjerIzObrasca());
    expect(d.stalni[0]).toMatchObject({ vrsta: "redovna", jezik: "hr", sezona: "zimsko" });
    expect(d.stalni[2].sezona).toBeNull();
    expect(d.tjedni.mise[0]).toMatchObject({ vrsta: "redovna", jezik: "hr", otkazana: false });
    expect(d.tjedni.mise[4].nakana).toEqual({ tekst: "za pokojne obitelji", vrsta: "pojedinacna", objava: "papir" });
  });

  it("ima ono što primjer mora pokazati", () => {
    const d = raspored(primjerIzObrasca());
    expect(d.zupa.dodatne_zupe).toHaveLength(1);
    expect(d.crkve).toHaveLength(3);
    expect(d.crkve.some((c) => c.uloga === "filijala")).toBe(true);
    expect(d.stalni.some((p) => p.tjedni_u_mjesecu?.length)).toBe(true);
    expect(new Set(d.stalni.map((p) => p.sezona))).toEqual(new Set([null, "zimsko", "ljetno"]));
    expect(d.tjedni.mise.some((m) => m.jezik === "sq")).toBe(true);
    expect(d.tjedni.mise.some((m) => m.otkazana)).toBe(true);
    expect(new Set(d.tjedni.mise.map((m) => m.nakana?.vrsta).filter(Boolean)).size).toBe(4);
    expect(d.tjedni.ostali_termini?.length).toBeGreaterThan(0);
  });
});

describe("neispravni dokumenti", () => {
  it("nakana 'papir_i_web' pada uz odluku 203", () => {
    const g = greske((d) => (d.tjedni.mise[0].nakana.objava = "papir_i_web"));
    expect(g).toEqual([`tjedni.mise[0].nakana.objava: ${PORUKA_203}`]);
    expect(g[0]).toMatch(/odluka 203/);
  });

  it("crkva mise i pravila mora postojati u crkve[].id", () => {
    const g = greske((d) => {
      d.tjedni.mise[1].crkva = "nema";
      d.stalni[0].crkva = "isto-nema";
    });
    expect(g).toContain("tjedni.mise[1].crkva: crkva „nema” ne postoji u crkve[].id");
    expect(g).toContain("stalni[0].crkva: crkva „isto-nema” ne postoji u crkve[].id");
  });

  it("id crkve je jedinstven", () => {
    expect(greske((d) => (d.crkve[2].id = "bartol"))).toContain("crkve[2].id: id crkve „bartol” nije jedinstven");
  });

  it("datumi misa i termina unutar razdoblja, od <= do", () => {
    expect(greske((d) => (d.tjedni.mise[0].datum = "2026-11-23"))).toEqual([
      "tjedni.mise[0].datum: datum 2026-11-23 je izvan razdoblja 2026-11-16 – 2026-11-22",
    ]);
    expect(greske((d) => (d.tjedni.ostali_termini[0].datum = "2026-11-15"))[0]).toMatch(/ostali_termini\[0\].datum: .*izvan/);
    expect(
      greske((d) => {
        d.tjedni.od = "2026-11-23";
        d.tjedni.mise = [];
        d.tjedni.ostali_termini = [];
      }),
    ).toEqual(["tjedni.do: razdoblje: od (2026-11-23) mora biti prije ili jednako do (2026-11-22)"]);
  });

  it("sat, datum, enumi i nepoznata polja", () => {
    expect(greske((d) => (d.tjedni.mise[0].sat = "24:00"))[0]).toMatch(/^tjedni.mise\[0\].sat: sat mora biti HH:MM/);
    expect(greske((d) => (d.tjedni.mise[0].sat = "8:00"))[0]).toMatch(/sat mora biti HH:MM/);
    expect(greske((d) => (d.tjedni.mise[0].datum = "2026-11-31"))[0]).toMatch(/postojeći dan/);
    expect(greske((d) => (d.stalni[0].dani = ["ponedjeljak"]))[0]).toMatch(/^stalni\[0\].dani\[0\]/);
    expect(greske((d) => (d.stalni[0].dani = []))[0]).toMatch(/bar jedan dan/);
    expect(greske((d) => (d.stalni[0].tjedni_u_mjesecu = [6]))[0]).toMatch(/^stalni\[0\].tjedni_u_mjesecu\[0\]/);
    expect(greske((d) => (d.crkve[0].uloga = "katedrala"))[0]).toMatch(/^crkve\[0\].uloga/);
    expect(greske((d) => (d.tjedni.mise[0].tjedni_u_mjescu = [1]))[0]).toMatch(/tjedni_u_mjescu/);
    expect(greske((d) => (d.tjedni.mise[0].jezik = "albanski"))[0]).toMatch(/BCP 47/);
  });

  it("pravilo: vrijedi_od <= vrijedi_do", () => {
    const g = greske((d) => Object.assign(d.stalni[2], { vrijedi_od: "2027-01-01", vrijedi_do: "2026-12-31" }));
    expect(g).toEqual(["stalni[2].vrijedi_do: vrijedi_od mora biti prije ili jednak vrijedi_do"]);
  });

  it("ista misa dvaput i župa crkve izvan listića", () => {
    expect(greske((d) => d.tjedni.mise.push({ ...d.tjedni.mise[0], nakana: null }))).toEqual([
      "tjedni.mise[11]: misa 2026-11-16 18:00 bartol je navedena dvaput",
    ]);
    expect(greske((d) => (d.crkve[1].zupa_slug = "neka-treca-9003"))).toEqual([
      "crkve[1].zupa_slug: župa „neka-treca-9003” nije ni glavna ni u dodatne_zupe",
    ]);
  });

  it("bez crkava i bez obaveznih polja", () => {
    expect(greske((d) => (d.crkve = []))).toContain("crkve: listić mora imati bar jednu crkvu");
    expect(greske((d) => delete d.tjedni)[0]).toMatch(/^tjedni:/);
  });
});

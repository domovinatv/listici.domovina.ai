import { describe, expect, it } from "vitest";
import { praviloShema, raspored, type PraviloUlaz } from "../src/lib/raspored-shema.ts";
import {
  dodaj, GreskaRasporeda, otkazi, premjesti, promijeniRasporedOd, razlika, tjedneMise,
} from "../src/lib/tjedne-mise.ts";
import { primjerIzObrasca, SEZONE_PRIMJERA } from "./primjer.ts";

const pravila = (...p: PraviloUlaz[]) => p.map((x) => praviloShema.parse(x));
const kratko = (mise: { datum: string; sat: string; crkva: string }[]) => mise.map((m) => `${m.datum} ${m.sat} ${m.crkva}`);
const dok = () => raspored(primjerIzObrasca());

describe("tjedneMise", () => {
  it("primjer: tjedan 16.–22. 11. 2026. iz stalnog rasporeda (zimsko)", () => {
    const d = dok();
    const mise = tjedneMise(d.crkve, d.stalni, "2026-11-16", "2026-11-22", { sezone: SEZONE_PRIMJERA });
    expect(kratko(mise)).toEqual([
      "2026-11-16 18:00 bartol", "2026-11-17 18:00 bartol", "2026-11-18 18:00 bartol",
      "2026-11-19 18:00 bartol", "2026-11-20 18:00 bartol", "2026-11-21 08:00 bartol",
      "2026-11-22 08:00 bartol", "2026-11-22 09:00 luka", "2026-11-22 10:30 bartol", "2026-11-22 15:00 luka",
    ]);
    expect(mise.every((m) => m.iz_stalnog && !m.otkazana)).toBe(true);
    expect(mise.at(-1)).toMatchObject({ jezik: "sq", vrsta: "nedjeljna", napomena: "misa na albanskom jeziku" });
    expect(mise[0]).not.toHaveProperty("nakana");
  });

  it("ljetna sezona i sezona preko Nove godine", () => {
    const d = dok();
    const lipanj = tjedneMise(d.crkve, d.stalni, "2026-06-01", "2026-06-01", { sezone: SEZONE_PRIMJERA });
    expect(kratko(lipanj)).toEqual(["2026-06-01 19:00 bartol"]);
    const sijecanj = tjedneMise(d.crkve, d.stalni, "2027-01-04", "2027-01-04", { sezone: SEZONE_PRIMJERA });
    expect(kratko(sijecanj)).toEqual(["2027-01-04 18:00 bartol"]);
  });

  it("pravilo sa sezonom bez granica je greška", () => {
    const d = dok();
    expect(() => tjedneMise(d.crkve, d.stalni, "2026-11-16", "2026-11-22")).toThrow(GreskaRasporeda);
    expect(() =>
      tjedneMise(d.crkve, d.stalni, "2026-11-16", "2026-11-22", { sezone: { zimsko: SEZONE_PRIMJERA.zimsko } }),
    ).toThrow(/sezoni „ljetno”, a granice te sezone nisu zadane/);
    expect(() =>
      tjedneMise(d.crkve, d.stalni, "2026-11-16", "2026-11-22", { sezone: { ...SEZONE_PRIMJERA, ljetno: { od: "6-1", do: "09-30" } } }),
    ).toThrow(/MM-DD/);
  });

  it("rotacija nedjeljne mise po filijalama, uključujući petu nedjelju", () => {
    const crkve = [{ id: "zupna" }, { id: "fil-a" }, { id: "fil-b" }, { id: "fil-c" }];
    const p = pravila(
      { crkva: "zupna", dani: ["ned"], sat: "10:00", vrsta: "nedjeljna" },
      { crkva: "fil-a", dani: ["ned"], sat: "08:30", tjedni_u_mjesecu: [1] },
      { crkva: "fil-b", dani: ["ned"], sat: "08:30", tjedni_u_mjesecu: [3] },
      { crkva: "fil-c", dani: ["ned"], sat: "08:30", tjedni_u_mjesecu: [5] },
    );
    const filijale = (od: string, do_: string) => kratko(tjedneMise(crkve, p, od, do_).filter((m) => m.crkva !== "zupna"));
    // Studeni 2026. ima pet nedjelja (1, 8, 15, 22, 29), prosinac četiri.
    expect(filijale("2026-11-01", "2026-11-30")).toEqual([
      "2026-11-01 08:30 fil-a", "2026-11-15 08:30 fil-b", "2026-11-29 08:30 fil-c",
    ]);
    expect(filijale("2026-12-01", "2026-12-31")).toEqual(["2026-12-06 08:30 fil-a", "2026-12-20 08:30 fil-b"]);
    expect(tjedneMise(crkve, p, "2026-11-01", "2026-11-30").filter((m) => m.crkva === "zupna")).toHaveLength(5);
  });

  it("blagdan: samo uz jeBlagdan, i zamjenjuje radni dan crkve s blagdanskim pravilom", () => {
    const d = dok();
    const o = { sezone: SEZONE_PRIMJERA };
    // 8. 12. 2026. (utorak) bez kalendara: obični utorak.
    expect(kratko(tjedneMise(d.crkve, d.stalni, "2026-12-08", "2026-12-08", o))).toEqual(["2026-12-08 18:00 bartol"]);
    const jeBlagdan = (x: string) => x === "2026-12-08";
    const mise = tjedneMise(d.crkve, d.stalni, "2026-12-08", "2026-12-08", { ...o, jeBlagdan });
    expect(kratko(mise)).toEqual(["2026-12-08 09:00 luka", "2026-12-08 10:30 bartol"]);
    expect(mise[1].vrsta).toBe("blagdanska");
  });

  it("vrijedi_od/do i nepoznata crkva", () => {
    const p = pravila(
      { crkva: "a", dani: ["pon"], sat: "18:00", vrijedi_do: "2026-11-16" },
      { crkva: "a", dani: ["pon"], sat: "07:00", vrijedi_od: "2026-11-23" },
    );
    expect(kratko(tjedneMise([{ id: "a" }], p, "2026-11-16", "2026-11-30"))).toEqual([
      "2026-11-16 18:00 a", "2026-11-23 07:00 a", "2026-11-30 07:00 a",
    ]);
    expect(() => tjedneMise([{ id: "b" }], p, "2026-11-16", "2026-11-16")).toThrow(/crkvu „a”/);
  });

  it("ista crkva, dan i sat iz dva pravila daju jednu misu; poredak po crkvi", () => {
    const p = pravila(
      { crkva: "b", dani: ["ned"], sat: "10:00" },
      { crkva: "a", dani: ["ned", "sub"], sat: "10:00" },
      { crkva: "a", dani: ["ned"], sat: "10:00", vrsta: "nedjeljna" },
    );
    const m = tjedneMise([{ id: "a" }, { id: "b" }], p, "2026-11-21", "2026-11-22");
    expect(kratko(m)).toEqual(["2026-11-21 10:00 a", "2026-11-22 10:00 a", "2026-11-22 10:00 b"]);
  });
});

describe("zimski i ljetni raspored s promjenom od datuma", () => {
  it("promijeniRasporedOd zatvara stara pravila i otvara nova", () => {
    const ljetni = pravila(
      { crkva: "zupna", dani: ["pon", "sri", "pet"], sat: "19:00" },
      { crkva: "zupna", dani: ["ned"], sat: "10:00", vrsta: "nedjeljna" },
      { crkva: "kapela", dani: ["sub"], sat: "18:00" },
      { crkva: "zupna", dani: ["uto"], sat: "07:00", vrijedi_od: "2026-12-01" }, // buduće, otpada
    );
    const zimski = pravila(
      { crkva: "zupna", dani: ["pon", "sri", "pet"], sat: "18:00" },
      { crkva: "zupna", dani: ["ned"], sat: "10:00", vrsta: "nedjeljna" },
    );
    const sve = promijeniRasporedOd(ljetni, "2026-11-23", zimski);
    expect(sve.map((p) => [p.crkva, p.sat, p.vrijedi_od ?? null, p.vrijedi_do ?? null])).toEqual([
      ["zupna", "19:00", null, "2026-11-22"],
      ["zupna", "10:00", null, "2026-11-22"],
      ["kapela", "18:00", null, null], // izvan opsega promjene
      ["zupna", "18:00", "2026-11-23", null],
      ["zupna", "10:00", "2026-11-23", null],
    ]);
    const crkve = [{ id: "zupna" }, { id: "kapela" }];
    expect(kratko(tjedneMise(crkve, sve, "2026-11-16", "2026-11-29").filter((m) => m.crkva === "zupna"))).toEqual([
      "2026-11-16 19:00 zupna", "2026-11-18 19:00 zupna", "2026-11-20 19:00 zupna", "2026-11-22 10:00 zupna",
      "2026-11-23 18:00 zupna", "2026-11-25 18:00 zupna", "2026-11-27 18:00 zupna", "2026-11-29 10:00 zupna",
    ]);
    // Ukidanje: prazna nova pravila uz zadane crkve.
    const bezKapele = promijeniRasporedOd(sve, "2026-11-28", [], ["kapela"]);
    expect(kratko(tjedneMise(crkve, bezKapele, "2026-11-21", "2026-11-28").filter((m) => m.crkva === "kapela"))).toEqual([
      "2026-11-21 18:00 kapela",
    ]);
  });
});

describe("iznimke i razlika", () => {
  it("primjer iz obrasca: razlika prema stalnom", () => {
    const d = dok();
    const r = razlika(d.tjedni.mise, d.stalni, d.crkve, d.tjedni.od, d.tjedni.do, { sezone: SEZONE_PRIMJERA });
    expect(kratko(r.otkazane)).toEqual(["2026-11-17 18:00 bartol"]);
    expect(r.premjestene.map((p) => `${kratko([p.iz])[0]} → ${p.u.sat}`)).toEqual(["2026-11-20 18:00 bartol → 17:00"]);
    expect(kratko(r.dodane)).toEqual(["2026-11-21 11:00 bartol"]);
    expect(r.promijenjene.map((p) => [kratko([p.stvarno])[0], p.polja, p.stalno.vrsta, p.stvarno.vrsta])).toEqual([
      ["2026-11-22 09:00 luka", ["vrsta"], "nedjeljna", "obiteljska"],
    ]);
    expect(r.izostavljene).toEqual([]);
  });

  it("operacije nad generiranim tjednom daju istu razliku", () => {
    const d = dok();
    const o = { sezone: SEZONE_PRIMJERA };
    let m = tjedneMise(d.crkve, d.stalni, "2026-11-16", "2026-11-22", o);
    m = otkazi(m, { datum: "2026-11-17", sat: "18:00", crkva: "bartol" }, "nema svete mise");
    m = premjesti(m, { datum: "2026-11-20", sat: "18:00", crkva: "bartol" }, { sat: "17:00" }, d.crkve);
    m = premjesti(m, { datum: "2026-11-22", sat: "15:00", crkva: "luka" }, { crkva: "bartol" }, d.crkve);
    m = dodaj(m, { datum: "2026-11-21", sat: "11:00", crkva: "bartol", vrsta: "vjencana" }, d.crkve);
    m = premjesti(m, { datum: "2026-11-19", sat: "18:00", crkva: "bartol" }, { datum: "2026-11-18", sat: "07:00" }, d.crkve);
    m = m.filter((x) => !(x.datum === "2026-11-22" && x.sat === "08:00")); // izbrisana bez oznake

    expect(m.find((x) => x.datum === "2026-11-17")).toMatchObject({ otkazana: true, napomena: "nema svete mise" });
    expect(m.find((x) => x.sat === "11:00")).toMatchObject({ iz_stalnog: false, vrsta: "vjencana", otkazana: false });
    expect(kratko(m).indexOf("2026-11-18 07:00 bartol")).toBe(2); // poredak nakon premještaja

    const r = razlika(m, d.stalni, d.crkve, "2026-11-16", "2026-11-22", o);
    expect(kratko(r.otkazane)).toEqual(["2026-11-17 18:00 bartol"]);
    expect(r.premjestene.map((p) => `${kratko([p.iz])} → ${kratko([p.u])}`)).toEqual([
      "2026-11-20 18:00 bartol → 2026-11-20 17:00 bartol",
      "2026-11-22 15:00 luka → 2026-11-22 15:00 bartol",
    ]);
    // Premještaj na drugi dan nije prepoznat: izostavljena + dodana.
    expect(kratko(r.dodane)).toEqual(["2026-11-18 07:00 bartol", "2026-11-21 11:00 bartol"]);
    expect(kratko(r.izostavljene)).toEqual(["2026-11-19 18:00 bartol", "2026-11-22 08:00 bartol"]);
    expect(r.promijenjene).toEqual([]);
  });

  it("operacije javljaju nepostojeću i zauzetu misu", () => {
    const d = dok();
    const m = tjedneMise(d.crkve, d.stalni, "2026-11-16", "2026-11-22", { sezone: SEZONE_PRIMJERA });
    const k = { datum: "2026-11-16", sat: "07:00", crkva: "bartol" };
    expect(() => otkazi(m, k)).toThrow("Nema mise 2026-11-16 07:00 bartol");
    expect(() => dodaj(m, { datum: "2026-11-16", sat: "18:00", crkva: "bartol" }, d.crkve)).toThrow(/već postoji/);
    expect(() =>
      premjesti(m, { datum: "2026-11-22", sat: "08:00", crkva: "bartol" }, { sat: "10:30" }, d.crkve),
    ).toThrow("Misa 2026-11-22 10:30 bartol već postoji");
    expect(() => dodaj(m, { datum: "2026-11-16", sat: "7", crkva: "bartol" }, d.crkve)).toThrow(/HH:MM/);
  });
});

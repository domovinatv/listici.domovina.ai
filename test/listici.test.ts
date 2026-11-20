import { describe, expect, it } from "vitest";
import { javneMise } from "../src/lib/javni-raspored.ts";
import { PORUKA_106_KONTAKT, PORUKA_106_RASPORED, spremiProfil, spremiRaspored } from "../src/lib/listici.ts";
import { raspored, type MisaUlaz, type PraviloUlaz } from "../src/lib/raspored-shema.ts";
import { normalizirajSate } from "../src/lib/sati.ts";
import { dodaj, otkazi, tjedneMise } from "../src/lib/tjedne-mise.ts";
import {
  BRDO, DOLINA, RAVNO, SADA, bazaSZupama, jednostavan, listicSPrimjerom, primjer, profil, profilDoline,
} from "./listici-fixture.ts";

const broj = (redni = 47, stanje: "nacrt" | "objavljen" = "objavljen", sekcije: unknown[] = []) => ({
  godiste: 3, redni_broj: redni, stanje, sekcije,
});
const n = (db: ReturnType<typeof bazaSZupama>, sql: string) => (db.sirovo.prepare(sql).get() as { n: number }).n;
const kratko = (m: { datum: string; sat: string; crkva: { naziv: string } | string }[]) =>
  m.map((x) => `${x.datum} ${x.sat} ${typeof x.crkva === "string" ? x.crkva : x.crkva.naziv}`);

describe("spremiProfil", () => {
  it("sprema profil, kontakt koji unosi urednik, IBAN bez razmaka i stalne blokove", async () => {
    const { db, id } = await listicSPrimjerom();
    expect(db.sirovo.prepare("SELECT naziv, telefon, email, web, iban, sezone FROM listici WHERE id = ?").get(id)).toEqual({
      naziv: "Glas Ravnog Polja", telefon: "01 555 0000", email: "ured@ravno-polje.example",
      web: "https://ravno-polje.example", iban: "HR1210010051863000160",
      sezone: JSON.stringify({ zimsko: { od: "10-01", do: "04-30" }, ljetno: { od: "05-01", do: "09-30" } }),
    });
    expect(db.sirovo.prepare("SELECT tip, redoslijed, osjetljivo FROM profil_blokovi ORDER BY redoslijed").all()).toEqual([
      { tip: "ispovijed_klanjanje", redoslijed: 0, osjetljivo: 0 },
      { tip: "zajednice", redoslijed: 1, osjetljivo: 0 },
    ]);
    // Izmjena zamjenjuje blokove.
    await spremiProfil(db, profil({ blokovi: [{ tip: "kateheza", sadrzaj: "vjeronauk subotom" }] }), { id });
    expect(n(db, "SELECT count(*) AS n FROM profil_blokovi")).toBe(1);
  });

  it("odbija nepostojeću župu, neispravan IBAN, e-mail i web", async () => {
    const db = bazaSZupama();
    await expect(spremiProfil(db, profil({ zupa_slug: "nema-je-9999" }))).rejects.toThrow(/ne postoji u uvezenim župama/);
    await expect(spremiProfil(db, profil({ iban: "HR1210010051863000161" }))).rejects.toThrow(/IBAN nije ispravan/);
    await expect(spremiProfil(db, profil({ kontakt: { email: "nije-mail" } }))).rejects.toThrow(/e-mail/);
    await expect(spremiProfil(db, profil({ kontakt: { web: "javascript:alert(1)" } }))).rejects.toThrow(/http/);
  });

  it("granice sezona ne smiju nestati dok ih stalni raspored koristi", async () => {
    const { db, id } = await listicSPrimjerom();
    await spremiRaspored(db, id, primjer(), broj(), { sada: SADA });
    await expect(spremiProfil(db, profil({ sezone: undefined }), { id })).rejects.toThrow(/sezonu „zimsko”/);
  });
});

describe("oblik 1: datirana tablica s nakanama (primjer iz obrasca)", () => {
  it("sprema crkve, stalni raspored, mise, nakane i termine", async () => {
    const { db, id } = await listicSPrimjerom();
    const { brojId } = await spremiRaspored(db, id, primjer(), broj(47, "objavljen", [
      { tip: "obavijesti", sadrzaj: "Župno klečanje u utorak." },
      { tip: "pokojnici", naslov: "Preminuli" },
    ]), { sada: SADA });
    expect(db.sirovo.prepare("SELECT kljuc, crkva_izvor_slug, zupa_slug, uloga FROM listic_crkve ORDER BY redoslijed").all()).toEqual([
      { kljuc: "bartol", crkva_izvor_slug: "sv-bartola-apostola-ravno-polje-w9001", zupa_slug: RAVNO, uloga: "zupna" },
      { kljuc: "luka", crkva_izvor_slug: "sv-luke-evandjelista-malo-brdo-w9002", zupa_slug: BRDO, uloga: "zupna" },
      { kljuc: "rok", crkva_izvor_slug: null, zupa_slug: RAVNO, uloga: "filijala" },
    ]);
    expect(db.sirovo.prepare("SELECT zupa_slug FROM listici_zupe ORDER BY zupa_slug").all()).toEqual([
      { zupa_slug: RAVNO }, { zupa_slug: BRDO },
    ]);
    expect(db.sirovo.prepare("SELECT stanje, objavljeno_u, datum_od, datum_do FROM brojevi WHERE id = ?").get(brojId)).toEqual({
      stanje: "objavljen", objavljeno_u: SADA, datum_od: "2026-11-16", datum_do: "2026-11-22",
    });
    expect(n(db, "SELECT count(*) AS n FROM stalni_raspored")).toBe(9);
    expect(n(db, "SELECT count(*) AS n FROM mise")).toBe(11);
    expect(n(db, "SELECT count(*) AS n FROM mise_nakane")).toBe(6);
    expect(n(db, "SELECT count(*) AS n FROM ostali_termini")).toBe(2);
    expect(db.sirovo.prepare("SELECT tip, osjetljivo FROM sekcije ORDER BY redoslijed").all()).toEqual([
      { tip: "obavijesti", osjetljivo: 0 }, { tip: "pokojnici", osjetljivo: 1 },
    ]);
    expect(
      db.sirovo.prepare(
        `SELECT m.datum, m.otkazana, m.iz_stalnog, m.uz_misu, k.tekst, k.vrsta, k.objava FROM mise m
         LEFT JOIN mise_nakane k ON k.misa_id = m.id WHERE m.datum IN ('2026-11-17', '2026-11-18') ORDER BY m.datum`,
      ).all(),
    ).toEqual([
      { datum: "2026-11-17", otkazana: 1, iz_stalnog: 1, uz_misu: null, tekst: null, vrsta: null, objava: null },
      { datum: "2026-11-18", otkazana: 0, iz_stalnog: 1, uz_misu: '["krunica"]', tekst: "zajedničke nakane", vrsta: "zajednicka", objava: "papir" },
    ]);
    const pravilo = db.sirovo.prepare("SELECT dani, tjedni_u_mjesecu, jezik, sezona FROM stalni_raspored WHERE redoslijed = 7").get();
    expect(pravilo).toEqual({ dani: '["ned"]', tjedni_u_mjesecu: "[4]", jezik: "sq", sezona: null });
  });

  it("ponovno spremanje istog broja zamjenjuje mise i nakane, ne udvostručuje", async () => {
    const { db, id } = await listicSPrimjerom();
    await spremiRaspored(db, id, primjer(), broj(), { sada: SADA });
    const d = primjer();
    d.tjedni.mise = d.tjedni.mise.slice(0, 3);
    await spremiRaspored(db, id, d, broj(), { sada: "2026-11-21T08:00:00.000Z" });
    expect(n(db, "SELECT count(*) AS n FROM brojevi")).toBe(1);
    expect(n(db, "SELECT count(*) AS n FROM mise")).toBe(3);
    expect(n(db, "SELECT count(*) AS n FROM mise_nakane")).toBe(2);
    expect(db.sirovo.prepare("SELECT objavljeno_u, promijenjeno_u FROM brojevi").get()).toEqual({
      objavljeno_u: SADA, promijenjeno_u: "2026-11-21T08:00:00.000Z",
    });
  });

  it("crkva koja nestane iz dokumenta briše se samo kad je nijedna misa ne koristi", async () => {
    const { db, id } = await listicSPrimjerom();
    await spremiRaspored(db, id, primjer(), broj(47), { sada: SADA });
    const bezRoka = primjer();
    bezRoka.crkve = bezRoka.crkve.filter((c) => c.id !== "rok");
    bezRoka.stalni = bezRoka.stalni.filter((p) => p.crkva !== "rok");
    bezRoka.tjedni = { od: "2026-11-23", do: "2026-11-29", mise: [] };
    await spremiRaspored(db, id, bezRoka, broj(48), { sada: SADA });
    expect(n(db, "SELECT count(*) AS n FROM listic_crkve WHERE kljuc = 'rok'")).toBe(0);
    const bezLuke = primjer();
    bezLuke.crkve = bezLuke.crkve.filter((c) => c.id !== "luka");
    bezLuke.stalni = bezLuke.stalni.filter((p) => p.crkva !== "luka");
    bezLuke.tjedni = { od: "2026-11-23", do: "2026-11-29", mise: [], ostali_termini: [] };
    await spremiRaspored(db, id, bezLuke, broj(48), { sada: SADA });
    expect(n(db, "SELECT count(*) AS n FROM listic_crkve WHERE kljuc = 'luka'")).toBe(1); // mise broja 47
  });

  it("javni raspored glavne i dodatne župe", async () => {
    const { db, id } = await listicSPrimjerom();
    await spremiRaspored(db, id, primjer(), broj(), { sada: SADA });
    const ravno = await javneMise(db, RAVNO, "2026-11-16", "2026-11-22");
    expect(kratko(ravno)).toEqual([
      "2026-11-16 18:00 crkva sv. Bartola apostola", "2026-11-17 18:00 crkva sv. Bartola apostola",
      "2026-11-18 18:00 crkva sv. Bartola apostola", "2026-11-19 18:00 crkva sv. Bartola apostola",
      "2026-11-20 17:00 crkva sv. Bartola apostola", "2026-11-21 08:00 crkva sv. Bartola apostola",
      "2026-11-21 11:00 crkva sv. Bartola apostola", "2026-11-22 08:00 crkva sv. Bartola apostola",
      "2026-11-22 10:30 crkva sv. Bartola apostola",
    ]);
    expect(ravno.every((m) => m.potvrdeno)).toBe(true);
    expect(ravno[1]).toMatchObject({ otkazana: true, napomena: "nema svete mise: župnik je na duhovnim vježbama" });
    const brdo = await javneMise(db, BRDO, "2026-11-16", "2026-11-22");
    expect(brdo.map((m) => [m.sat, m.vrsta, m.jezik, m.napomena])).toEqual([
      ["09:00", "obiteljska", "hr", null],
      ["15:00", "nedjeljna", "sq", "misa na albanskom jeziku"],
    ]);
    expect(brdo[1].crkva).toEqual({ naziv: "crkva sv. Luke evanđelista", mjesto: "Malo Brdo", slug: "sv-luke-evandjelista-malo-brdo-w9002" });
  });

  it("izvan objavljenog broja: stalni raspored, nije potvrđen; rotacija filijale", async () => {
    const { db, id } = await listicSPrimjerom();
    await spremiRaspored(db, id, primjer(), broj(), { sada: SADA });
    const m = await javneMise(db, RAVNO, "2026-11-22", "2026-12-06");
    const nepotvrdene = m.filter((x) => !x.potvrdeno);
    expect(m.filter((x) => x.potvrdeno).every((x) => x.datum === "2026-11-22")).toBe(true);
    expect(nepotvrdene[0]).toMatchObject({ datum: "2026-11-23", sat: "18:00", otkazana: false, potvrdeno: false });
    // Kapela sv. Roka: 1. i 3. nedjelja; 29. 11. je peta, 6. 12. prva.
    expect(kratko(m.filter((x) => x.crkva.naziv === "kapela sv. Roka"))).toEqual(["2026-12-06 11:30 kapela sv. Roka"]);
    expect(m.find((x) => x.crkva.naziv === "kapela sv. Roka")!.crkva.slug).toBeNull();
    expect(kratko(nepotvrdene.filter((x) => x.datum === "2026-11-29"))).toEqual([
      "2026-11-29 08:00 crkva sv. Bartola apostola", "2026-11-29 10:30 crkva sv. Bartola apostola",
    ]);
  });
});

describe("oblik 2: slobodan tekst po danima, sati kroz normalizaciju", () => {
  it("mise s napomenama bez nakana", async () => {
    const db = bazaSZupama();
    const id = await spremiProfil(db, profilDoline());
    const tekst: [string, string, string?][] = [
      ["2026-11-16", "u 18 sati"],
      ["2026-11-18", "7,30 i 18:30h", "zornica s krunicom"],
      ["2026-11-20", "18,00 h", "misa za bolesne"],
      ["2026-11-21", "nema mise"],
      ["2026-11-22", "8 i 10 sati", "u 10 sati predvodi biskup"],
    ];
    const mise: MisaUlaz[] = tekst.flatMap(([datum, sati, napomena]) =>
      normalizirajSate(sati).map((sat) => ({ datum, sat, crkva: "ana", ...(napomena ? { napomena } : {}) })),
    );
    await spremiRaspored(db, id, jednostavan({ mise }), broj(), { sada: SADA });
    const j = await javneMise(db, DOLINA, "2026-11-16", "2026-11-22");
    expect(j.map((m) => `${m.datum} ${m.sat} ${m.napomena ?? ""}`.trim())).toEqual([
      "2026-11-16 18:00",
      "2026-11-18 07:30 zornica s krunicom",
      "2026-11-18 18:30 zornica s krunicom",
      "2026-11-20 18:00 misa za bolesne",
      "2026-11-22 08:00 u 10 sati predvodi biskup",
      "2026-11-22 10:00 u 10 sati predvodi biskup",
    ]);
    expect(n(db, "SELECT count(*) AS n FROM mise_nakane")).toBe(0);
  });
});

describe("oblik 3: blagdanski dvobroj (14 dana)", () => {
  const stalni: PraviloUlaz[] = [
    { crkva: "ana", dani: ["pon", "uto", "sri", "cet", "pet"], sat: "18:00" },
    { crkva: "ana", dani: ["sub"], sat: "08:00" },
    { crkva: "ana", dani: ["ned", "blagdan"], sat: "10:00", vrsta: "nedjeljna" },
    { crkva: "ana", dani: ["blagdan"], sat: "08:00", vrsta: "blagdanska" },
  ];
  const blagdani = new Set(["2026-12-25", "2026-12-26", "2027-01-01"]);
  const jeBlagdan = (d: string) => blagdani.has(d);

  it("generator preko dva tjedna s blagdanima, iznimke, spremanje i javni upit", async () => {
    const db = bazaSZupama();
    const id = await spremiProfil(db, profilDoline());
    const d = raspored(jednostavan({ od: "2026-12-21", do: "2027-01-03" }, stalni));
    let mise = tjedneMise(d.crkve, d.stalni, d.tjedni.od, d.tjedni.do, { jeBlagdan });
    expect(mise.filter((m) => blagdani.has(m.datum)).map((m) => `${m.datum} ${m.sat}`)).toEqual([
      "2026-12-25 08:00", "2026-12-25 10:00", "2026-12-26 08:00", "2026-12-26 10:00", "2027-01-01 08:00", "2027-01-01 10:00",
    ]);
    // 8 radnih dana bez blagdana, 1 subota (26. 12. je blagdan), 2 nedjelje, 6 blagdanskih
    expect(mise).toHaveLength(8 + 1 + 2 + 6);
    mise = dodaj(mise, { datum: "2026-12-24", sat: "23:59", crkva: "ana", vrsta: "blagdanska", napomena: "polnoćka" }, d.crkve);
    mise = otkazi(mise, { datum: "2026-12-31", sat: "18:00", crkva: "ana" }, "zahvalnica u 17 h u kapeli");
    await spremiRaspored(db, id, { ...d, tjedni: { ...d.tjedni, mise } }, broj(51), { sada: SADA });
    const j = await javneMise(db, DOLINA, "2026-12-21", "2027-01-03", { jeBlagdan });
    expect(j).toHaveLength(18);
    expect(j.every((m) => m.potvrdeno)).toBe(true);
    expect(j.find((m) => m.sat === "23:59")).toMatchObject({ datum: "2026-12-24", napomena: "polnoćka", vrsta: "blagdanska" });
    expect(j.find((m) => m.datum === "2026-12-31")).toMatchObject({ otkazana: true });
  });

  it("objavljeni brojevi istog listića ne smiju se preklapati", async () => {
    const db = bazaSZupama();
    const id = await spremiProfil(db, profilDoline());
    const tjedan = jednostavan({ mise: [{ datum: "2026-11-22", sat: "10:00", crkva: "ana" }] }, stalni);
    await spremiRaspored(db, id, tjedan, broj(47));
    const dvobroj = jednostavan({ od: "2026-11-22", do: "2026-12-05", mise: [{ datum: "2026-11-29", sat: "10:00", crkva: "ana" }] }, stalni);
    await expect(spremiRaspored(db, id, dvobroj, broj(48))).rejects.toThrow(/preklapa s objavljenim brojem 47\/3/);
    await spremiRaspored(db, id, dvobroj, broj(48, "nacrt")); // nacrt smije
  });
});

describe("oblik 4: samo stalni raspored", () => {
  it("broj bez tjednih misa objavljuje stalni raspored, nepotvrđen", async () => {
    const db = bazaSZupama();
    const id = await spremiProfil(db, profilDoline());
    const stalni: PraviloUlaz[] = [
      { crkva: "ana", dani: ["ned"], sat: "09:00", vrsta: "nedjeljna" },
      { crkva: "ana", dani: ["sri", "pet"], sat: "18:30", napomena: "zimi u 17:30" },
    ];
    await spremiRaspored(db, id, jednostavan({}, stalni), broj(), { sada: SADA });
    const j = await javneMise(db, DOLINA, "2026-11-16", "2026-11-22");
    expect(j.map((m) => [m.datum, m.sat, m.potvrdeno])).toEqual([
      ["2026-11-18", "18:30", false], ["2026-11-20", "18:30", false], ["2026-11-22", "09:00", false],
    ]);
    expect(j[0].napomena).toBe("zimi u 17:30");
  });
});

describe("oblik 5: broj bez misa (odluka 106)", () => {
  it("nacrt smije, objava traži bar stalni raspored", async () => {
    const db = bazaSZupama();
    const id = await spremiProfil(db, profilDoline());
    await spremiRaspored(db, id, jednostavan(), broj(47, "nacrt", [{ tip: "obavijesti", sadrzaj: "Božićni koncert." }]));
    await expect(spremiRaspored(db, id, jednostavan(), broj(47))).rejects.toThrow(PORUKA_106_RASPORED);
    expect(await javneMise(db, DOLINA, "2026-11-16", "2026-11-22")).toEqual([]);
  });

  it("objava traži kontakt (telefon ili e-mail)", async () => {
    const db = bazaSZupama();
    const id = await spremiProfil(db, profilDoline({ kontakt: { adresa: "Crkveni put 2" } }));
    const s: PraviloUlaz[] = [{ crkva: "ana", dani: ["ned"], sat: "09:00" }];
    await expect(spremiRaspored(db, id, jednostavan({}, s), broj())).rejects.toThrow(PORUKA_106_KONTAKT);
  });
});

describe("pravila spremanja", () => {
  it("nacrt se ne vidi javno, ni njegov stalni raspored", async () => {
    const db = bazaSZupama();
    const id = await spremiProfil(db, profilDoline());
    const s: PraviloUlaz[] = [{ crkva: "ana", dani: ["ned"], sat: "09:00" }];
    await spremiRaspored(db, id, jednostavan({ mise: [{ datum: "2026-11-22", sat: "09:00", crkva: "ana" }] }, s), broj(47, "nacrt"));
    expect(await javneMise(db, DOLINA, "2026-11-16", "2026-11-30")).toEqual([]);
  });

  it("odbija tuđu župu, nepostojeću crkvu izvora, sezonu bez granica i neosjetljive sakramente", async () => {
    const { db, id } = await listicSPrimjerom();
    await expect(spremiRaspored(db, id, jednostavan(), broj())).rejects.toThrow(/nije glavna župa listića/);
    const losRef = primjer();
    losRef.crkve[2].crkve_ref = "nema-takve-w0000";
    await expect(spremiRaspored(db, id, losRef, broj())).rejects.toThrow(/crkve\[2\].crkve_ref: crkva „nema-takve-w0000” ne postoji/);
    const tudaCrkva = primjer();
    tudaCrkva.crkve[2].crkve_ref = "sv-ane-tiha-dolina-w9003";
    await expect(spremiRaspored(db, id, tudaCrkva, broj())).rejects.toThrow(/pripada župi „sv-ane-tiha-dolina-9003” koja nije na listiću/);
    const id2 = await spremiProfil(db, profil({ sezone: { zimsko: { od: "10-01", do: "04-30" } } }));
    await expect(spremiRaspored(db, id2, primjer(), broj())).rejects.toThrow(/sezoni „ljetno”.*profilu listića/);
    await expect(spremiRaspored(db, id, primjer(), broj(47, "objavljen", [{ tip: "sakramenti", osjetljivo: false }]))).rejects.toThrow(
      /odluka 204/,
    );
    expect(n(db, "SELECT count(*) AS n FROM brojevi")).toBe(0);
  });

  it("neuspjelo spremanje ne ostavlja pola broja (jedna transakcija)", async () => {
    const { db, id } = await listicSPrimjerom();
    await spremiRaspored(db, id, primjer(), broj(), { sada: SADA });
    // Kvar baze nakon validacije: upis termina pada, mise su do tada već obrisane i upisane.
    db.sirovo.exec("CREATE TRIGGER kvar BEFORE INSERT ON ostali_termini BEGIN SELECT RAISE(ABORT, 'kvar'); END");
    const d = primjer();
    d.tjedni.mise = d.tjedni.mise.slice(0, 2);
    await expect(spremiRaspored(db, id, d, broj())).rejects.toThrow(/kvar/);
    expect(n(db, "SELECT count(*) AS n FROM mise")).toBe(11);
    expect(n(db, "SELECT count(*) AS n FROM mise_nakane")).toBe(6);
  });
});

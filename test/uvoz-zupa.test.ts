import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CRKVE_OSNOVA, uveziZupe } from "../src/lib/uvoz-zupa.ts";
import { izZupeJson, naslov, normaliziraj } from "../src/lib/zupa-izvor.ts";
import { novaBaza } from "./d1-sqlite.ts";

type Izvor = { index: { count: number; items: { slug: string; kind: string }[] }; zupe: Record<string, any> };
const v1 = (): Izvor => JSON.parse(readFileSync(new URL("./fixtures/crkve-v1.json", import.meta.url), "utf8"));

/** Lažni crkve.domovina.ai: isti URL-ovi kao pravi, odgovori iz fixturea, bez mreže. */
function posluzitelj(izvor: Izvor, kvar = new Set<string>()) {
  const pozivi: string[] = [];
  const dohvati = async (url: string) => {
    pozivi.push(url);
    if (url === `${CRKVE_OSNOVA}/zupe-index.json`) return structuredClone(izvor.index);
    const m = url.match(/\/zupa\/(.+)\.json$/);
    const slug = m && decodeURIComponent(m[1]);
    if (!slug || kvar.has(slug) || !izvor.zupe[slug]) throw new Error(`404 ${url}`);
    return structuredClone(izvor.zupe[slug]);
  };
  return { dohvati, pozivi };
}

/** Stanje izvora dan kasnije: preimenovanja po OIB-u i SBT_ID-u, nestanak, promjena adrese. */
function v2(): Izvor {
  const s = v1();
  const preimenuj = (stari: string, novi: string) => {
    s.zupe[novi] = { ...s.zupe[stari], slug: novi };
    delete s.zupe[stari];
    s.index.items = s.index.items.map((i) => (i.slug === stari ? { ...i, slug: novi } : i));
  };
  preimenuj("sv-lovre-stara-mlaka-5555", "sv-lovre-mucenika-stara-mlaka-5555"); // isti OIB
  preimenuj("sv-roka-zabrdje-702002", "sv-roka-gornje-zabrdje-702002"); // bez OIB-a, isti SBT_ID
  delete s.zupe["sv-ane-kamenica-4444"];
  s.index.items = s.index.items.filter((i) => i.slug !== "sv-ane-kamenica-4444");
  s.zupe["sv-petra-lucko-selo-3333"].address = "Selo 4a";
  // Promjena samo Google polja nije promjena za nas.
  s.zupe["sv-ivana-krstitelja-gornje-polje-1111"].phone = "099 000 1112";
  s.zupe["sv-ivana-krstitelja-gornje-polje-1111"].website = "http://drugi.invalid/";
  return s;
}

const sat = () => {
  let t = Date.parse("2026-11-20T10:00:00Z");
  return () => new Date((t += 1000)).toISOString();
};

describe("izZupeJson", () => {
  it("preuzima samo dopuštena polja, bez Google Placesa", async () => {
    const z = (await izZupeJson(v1().zupe["sv-ivana-krstitelja-gornje-polje-1111"]))!;
    expect(Object.keys(z.zupa).sort()).toEqual(
      ["address", "city", "county", "diocese", "geocode_source", "kind", "lat", "lng", "name", "oib",
        "registry_id", "short_name", "slug", "titular"].sort(),
    );
    expect(JSON.stringify(z)).not.toMatch(/099 000|invalid\/|maps\.google|@primjer/);
    expect(z.crkve.map((c) => c.slug)).toEqual(["sv-ivana-krstitelja-gornje-polje-w1", "kapela-sv-florijana-gornje-polje-n2"]);
    expect(z.crkve[0]).not.toHaveProperty("phone");
  });

  it("koordinate samo kad geocode_source nije Google ni nepoznat", async () => {
    const zupe = v1().zupe;
    const geo = async (slug: string) => {
      const { zupa } = (await izZupeJson(zupe[slug]))!;
      return [zupa.lat, zupa.lng, zupa.geocode_source];
    };
    expect(await geo("sv-ivana-krstitelja-gornje-polje-1111")).toEqual([45.1, 15.1, "church"]);
    expect(await geo("sv-marka-donje-polje-2222")).toEqual([null, null, "places"]);
    expect(await geo("bl-djevice-marije-pusti-brdovec-702001")).toEqual([45.3, 15.3, "naselje-centroid"]);
    expect(await geo("sv-petra-lucko-selo-3333")).toEqual([45.4, 15.4, "nominatim"]);
    expect(await geo("sv-mihovila-ravnica-6666")).toEqual([null, null, null]);
  });

  it("hash ne ovisi o telefonu ni webu", async () => {
    const a = v1().zupe["sv-ivana-krstitelja-gornje-polje-1111"];
    const b = { ...a, phone: "1", website: "x", google_maps_uri: "y" };
    expect((await izZupeJson(a))!.hash).toBe((await izZupeJson(b))!.hash);
    expect((await izZupeJson({ ...a, city: "Drugo" }))!.hash).not.toBe((await izZupeJson(a))!.hash);
  });

  it("odbacuje JSON bez sluga ili naziva", async () => {
    expect(await izZupeJson(null)).toBeNull();
    expect(await izZupeJson({ name: "X", kind: "zupa" })).toBeNull();
  });

  it("normalizira za pretragu i slaže naslov", () => {
    expect(normaliziraj("  Pušti  Brđovec ŽUPA ")).toBe("pusti brdovec zupa");
    expect(naslov({ name: "ŽUPA SV. PETRA", short_name: "sv. Petra", city: "Lučko Selo", kind: "zupa" })).toBe(
      "Župa sv. Petra, Lučko Selo",
    );
    expect(naslov({ name: "ŽUPA X", short_name: "Preobraženja, Lučko Selo", city: "Lučko Selo", kind: "zupa" })).toBe(
      "Župa Preobraženja, Lučko Selo",
    );
  });
});

describe("uveziZupe", () => {
  it("prvi uvoz: sve župe iz indeksa, samo kind == zupa", async () => {
    const db = novaBaza();
    const { dohvati, pozivi } = posluzitelj(v1());
    const r = await uveziZupe({ db, dohvati, sada: sat() });
    expect(r.u_indeksu).toBe(8);
    expect(r.nove).toHaveLength(8);
    expect(r.greske).toEqual([]);
    expect(pozivi.some((u) => u.includes("samostan"))).toBe(false);
    const { n } = db.sirovo.prepare("SELECT count(*) AS n FROM zupe").get() as { n: number };
    expect(n).toBe(8);
    const bezOib = db.sirovo.prepare("SELECT oib, registry_id FROM zupe WHERE slug = ?").get("bl-djevice-marije-pusti-brdovec-702001");
    expect(bezOib).toEqual({ oib: null, registry_id: 702001 });
    const crkve = db.sirovo.prepare("SELECT slug, is_parish_church, redoslijed FROM crkve_izvor WHERE zupa_slug = ? ORDER BY redoslijed")
      .all("sv-ivana-krstitelja-gornje-polje-1111");
    expect(crkve).toEqual([
      { slug: "sv-ivana-krstitelja-gornje-polje-w1", is_parish_church: 1, redoslijed: 0 },
      { slug: "kapela-sv-florijana-gornje-polje-n2", is_parish_church: 0, redoslijed: 1 },
    ]);
  });

  it("drugi uzastopni uvoz ne mijenja ništa", async () => {
    const db = novaBaza();
    const izvor = v1();
    await uveziZupe({ db, dohvati: posluzitelj(izvor).dohvati, sada: sat() });
    const prije = db.sirovo.prepare("SELECT * FROM zupe ORDER BY slug").all();
    const r = await uveziZupe({ db, dohvati: posluzitelj(izvor).dohvati, sada: sat() });
    expect(r.promjena).toBe(0);
    expect(db.sirovo.prepare("SELECT * FROM zupe ORDER BY slug").all()).toEqual(prije);
  });

  it("bilježi promjenu, nestanak i preimenovanje po OIB-u i po SBT_ID-u", async () => {
    const db = novaBaza();
    await uveziZupe({ db, dohvati: posluzitelj(v1()).dohvati, sada: sat() });
    const r = await uveziZupe({ db, dohvati: posluzitelj(v2()).dohvati, sada: sat() });
    expect(r.promijenjene).toEqual(["sv-petra-lucko-selo-3333"]);
    expect(r.nove.sort()).toEqual(["sv-lovre-mucenika-stara-mlaka-5555", "sv-roka-gornje-zabrdje-702002"]);
    expect(r.nestale.sort()).toEqual(["sv-ane-kamenica-4444", "sv-lovre-stara-mlaka-5555", "sv-roka-zabrdje-702002"]);
    expect(r.preimenovane).toEqual(
      expect.arrayContaining([
        { stari: "sv-lovre-stara-mlaka-5555", novi: "sv-lovre-mucenika-stara-mlaka-5555", kljuc: "oib" },
        { stari: "sv-roka-zabrdje-702002", novi: "sv-roka-gornje-zabrdje-702002", kljuc: "registry_id" },
      ]),
    );
    expect(r.preimenovane).toHaveLength(2);
    const stara = db.sirovo.prepare("SELECT nestalo_u IS NOT NULL AS nestala, novi_slug FROM zupe WHERE slug = ?");
    expect(stara.get("sv-ane-kamenica-4444")).toEqual({ nestala: 1, novi_slug: null });
    expect(stara.get("sv-lovre-stara-mlaka-5555")).toEqual({ nestala: 1, novi_slug: "sv-lovre-mucenika-stara-mlaka-5555" });
    expect(db.sirovo.prepare("SELECT count(*) AS n FROM zupe_preimenovanja").get()).toEqual({ n: 2 });
    // Crkva preimenovane župe prelazi na novi slug.
    expect(db.sirovo.prepare("SELECT zupa_slug FROM crkve_izvor WHERE slug = 'sv-lovre-stara-mlaka-w5'").get()).toEqual({
      zupa_slug: "sv-lovre-mucenika-stara-mlaka-5555",
    });
    // I nakon toga je sljedeći uvoz prazan.
    const r3 = await uveziZupe({ db, dohvati: posluzitelj(v2()).dohvati, sada: sat() });
    expect(r3.promjena).toBe(0);
  });

  it("župa koja se vrati u indeks više nije nestala", async () => {
    const db = novaBaza();
    await uveziZupe({ db, dohvati: posluzitelj(v1()).dohvati, sada: sat() });
    await uveziZupe({ db, dohvati: posluzitelj(v2()).dohvati, sada: sat() });
    const s3 = v2();
    s3.zupe["sv-ane-kamenica-4444"] = v1().zupe["sv-ane-kamenica-4444"];
    s3.index.items.push({ slug: "sv-ane-kamenica-4444", kind: "zupa" });
    const r = await uveziZupe({ db, dohvati: posluzitelj(s3).dohvati, sada: sat() });
    expect(r.vracene).toEqual(["sv-ane-kamenica-4444"]);
    expect(db.sirovo.prepare("SELECT nestalo_u FROM zupe WHERE slug = 'sv-ane-kamenica-4444'").get()).toEqual({ nestalo_u: null });
  });

  it("neuspio dohvat detalja nije nestanak", async () => {
    const db = novaBaza();
    await uveziZupe({ db, dohvati: posluzitelj(v1()).dohvati, sada: sat() });
    const r = await uveziZupe({ db, dohvati: posluzitelj(v1(), new Set(["sv-marka-donje-polje-2222"])).dohvati, sada: sat() });
    expect(r.greske.map((g) => g.slug)).toEqual(["sv-marka-donje-polje-2222"]);
    expect(r.promjena).toBe(0);
    expect(db.sirovo.prepare("SELECT nestalo_u FROM zupe WHERE slug = 'sv-marka-donje-polje-2222'").get()).toEqual({ nestalo_u: null });
  });

  it("staje kad indeks naglo izgubi većinu župa", async () => {
    const db = novaBaza();
    await uveziZupe({ db, dohvati: posluzitelj(v1()).dohvati, sada: sat() });
    const mali = v1();
    mali.index.items = mali.index.items.slice(0, 2);
    await expect(uveziZupe({ db, dohvati: posluzitelj(mali).dohvati, sada: sat() })).rejects.toThrow(/zaustavljen/);
    expect(db.sirovo.prepare("SELECT count(*) AS n FROM zupe WHERE nestalo_u IS NULL").get()).toEqual({ n: 8 });
  });

  it("nijedan telefon, web, e-mail ni Google poveznica nije u bazi", async () => {
    const db = novaBaza();
    await uveziZupe({ db, dohvati: posluzitelj(v1()).dohvati, sada: sat() });
    await uveziZupe({ db, dohvati: posluzitelj(v2()).dohvati, sada: sat() });
    const tablice = (db.sirovo.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[]).map(
      (t) => t.name,
    );
    // Iznimka: kontakt u profilu listića unosi urednik sam (odluka 206); uvoz ga ne puni.
    expect(db.sirovo.prepare("SELECT count(*) AS n FROM listici").get()).toEqual({ n: 0 });
    for (const t of tablice.filter((t) => t !== "listici")) {
      const stupci = (db.sirovo.prepare(`PRAGMA table_info(${t})`).all() as { name: string }[]).map((s) => s.name);
      expect(stupci.filter((s) => /phone|telefon|website|web|email|mail|google|maps/i.test(s))).toEqual([]);
      for (const red of db.sirovo.prepare(`SELECT * FROM ${t}`).all()) {
        expect(JSON.stringify(red)).not.toMatch(/099 000|https?:\/\/|maps\.google|@primjer/);
      }
    }
    // Koordinata iz Placesa nije spremljena.
    expect(db.sirovo.prepare("SELECT lat, lng FROM zupe WHERE geocode_source = 'places'").all()).toEqual([{ lat: null, lng: null }]);
  });
});

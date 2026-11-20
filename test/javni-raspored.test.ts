import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Baza } from "../src/lib/baza.ts";
import { javneMise, NAJVISE_DANA } from "../src/lib/javni-raspored.ts";
import { spremiRaspored } from "../src/lib/listici.ts";
import { raspored } from "../src/lib/raspored-shema.ts";
import { BRDO, RAVNO, SADA, listicSPrimjerom, primjer } from "./listici-fixture.ts";

async function objavljenPrimjer() {
  const { db, id } = await listicSPrimjerom();
  await spremiRaspored(db, id, primjer(), { godiste: 3, redni_broj: 47, stanje: "objavljen" }, { sada: SADA });
  return db;
}

/** Baza koja bilježi svaki SQL koji se pripremi. */
function sBiljeznikom(db: Baza) {
  const sql: string[] = [];
  const b: Baza = { prepare: (s) => (sql.push(s), db.prepare(s)), batch: (u) => db.batch(u) };
  return { b, sql };
}

const tekstoviNakana = raspored(primjer()).tjedni.mise.flatMap((m) => (m.nakana?.tekst ? [m.nakana.tekst] : []));

describe("javni raspored nikad ne nosi nakane (odluke 103, 203)", () => {
  it("rezultat ima samo javna polja i nijedan tekst nakane", async () => {
    const db = await objavljenPrimjer();
    expect(tekstoviNakana.length).toBeGreaterThan(3);
    // Nakane jesu u bazi (tiskani PDF ih treba)…
    expect((db.sirovo.prepare("SELECT count(*) AS n FROM mise_nakane").get() as { n: number }).n).toBe(6);
    for (const zupa of [RAVNO, BRDO]) {
      // …razdoblje pokriva i objavljeni broj i stalni raspored nakon njega.
      const mise = await javneMise(db, zupa, "2026-11-16", "2026-11-29");
      expect(mise.length).toBeGreaterThan(0);
      for (const m of mise) {
        expect(Object.keys(m).sort()).toEqual(["crkva", "datum", "jezik", "napomena", "otkazana", "potvrdeno", "sat", "vrsta"]);
        expect(Object.keys(m.crkva).sort()).toEqual(["mjesto", "naziv", "slug"]);
      }
      const json = JSON.stringify(mise);
      expect(json).not.toMatch(/nakan/i);
      for (const t of tekstoviNakana) expect(json).not.toContain(t);
    }
  });

  it("SQL javnog upita ne spominje nakane", async () => {
    const db = await objavljenPrimjer();
    const { b, sql } = sBiljeznikom(db);
    await javneMise(b, RAVNO, "2026-11-16", "2026-11-29");
    expect(sql.length).toBeGreaterThanOrEqual(4);
    expect(sql.filter((s) => /nakan/i.test(s))).toEqual([]);
    expect(sql.some((s) => /FROM mise m/.test(s))).toBe(true);
  });

  it("izvorni kod javnog modula ne spominje nakane", () => {
    const izvor = readFileSync(new URL("../src/lib/javni-raspored.ts", import.meta.url), "utf8");
    expect(izvor).not.toMatch(/nakan/i);
    expect(izvor).not.toMatch(/from "\.\/listici\.ts"/); // ne dijeli SQL s uredničkim modulom
  });

  it("razdoblje: ispravni datumi, od <= do, najviše NAJVISE_DANA", async () => {
    const db = await objavljenPrimjer();
    await expect(javneMise(db, RAVNO, "2026-11-22", "2026-11-16")).rejects.toThrow(RangeError);
    await expect(javneMise(db, RAVNO, "2026-11-31", "2026-12-01")).rejects.toThrow(RangeError);
    await expect(javneMise(db, RAVNO, "2026-01-01", "2026-12-31")).rejects.toThrow(`${NAJVISE_DANA} dana`);
    expect(await javneMise(db, "nepoznata-zupa-0000", "2026-11-16", "2026-11-22")).toEqual([]);
  });
});

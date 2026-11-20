import { describe, expect, it } from "vitest";
import { novaBaza } from "./d1-sqlite.ts";

/** Baza s jednom izmišljenom župom, listićem, crkvom i brojem. */
function baza() {
  const b = novaBaza();
  const db = b.sirovo;
  db.exec(`
    INSERT INTO zupe (slug, kind, name, trazi, izvor_hash, uvezeno_u, promijenjeno_u)
      VALUES ('zupa-test-9100', 'zupa', 'Župa Test', 'zupa test', 'h', 't', 't');
    INSERT INTO listici (id, zupa_slug, naziv, stvoreno_u, promijenjeno_u)
      VALUES (1, 'zupa-test-9100', 'Župni listić', 't', 't');
    INSERT INTO listic_crkve (id, listic_id, kljuc, naziv, zupa_slug, uloga, redoslijed)
      VALUES (1, 1, 'zupna', 'crkva Test', 'zupa-test-9100', 'zupna', 0);
    INSERT INTO brojevi (id, listic_id, godiste, redni_broj, datum_od, datum_do, stvoreno_u, promijenjeno_u)
      VALUES (1, 1, 3, 12, '2026-11-16', '2026-11-22', 't', 't');
    INSERT INTO mise (id, broj_id, datum, sat, crkva_id) VALUES (1, 1, '2026-11-16', '18:00', 1);
  `);
  return db;
}

const greska = (db: ReturnType<typeof baza>, sql: string) => () => db.exec(sql);

describe("migracija 0002_listici", () => {
  it("osjetljive sekcije (sakramenti, pokojnici) uvijek imaju osjetljivo = 1", () => {
    const db = baza();
    for (const tip of ["sakramenti", "pokojnici"]) {
      expect(greska(db, `INSERT INTO sekcije (broj_id, tip, redoslijed, osjetljivo) VALUES (1, '${tip}', 0, 0)`)).toThrow(
        /CHECK constraint failed/,
      );
      db.exec(`INSERT INTO sekcije (broj_id, tip, redoslijed, osjetljivo) VALUES (1, '${tip}', 0, 1)`);
      expect(
        greska(db, `INSERT INTO profil_blokovi (listic_id, tip, redoslijed, osjetljivo) VALUES (1, '${tip}', 0, 0)`),
      ).toThrow(/CHECK/);
    }
    db.exec("INSERT INTO sekcije (broj_id, tip, redoslijed, osjetljivo) VALUES (1, 'darovi', 1, 0)");
    db.exec("INSERT INTO sekcije (broj_id, tip, redoslijed, osjetljivo) VALUES (1, 'zajednice', 2, 1)");
    expect(greska(db, "INSERT INTO sekcije (broj_id, tip, redoslijed, osjetljivo) VALUES (1, 'humor', 3, 0)")).toThrow(/CHECK/);
    expect(greska(db, "INSERT INTO sekcije (broj_id, tip, redoslijed) VALUES (1, 'obavijesti', 3)")).toThrow(/NOT NULL/);
  });

  it("nakana se briše s misom, a 'papir_i_web' baza odbija (odluka 203)", () => {
    const db = baza();
    expect(greska(db, "INSERT INTO mise_nakane (misa_id, tekst, objava) VALUES (1, 'x', 'papir_i_web')")).toThrow(/CHECK/);
    db.exec("INSERT INTO mise_nakane (misa_id, tekst, vrsta) VALUES (1, 'za pokojne obitelji', 'pojedinacna')");
    expect(db.prepare("SELECT objava FROM mise_nakane").get()).toEqual({ objava: "papir" });
    db.exec("DELETE FROM mise WHERE id = 1");
    expect(db.prepare("SELECT count(*) AS n FROM mise_nakane").get()).toEqual({ n: 0 });
    // I brisanje broja briše mise i nakane.
    db.exec("INSERT INTO mise (id, broj_id, datum, sat, crkva_id) VALUES (2, 1, '2026-11-17', '18:00', 1)");
    db.exec("INSERT INTO mise_nakane (misa_id, tekst) VALUES (2, 'zajedničke nakane')");
    db.exec("DELETE FROM brojevi WHERE id = 1");
    expect(db.prepare("SELECT (SELECT count(*) FROM mise) + (SELECT count(*) FROM mise_nakane) AS n").get()).toEqual({ n: 0 });
  });

  it("broj je jedinstven po listiću, godištu i rednom broju", () => {
    const db = baza();
    const broj = (g: number, r: number) =>
      `INSERT INTO brojevi (listic_id, godiste, redni_broj, datum_od, datum_do, stvoreno_u, promijenjeno_u)
         VALUES (1, ${g}, ${r}, '2026-11-23', '2026-11-29', 't', 't')`;
    expect(greska(db, broj(3, 12))).toThrow(/UNIQUE constraint failed/);
    db.exec(broj(3, 13));
    db.exec(broj(4, 12));
  });

  it("datumi, sati, razdoblje i stanje", () => {
    const db = baza();
    const misa = (datum: string, sat: string) => `INSERT INTO mise (broj_id, datum, sat, crkva_id) VALUES (1, '${datum}', '${sat}', 1)`;
    expect(greska(db, misa("2026-02-30", "08:00"))).toThrow(/CHECK/);
    expect(greska(db, misa("2026-11-17", "24:00"))).toThrow(/CHECK/);
    expect(greska(db, misa("2026-11-17", "8:00"))).toThrow(/CHECK/);
    expect(greska(db, misa("2026-11-16", "18:00"))).toThrow(/UNIQUE/);
    db.exec(misa("2026-11-17", "23:59"));
    const broj = (od: string, do_: string, stanje = "nacrt", u = "NULL") =>
      `INSERT INTO brojevi (listic_id, godiste, redni_broj, datum_od, datum_do, stanje, objavljeno_u, stvoreno_u, promijenjeno_u)
         VALUES (1, 9, abs(random() % 1000) + 1, '${od}', '${do_}', '${stanje}', ${u}, 't', 't')`;
    expect(greska(db, broj("2026-11-23", "2026-11-22"))).toThrow(/CHECK/);
    expect(greska(db, broj("2026-11-23", "2026-11-29", "objavljen"))).toThrow(/CHECK/);
    expect(greska(db, broj("2026-11-23", "2026-11-29", "arhiviran", "'t'"))).toThrow(/CHECK/);
    db.exec(broj("2026-11-23", "2026-11-29", "objavljen", "'t'"));
    expect(
      greska(db, `INSERT INTO stalni_raspored (crkva_id, dani, sat, vrijedi_od, vrijedi_do, redoslijed)
                  VALUES (1, '["pon"]', '18:00', '2026-12-01', '2026-11-01', 0)`),
    ).toThrow(/CHECK/);
    expect(greska(db, `INSERT INTO stalni_raspored (crkva_id, dani, sat, redoslijed) VALUES (1, '[]', '18:00', 0)`)).toThrow(/CHECK/);
  });

  it("vlastita crkva bez izvora; veza na crkve_izvor je meka (uvoz smije brisati crkve)", () => {
    const db = baza();
    db.exec(`INSERT INTO crkve_izvor (slug, zupa_slug, name, redoslijed) VALUES ('crkva-test-w9100', 'zupa-test-9100', 'crkva Test', 0);
             UPDATE listic_crkve SET crkva_izvor_slug = 'crkva-test-w9100' WHERE id = 1;
             DELETE FROM crkve_izvor WHERE zupa_slug = 'zupa-test-9100';`);
    expect(db.prepare("SELECT crkva_izvor_slug FROM listic_crkve WHERE id = 1").get()).toEqual({
      crkva_izvor_slug: "crkva-test-w9100",
    });
    expect(greska(db, "DELETE FROM listic_crkve WHERE id = 1")).toThrow(/FOREIGN KEY/); // ima misu
  });
});

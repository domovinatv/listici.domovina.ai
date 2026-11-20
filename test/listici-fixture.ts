// Izmišljene župe i crkve (slugovi s brojevima 9001+ ne postoje u crkve.domovina.ai).
import type { ProfilUlaz } from "../src/lib/listic-shema.ts";
import { spremiProfil } from "../src/lib/listici.ts";
import type { RasporedMisaUlaz } from "../src/lib/raspored-shema.ts";
import { novaBaza } from "./d1-sqlite.ts";
import { primjerIzObrasca, SEZONE_PRIMJERA } from "./primjer.ts";

export const RAVNO = "sv-bartola-apostola-ravno-polje-9001";
export const BRDO = "sv-luke-evandjelista-malo-brdo-9002";
export const DOLINA = "sv-ane-tiha-dolina-9003";
export const SADA = "2026-11-20T12:00:00.000Z";

export function bazaSZupama() {
  const db = novaBaza();
  db.sirovo.exec(`
    INSERT INTO zupe (slug, kind, name, trazi, izvor_hash, uvezeno_u, promijenjeno_u) VALUES
      ('${RAVNO}', 'zupa', 'Župa sv. Bartola apostola', 'ravno polje', 'h', 't', 't'),
      ('${BRDO}', 'zupa', 'Župa sv. Luke evanđelista', 'malo brdo', 'h', 't', 't'),
      ('${DOLINA}', 'zupa', 'Župa sv. Ane', 'tiha dolina', 'h', 't', 't');
    INSERT INTO crkve_izvor (slug, zupa_slug, name, redoslijed) VALUES
      ('sv-bartola-apostola-ravno-polje-w9001', '${RAVNO}', 'crkva sv. Bartola apostola', 0),
      ('sv-luke-evandjelista-malo-brdo-w9002', '${BRDO}', 'crkva sv. Luke evanđelista', 0),
      ('sv-ane-tiha-dolina-w9003', '${DOLINA}', 'crkva sv. Ane', 0);
  `);
  return db;
}

export const profil = (izmjena: Partial<ProfilUlaz> = {}): ProfilUlaz => ({
  zupa_slug: RAVNO,
  naziv: "Glas Ravnog Polja",
  podnaslov: "župni listić župa Ravno Polje i Malo Brdo",
  kontakt: { adresa: "Trg 1, Ravno Polje", telefon: "01 555 0000", email: "ured@ravno-polje.example", web: "https://ravno-polje.example" },
  uredovno_vrijeme: "uto–pet 9–11 h",
  iban: "HR12 1001 0051 8630 0016 0", // primjer iz IBAN registra (ISO 13616)
  primatelj: "Župa Ravno Polje",
  sezone: SEZONE_PRIMJERA,
  blokovi: [
    { tip: "ispovijed_klanjanje", naslov: "Ispovijed", sadrzaj: "pola sata prije svake mise" },
    { tip: "zajednice", naslov: "Zbor", sadrzaj: "probe četvrtkom u 19 h" },
  ],
  ...izmjena,
});

export const primjer = () => structuredClone(primjerIzObrasca()) as RasporedMisaUlaz;

export async function listicSPrimjerom(db = bazaSZupama()) {
  const id = await spremiProfil(db, profil(), { sada: SADA });
  return { db, id };
}

/** Jedna župa, jedna crkva, bez sezona: za oblike 2–5. */
export function jednostavan(izmjena: Partial<RasporedMisaUlaz["tjedni"]> = {}, stalni: RasporedMisaUlaz["stalni"] = []): RasporedMisaUlaz {
  return {
    zupa: { slug: DOLINA },
    crkve: [{ id: "ana", crkve_ref: "sv-ane-tiha-dolina-w9003", naziv: "crkva sv. Ane", mjesto: "Tiha Dolina", uloga: "zupna" }],
    stalni,
    tjedni: { od: "2026-11-16", do: "2026-11-22", mise: [], ...izmjena },
  };
}

export const profilDoline = (izmjena: Partial<ProfilUlaz> = {}): ProfilUlaz => ({
  zupa_slug: DOLINA,
  naziv: "Župni listić Tiha Dolina",
  kontakt: { email: "zupa@tiha-dolina.example" },
  ...izmjena,
});

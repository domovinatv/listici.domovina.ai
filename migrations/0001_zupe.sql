-- Župe uvezene iz crkve.domovina.ai (data/zupa/<slug>.json). Ovdje se ne uređuju ručno.
-- Svjesno NEMA telefona, weba, e-maila ni google_maps_uri: u crkve dolaze iz Google
-- Placesa (odluka 3). Koordinate samo kad geocode_source nije Google (odluka 303).
CREATE TABLE zupe (
  slug            TEXT PRIMARY KEY,       -- ključ veze s crkve.domovina.ai
  oib             TEXT,                   -- 723 katoličke pravne osobe ga nemaju
  registry_id     INTEGER,                -- SBT_ID iz evidencije pravnih osoba
  kind            TEXT NOT NULL,          -- 'zupa'
  diocese         TEXT,
  name            TEXT NOT NULL,
  short_name      TEXT,
  titular         TEXT,
  address         TEXT,
  city            TEXT,
  county          TEXT,
  lat             REAL,                   -- NULL kad je izvor Google Places
  lng             REAL,
  geocode_source  TEXT,                   -- izvor koordinate u crkve (i kad je lat NULL)
  trazi           TEXT NOT NULL,          -- naziv + mjesto, mala slova bez dijakritika (pretraga)
  izvor_hash      TEXT NOT NULL,          -- SHA-256 preuzetih polja + crkava (detekcija promjene)
  uvezeno_u       TEXT NOT NULL,          -- ISO 8601 UTC, prvi uvoz
  promijenjeno_u  TEXT NOT NULL,          -- ISO 8601 UTC, zadnja promjena preuzetih polja
  nestalo_u       TEXT,                   -- slug više nije u indeksu (NULL = aktivna)
  novi_slug       TEXT                    -- kad je nestanak preimenovanje (vidi zupe_preimenovanja)
);
CREATE INDEX zupe_oib ON zupe (oib);
CREATE INDEX zupe_registry_id ON zupe (registry_id);
CREATE INDEX zupe_aktivne ON zupe (nestalo_u, name);

-- Građevine župe iz istog JSON-a (`churches`). Tablica, ne JSON stupac (odluka 302):
-- raspored misa (odluka 104) veže misu uz crkvu, pa crkva treba ključ.
CREATE TABLE crkve_izvor (
  slug              TEXT PRIMARY KEY,     -- slug crkve u crkve.domovina.ai
  zupa_slug         TEXT NOT NULL REFERENCES zupe (slug),
  name              TEXT NOT NULL,
  kind              TEXT,
  city              TEXT,
  lat               REAL,                 -- OSM/Wikidata, ne Places
  lng               REAL,
  is_parish_church  INTEGER NOT NULL DEFAULT 0,
  heritage_id       TEXT,                 -- registar kulturnih dobara (Z-…)
  redoslijed        INTEGER NOT NULL      -- poredak iz izvora (župna crkva prva)
);
CREATE INDEX crkve_izvor_zupa ON crkve_izvor (zupa_slug, redoslijed);

-- Slug koji je nestao, a isti OIB ili SBT_ID se pojavio pod novim slugom (odluka 304).
CREATE TABLE zupe_preimenovanja (
  stari_slug  TEXT NOT NULL,
  novi_slug   TEXT NOT NULL,
  kljuc       TEXT NOT NULL,              -- 'oib' | 'registry_id'
  u           TEXT NOT NULL,              -- ISO 8601 UTC
  PRIMARY KEY (stari_slug, novi_slug)
);

-- Dnevnik uvoza: jedan red po pokretanju.
CREATE TABLE uvozi (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  pocetak       TEXT NOT NULL,
  kraj          TEXT NOT NULL,
  u_indeksu     INTEGER NOT NULL,         -- broj kind == 'zupa' u indeksu
  nove          INTEGER NOT NULL,
  promijenjene  INTEGER NOT NULL,
  nestale       INTEGER NOT NULL,
  vracene       INTEGER NOT NULL,
  preimenovane  INTEGER NOT NULL,
  greske        INTEGER NOT NULL
);

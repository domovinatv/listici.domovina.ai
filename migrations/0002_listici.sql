-- Listić = profil + brojevi (odluka 101); raspored misa: crkva → stalni raspored → tjedne
-- mise (odluka 104). Obrazac: docs/research/2026-11-20-obrazac-listica.md.
-- Datumi su čisti 'YYYY-MM-DD' (date(x) IS x odbija i 2026-02-30), sati 'HH:MM'.

-- Serija listića, nositelj profila. Kontakt je ono što urednik sam unese (odluka 206),
-- nikad telefon ili web iz crkve.domovina.ai (Google Places, odluka 303).
CREATE TABLE listici (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  zupa_slug         TEXT NOT NULL REFERENCES zupe (slug),   -- glavna župa
  naziv             TEXT NOT NULL CHECK (length(trim(naziv)) > 0),  -- „Župni listić”, „Glas župe”
  podnaslov         TEXT,
  adresa            TEXT,
  telefon           TEXT,
  email             TEXT,
  web               TEXT,
  uredovno_vrijeme  TEXT,                                   -- slobodan tekst
  iban              TEXT CHECK (iban IS NULL OR iban GLOB '[A-Z][A-Z][0-9][0-9]*'),
  primatelj         TEXT,                                   -- primatelj uplate uz IBAN
  sezone            TEXT CHECK (sezone IS NULL OR json_valid(sezone)),  -- {"ljetno":{"od":"MM-DD","do":"MM-DD"},…}
  stvoreno_u        TEXT NOT NULL,
  promijenjeno_u    TEXT NOT NULL
);
CREATE INDEX listici_zupa ON listici (zupa_slug);

-- Sve župe koje listić pokriva, glavna uključena (Vukovar + Bogdanovci).
CREATE TABLE listici_zupe (
  listic_id  INTEGER NOT NULL REFERENCES listici (id) ON DELETE CASCADE,
  zupa_slug  TEXT NOT NULL REFERENCES zupe (slug),
  PRIMARY KEY (listic_id, zupa_slug)
);
CREATE INDEX listici_zupe_zupa ON listici_zupe (zupa_slug);

-- Kanonski tipovi sekcija = tablica „Sekcije” u obrascu. Uvijek osjetljivi (odluka 204):
-- sakramenti (krštenja, vjenčanja, ženidbeni navještaji) i pokojnici. Ostali tipovi mogu
-- biti osjetljivi (darovatelji s imenom, skupine s imenima): to označi urednik.
CREATE TABLE profil_blokovi (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  listic_id   INTEGER NOT NULL REFERENCES listici (id) ON DELETE CASCADE,
  tip         TEXT NOT NULL CHECK (tip IN ('zaglavlje', 'raspored_misa', 'kontakt', 'obavijesti',
                'liturgijski_naslov', 'razmatranje', 'evandjelje', 'navod_citanja', 'dogadaji', 'darovi',
                'zajednice', 'sakramenti', 'ispovijed_klanjanje', 'kateheza', 'pokojnici', 'slobodni')),
  naslov      TEXT,
  sadrzaj     TEXT,
  redoslijed  INTEGER NOT NULL,
  osjetljivo  INTEGER NOT NULL DEFAULT 0 CHECK (osjetljivo IN (0, 1)),
  CHECK (tip NOT IN ('sakramenti', 'pokojnici') OR osjetljivo = 1)
);
CREATE INDEX profil_blokovi_listic ON profil_blokovi (listic_id, redoslijed);

-- Crkve listića. `crkva_izvor_slug` je meka veza na crkve_izvor.slug, bez REFERENCES:
-- uvoz župa briše i ponovo upisuje crkve promijenjene župe (odluka 302), pa bi strani
-- ključ ili zaustavio uvoz ili (SET NULL) gubio vezu pri svakoj promjeni. Postojanje se
-- provjerava pri spremanju. NULL = vlastita crkva (bolnica, dom, kapela koje nema u izvoru).
CREATE TABLE listic_crkve (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  listic_id         INTEGER NOT NULL REFERENCES listici (id) ON DELETE CASCADE,
  kljuc             TEXT NOT NULL,                          -- crkve[].id iz dokumenta rasporeda
  crkva_izvor_slug  TEXT,
  naziv             TEXT NOT NULL,
  mjesto            TEXT,
  zupa_slug         TEXT NOT NULL REFERENCES zupe (slug),   -- javni raspored župe ide po ovome
  uloga             TEXT NOT NULL CHECK (uloga IN ('zupna', 'filijala', 'kapela', 'ostalo')),
  redoslijed        INTEGER NOT NULL,
  UNIQUE (listic_id, kljuc)
);
CREATE INDEX listic_crkve_zupa ON listic_crkve (zupa_slug);
CREATE INDEX listic_crkve_izvor ON listic_crkve (crkva_izvor_slug);

-- Pravila stalnog rasporeda po crkvi.
CREATE TABLE stalni_raspored (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  crkva_id          INTEGER NOT NULL REFERENCES listic_crkve (id) ON DELETE CASCADE,
  dani              TEXT NOT NULL CHECK (json_valid(dani) AND json_type(dani) = 'array'
                      AND json_array_length(dani) > 0),     -- ["pon","sri"], "blagdan"
  sat               TEXT NOT NULL CHECK (sat GLOB '[0-2][0-9]:[0-5][0-9]' AND sat < '24:00'),
  vrsta             TEXT NOT NULL DEFAULT 'redovna' CHECK (vrsta IN ('redovna', 'nedjeljna', 'blagdanska',
                      'zornica', 'vjencana', 'sprovodna', 'obiteljska', 'djecja', 'mladi', 'ostalo')),
  jezik             TEXT NOT NULL DEFAULT 'hr',
  tjedni_u_mjesecu  TEXT CHECK (tjedni_u_mjesecu IS NULL OR (json_valid(tjedni_u_mjesecu)
                      AND json_type(tjedni_u_mjesecu) = 'array')),
  vrijedi_od        TEXT CHECK (vrijedi_od IS NULL OR date(vrijedi_od) IS vrijedi_od),
  vrijedi_do        TEXT CHECK (vrijedi_do IS NULL OR date(vrijedi_do) IS vrijedi_do),
  sezona            TEXT CHECK (sezona IS NULL OR sezona IN ('zimsko', 'ljetno')),
  napomena          TEXT,
  redoslijed        INTEGER NOT NULL,
  CHECK (vrijedi_od IS NULL OR vrijedi_do IS NULL OR vrijedi_od <= vrijedi_do)
);
CREATE INDEX stalni_raspored_crkva ON stalni_raspored (crkva_id);

-- Broj listića. Objavljen broj ima vrijeme objave.
CREATE TABLE brojevi (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  listic_id       INTEGER NOT NULL REFERENCES listici (id) ON DELETE CASCADE,
  godiste         INTEGER NOT NULL CHECK (godiste > 0),
  redni_broj      INTEGER NOT NULL CHECK (redni_broj > 0),
  datum_od        TEXT NOT NULL CHECK (date(datum_od) IS datum_od),   -- razdoblje broja
  datum_do        TEXT NOT NULL CHECK (date(datum_do) IS datum_do),
  stanje          TEXT NOT NULL DEFAULT 'nacrt' CHECK (stanje IN ('nacrt', 'objavljen')),
  objavljeno_u    TEXT,
  stvoreno_u      TEXT NOT NULL,
  promijenjeno_u  TEXT NOT NULL,
  CHECK (datum_od <= datum_do),
  CHECK (stanje = 'nacrt' OR objavljeno_u IS NOT NULL),
  UNIQUE (listic_id, godiste, redni_broj)
);
CREATE INDEX brojevi_razdoblje ON brojevi (listic_id, stanje, datum_od, datum_do);

-- Sekcije broja; isti tipovi i isto pravilo osjetljivosti kao profil_blokovi.
CREATE TABLE sekcije (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  broj_id     INTEGER NOT NULL REFERENCES brojevi (id) ON DELETE CASCADE,
  tip         TEXT NOT NULL CHECK (tip IN ('zaglavlje', 'raspored_misa', 'kontakt', 'obavijesti',
                'liturgijski_naslov', 'razmatranje', 'evandjelje', 'navod_citanja', 'dogadaji', 'darovi',
                'zajednice', 'sakramenti', 'ispovijed_klanjanje', 'kateheza', 'pokojnici', 'slobodni')),
  naslov      TEXT,
  sadrzaj     TEXT,
  redoslijed  INTEGER NOT NULL,
  osjetljivo  INTEGER NOT NULL CHECK (osjetljivo IN (0, 1)),
  CHECK (tip NOT IN ('sakramenti', 'pokojnici') OR osjetljivo = 1)
);
CREATE INDEX sekcije_broj ON sekcije (broj_id, redoslijed);

-- Tjedne mise broja. Javni podaci (odluka 103); nakana je u mise_nakane.
CREATE TABLE mise (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  broj_id     INTEGER NOT NULL REFERENCES brojevi (id) ON DELETE CASCADE,
  datum       TEXT NOT NULL CHECK (date(datum) IS datum),
  sat         TEXT NOT NULL CHECK (sat GLOB '[0-2][0-9]:[0-5][0-9]' AND sat < '24:00'),
  crkva_id    INTEGER NOT NULL REFERENCES listic_crkve (id),
  vrsta       TEXT NOT NULL DEFAULT 'redovna' CHECK (vrsta IN ('redovna', 'nedjeljna', 'blagdanska',
                'zornica', 'vjencana', 'sprovodna', 'obiteljska', 'djecja', 'mladi', 'ostalo')),
  jezik       TEXT NOT NULL DEFAULT 'hr',
  otkazana    INTEGER NOT NULL DEFAULT 0 CHECK (otkazana IN (0, 1)),
  iz_stalnog  INTEGER NOT NULL DEFAULT 0 CHECK (iz_stalnog IN (0, 1)),
  uz_misu     TEXT CHECK (uz_misu IS NULL OR (json_valid(uz_misu) AND json_type(uz_misu) = 'array')),
  napomena    TEXT,
  UNIQUE (broj_id, datum, sat, crkva_id)
);
CREATE INDEX mise_datum ON mise (datum, crkva_id);

-- Nakana mise, odvojeno da javni upiti ne mogu slučajno čitati osobne podatke (odluke
-- 103, 203). 'papir_i_web' iz sheme obrasca ovdje ne postoji: odluka 203 ga zabranjuje.
CREATE TABLE mise_nakane (
  misa_id  INTEGER PRIMARY KEY REFERENCES mise (id) ON DELETE CASCADE,
  tekst    TEXT,
  vrsta    TEXT CHECK (vrsta IS NULL OR vrsta IN ('pojedinacna', 'skupna', 'zajednicka', 'bez_nakane')),
  objava   TEXT NOT NULL DEFAULT 'papir' CHECK (objava IN ('papir', 'nigdje'))
);

-- Pobožnosti bez mise: klanjanje, ispovijed, krunica…
CREATE TABLE ostali_termini (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  broj_id     INTEGER NOT NULL REFERENCES brojevi (id) ON DELETE CASCADE,
  datum       TEXT NOT NULL CHECK (date(datum) IS datum),
  sat         TEXT NOT NULL CHECK (sat GLOB '[0-2][0-9]:[0-5][0-9]' AND sat < '24:00'),
  do_sata     TEXT CHECK (do_sata IS NULL OR (do_sata GLOB '[0-2][0-9]:[0-5][0-9]' AND do_sata < '24:00')),
  crkva_id    INTEGER REFERENCES listic_crkve (id),
  vrsta       TEXT NOT NULL CHECK (vrsta IN ('klanjanje', 'ispovijed', 'krunica', 'pobožnost', 'ostalo')),
  napomena    TEXT
);
CREATE INDEX ostali_termini_broj ON ostali_termini (broj_id, datum, sat);

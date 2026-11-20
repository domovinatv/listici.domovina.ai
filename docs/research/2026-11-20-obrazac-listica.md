# Prijedlog standardnog obrasca župnog listića (R1)

Izvor nalaza: `docs/research/2026-11-20-zupni-listici.md` (63 listića, 37 župa, 15
biskupija). Ovo je prijedlog za `/todo-plan`, ne implementacija. Odluke: 100–109 u
`docs/decisions.md`.

## Načelo

Listić je **jedan strukturirani dokument** od dva dijela:

1. **Profil župe** (unosi se jednom, mijenja rijetko): zaglavlje, crkve, stalni raspored
   misa po crkvi, kontakt, uredovno vrijeme, IBAN, stalni termini (ispovijed, zbor,
   vjeronauk). U serijama listića se to ponavlja iz broja u broj.
2. **Broj listića** (svaki tjedan): razdoblje, liturgijski dio, **tjedni raspored misa**
   (predpopunjen iz stalnog rasporeda, ručno ispravljen), obavijesti i slobodni blokovi.

PDF (A4, 1–2 stranice, dva stupca, ili presavijeni A4 → A5 knjižica) i web stranica su
dva prikaza istog dokumenta (odluka 4 polazišta).

## Sekcije

Udio je iz uzorka (n = 63). „Obavezno” znači da obrazac bez nje ne objavljuje.

| Sekcija | Udio u uzorku | U obrascu | Izvor sadržaja |
|---|---:|---|---|
| Zaglavlje (naziv lista, župa, broj, godište, razdoblje, nedjelja) | 84 % | **obavezno** | profil + automatski broj i datum |
| Raspored misa (tjedni) | 81 % | **obavezno** (može biti „samo stalni raspored”) | stalni raspored → tjedni, ručno |
| Kontakt i uredovno vrijeme | 73 % | **obavezno** (bar jedno: telefon ili e-mail) | profil |
| Obavijesti | 63 % | opcijski, preporučen | tjedni unos (lista stavki) |
| Liturgijski naslov dana (nedjelja, godina A/B/C, boja, svetac uz dan) | 32–71 % | automatski, može se isključiti | izračun liturgijskog kalendara |
| Razmatranje | 60 % | opcijski | tjedni unos, slobodan tekst |
| Evanđelje (puni tekst) | 48 % | opcijski, **ručni unos ili navod** | vidi „Liturgija i prava” |
| Navod čitanja | 41 % | automatski | izračun (lekcionarski ciklus) |
| Događaji i najave | 40 % | opcijski | tjedni unos (datum, sat, mjesto, opis) |
| Darovi i financije | 35 % | opcijski | tjedni unos; IBAN iz profila |
| Župne zajednice (zbor, mladi, Caritas) | 35 % | opcijski | profil (stalni termini) + tjedni |
| Sakramenti (krštenja, vjenčanja, navještaji) | 33 % | opcijski, **osjetljivo** | tjedni unos, posebna pravila prikaza |
| Ispovijed i klanjanje | 22 % | opcijski | profil (stalno) + tjedne iznimke |
| Kateheza i vjeronauk | 21 % | opcijski | profil + tjedni |
| Pokojnici tjedna | 11 % | opcijski, **osjetljivo** | tjedni unos |
| Slobodni blok (molitva, humor, papa, biskupija, oglas) | 3–19 % | opcijski, do N blokova | tjedni unos s naslovom |

Redoslijed se ne fiksira, ali predložak ima zadani raspored (skice niže).

## Model rasporeda misa

Tri razine:

1. **Crkva** (iz crkve.domovina.ai kad postoji, inače lokalni zapis vezan na župu):
   župna, filijala, kapela, ostalo (bolnica, dom, groblje). U uzorku: do 4 crkve po
   listiću, više od jedne u 31 od 58.
2. **Stalni raspored** = pravila po crkvi i danu u tjednu, s razdobljem važenja
   (zimski/ljetni raspored, „od 1. 11.”).
3. **Tjedni raspored** = konkretne mise s datumom. Stvara se iz stalnog rasporeda za
   razdoblje broja, a urednik dodaje, briše i mijenja. Iznimka je razlika tjednog od
   stalnog rasporeda; ne zapisuje se posebno, nego se izračuna (za prikaz „promjena!”).

Nakana je **dio mise**, ali se prikazuje po pravilima privatnosti (odluka 102), ne
nužno na webu.

### JSON shema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://listici.domovina.ai/schema/raspored-misa.json",
  "title": "Raspored misa župnog listića",
  "type": "object",
  "required": ["zupa", "crkve", "stalni", "tjedni"],
  "properties": {
    "zupa": {
      "type": "object",
      "required": ["slug"],
      "properties": {
        "slug": {"type": "string", "description": "slug župe iz crkve.domovina.ai"},
        "dodatne_zupe": {"type": "array", "items": {"type": "string"},
          "description": "slugovi župa koje dijele isti listić (Vukovar + Bogdanovci)"}
      }
    },
    "crkve": {
      "type": "array", "minItems": 1,
      "items": {
        "type": "object",
        "required": ["id", "naziv", "uloga"],
        "properties": {
          "id": {"type": "string", "description": "lokalni id; ako postoji, crkve_ref = id crkve u crkve.domovina.ai"},
          "crkve_ref": {"type": ["string", "null"]},
          "naziv": {"type": "string", "examples": ["crkva sv. Nikole biskupa"]},
          "mjesto": {"type": "string"},
          "zupa_slug": {"type": "string", "description": "kojoj župi pripada (kad listić pokriva više župa)"},
          "uloga": {"enum": ["zupna", "filijala", "kapela", "ostalo"]}
        }
      }
    },
    "stalni": {
      "type": "array",
      "description": "pravila stalnog rasporeda",
      "items": {
        "type": "object",
        "required": ["crkva", "dani", "sat"],
        "properties": {
          "crkva": {"type": "string", "description": "crkve[].id"},
          "dani": {"type": "array", "items": {"enum": ["pon", "uto", "sri", "cet", "pet", "sub", "ned", "blagdan"]}},
          "sat": {"type": "string", "pattern": "^([01][0-9]|2[0-3]):[0-5][0-9]$"},
          "vrsta": {"$ref": "#/$defs/vrsta"},
          "jezik": {"type": "string", "default": "hr", "description": "BCP 47"},
          "tjedni_u_mjesecu": {"type": "array", "items": {"type": "integer", "minimum": 1, "maximum": 5},
            "description": "npr. [1] = prva nedjelja u mjesecu (filijala)"},
          "vrijedi_od": {"type": ["string", "null"], "format": "date"},
          "vrijedi_do": {"type": ["string", "null"], "format": "date"},
          "sezona": {"enum": [null, "zimsko", "ljetno"], "default": null},
          "napomena": {"type": "string"}
        }
      }
    },
    "tjedni": {
      "type": "object",
      "required": ["od", "do", "mise"],
      "properties": {
        "od": {"type": "string", "format": "date"},
        "do": {"type": "string", "format": "date"},
        "mise": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["datum", "sat", "crkva"],
            "properties": {
              "datum": {"type": "string", "format": "date"},
              "sat": {"type": "string", "pattern": "^([01][0-9]|2[0-3]):[0-5][0-9]$"},
              "crkva": {"type": "string"},
              "vrsta": {"$ref": "#/$defs/vrsta"},
              "jezik": {"type": "string", "default": "hr"},
              "otkazana": {"type": "boolean", "default": false,
                "description": "„nema svete mise” – prikazuje se, ne briše"},
              "iz_stalnog": {"type": "boolean", "description": "nastala iz pravila; false = dodana ručno"},
              "nakana": {
                "type": ["object", "null"],
                "properties": {
                  "tekst": {"type": "string", "description": "slobodan tekst, može biti skupna nakana"},
                  "vrsta": {"enum": ["pojedinacna", "skupna", "zajednicka", "bez_nakane"]},
                  "objava": {"enum": ["papir", "papir_i_web", "nigdje"],
                    "description": "odluka 102: zadano 'papir'"}
                }
              },
              "uz_misu": {"type": "array", "items": {"enum": ["krunica", "ispovijed", "klanjanje", "blagoslov", "procesija", "ostalo"]},
                "description": "pobožnosti prije/poslije mise"},
              "napomena": {"type": "string", "examples": ["predvodi biskup", "za prvopričesnike"]}
            }
          }
        },
        "ostali_termini": {
          "type": "array",
          "description": "pobožnosti bez mise: klanjanje, ispovijed, krunica, zornica bez mise",
          "items": {
            "type": "object",
            "required": ["datum", "sat", "vrsta"],
            "properties": {
              "datum": {"type": "string", "format": "date"},
              "sat": {"type": "string"},
              "do_sata": {"type": ["string", "null"]},
              "crkva": {"type": "string"},
              "vrsta": {"enum": ["klanjanje", "ispovijed", "krunica", "pobožnost", "ostalo"]},
              "napomena": {"type": "string"}
            }
          }
        }
      }
    }
  },
  "$defs": {
    "vrsta": {
      "enum": ["redovna", "nedjeljna", "blagdanska", "zornica", "vjencana", "sprovodna",
               "obiteljska", "djecja", "mladi", "ostalo"],
      "default": "redovna"
    }
  }
}
```

Napomene uz shemu:

- Sat se u uzorku piše na pet načina („8,00”, „8h”, „18:30h”, „8 i 10”); unos ga
  normalizira na `HH:MM`, prikaz piše hrvatski („18 h”, „18.30”).
- Nedjeljna misa koja rotira po filijalama izražava se s `tjedni_u_mjesecu` ili ručno u
  tjednom rasporedu. Složenije rotacije (svake druge nedjelje) ne modeliraju se:
  urednik ih ispravi u tjednom rasporedu. Revizija ako se pokaže da je to čest posao.
- Javni API rasporeda misa (cilj „putnik vidi mise”) daje `tjedni.mise` bez `nakana`,
  a gdje tjednog nema, izračun iz `stalni`, s oznakom „stalni raspored, nije potvrđen
  za ovaj tjedan”.

### Primjer

Izmišljen listić (župe, crkve i nakane ne postoje) koji pokazuje većinu sheme: dvije
župe na jednom listiću, tri crkve od kojih je jedna filijala s `tjedni_u_mjesecu`,
zimski i ljetni raspored (granice sezona su u profilu listića, ne u ovom dokumentu),
misa na albanskom, otkazana i premještena misa, dodatna misa, nakane raznih vrsta i
pobožnosti bez mise. Test `test/raspored-shema.test.ts` ovaj blok čita iz dokumenta i
validira ga, pa dokument i kod ne mogu razići.

```json
{
  "zupa": {
    "slug": "sv-bartola-apostola-ravno-polje-9001",
    "dodatne_zupe": ["sv-luke-evandjelista-malo-brdo-9002"]
  },
  "crkve": [
    {"id": "bartol", "crkve_ref": "sv-bartola-apostola-ravno-polje-w9001",
     "naziv": "crkva sv. Bartola apostola", "mjesto": "Ravno Polje",
     "zupa_slug": "sv-bartola-apostola-ravno-polje-9001", "uloga": "zupna"},
    {"id": "luka", "crkve_ref": "sv-luke-evandjelista-malo-brdo-w9002",
     "naziv": "crkva sv. Luke evanđelista", "mjesto": "Malo Brdo",
     "zupa_slug": "sv-luke-evandjelista-malo-brdo-9002", "uloga": "zupna"},
    {"id": "rok", "crkve_ref": null, "naziv": "kapela sv. Roka", "mjesto": "Gornji Kraj",
     "zupa_slug": "sv-bartola-apostola-ravno-polje-9001", "uloga": "filijala"}
  ],
  "stalni": [
    {"crkva": "bartol", "dani": ["pon", "uto", "sri", "cet", "pet"], "sat": "18:00", "sezona": "zimsko"},
    {"crkva": "bartol", "dani": ["pon", "uto", "sri", "cet", "pet"], "sat": "19:00", "sezona": "ljetno"},
    {"crkva": "bartol", "dani": ["sub"], "sat": "08:00"},
    {"crkva": "bartol", "dani": ["ned"], "sat": "08:00", "vrsta": "nedjeljna"},
    {"crkva": "bartol", "dani": ["ned"], "sat": "10:30", "vrsta": "nedjeljna"},
    {"crkva": "bartol", "dani": ["blagdan"], "sat": "10:30", "vrsta": "blagdanska"},
    {"crkva": "luka", "dani": ["ned", "blagdan"], "sat": "09:00", "vrsta": "nedjeljna"},
    {"crkva": "luka", "dani": ["ned"], "sat": "15:00", "vrsta": "nedjeljna", "jezik": "sq",
     "tjedni_u_mjesecu": [4], "napomena": "misa na albanskom jeziku"},
    {"crkva": "rok", "dani": ["ned"], "sat": "11:30", "vrsta": "nedjeljna", "tjedni_u_mjesecu": [1, 3]}
  ],
  "tjedni": {
    "od": "2026-11-16",
    "do": "2026-11-22",
    "mise": [
      {"datum": "2026-11-16", "sat": "18:00", "crkva": "bartol", "iz_stalnog": true,
       "nakana": {"tekst": "za pokojne iz Lipove ulice", "vrsta": "skupna", "objava": "papir"}},
      {"datum": "2026-11-17", "sat": "18:00", "crkva": "bartol", "iz_stalnog": true, "otkazana": true,
       "napomena": "nema svete mise: župnik je na duhovnim vježbama"},
      {"datum": "2026-11-18", "sat": "18:00", "crkva": "bartol", "iz_stalnog": true,
       "nakana": {"tekst": "zajedničke nakane", "vrsta": "zajednicka", "objava": "papir"},
       "uz_misu": ["krunica"]},
      {"datum": "2026-11-19", "sat": "18:00", "crkva": "bartol", "iz_stalnog": true,
       "nakana": {"vrsta": "bez_nakane", "objava": "nigdje"}},
      {"datum": "2026-11-20", "sat": "17:00", "crkva": "bartol", "iz_stalnog": false,
       "vrsta": "djecja", "napomena": "za prvopričesnike",
       "nakana": {"tekst": "za pokojne obitelji", "vrsta": "pojedinacna"}},
      {"datum": "2026-11-21", "sat": "08:00", "crkva": "bartol", "iz_stalnog": true,
       "nakana": {"tekst": "za zdravlje u obitelji", "vrsta": "pojedinacna", "objava": "papir"}},
      {"datum": "2026-11-21", "sat": "11:00", "crkva": "bartol", "iz_stalnog": false, "vrsta": "vjencana"},
      {"datum": "2026-11-22", "sat": "08:00", "crkva": "bartol", "vrsta": "nedjeljna", "iz_stalnog": true},
      {"datum": "2026-11-22", "sat": "09:00", "crkva": "luka", "vrsta": "obiteljska", "iz_stalnog": true},
      {"datum": "2026-11-22", "sat": "10:30", "crkva": "bartol", "vrsta": "nedjeljna", "iz_stalnog": true,
       "nakana": {"tekst": "za žive i pokojne župljane", "vrsta": "zajednicka", "objava": "papir"}},
      {"datum": "2026-11-22", "sat": "15:00", "crkva": "luka", "vrsta": "nedjeljna", "jezik": "sq",
       "iz_stalnog": true, "napomena": "misa na albanskom jeziku"}
    ],
    "ostali_termini": [
      {"datum": "2026-11-19", "sat": "17:00", "do_sata": "18:00", "crkva": "bartol", "vrsta": "klanjanje"},
      {"datum": "2026-11-21", "sat": "16:00", "crkva": "luka", "vrsta": "ispovijed", "napomena": "za krizmanike"}
    ]
  }
}
```

Uz granice sezona `zimsko` 10-01 – 04-30 i `ljetno` 05-01 – 09-30 razlika prema stalnom
rasporedu je: otkazana utorak 18:00, petak premješten s 18:00 na 17:00, dodana subota
11:00 (vjenčanje), promijenjena vrsta nedjelja 9:00 kod sv. Luke; kapela sv. Roka nema
misu jer je 22. 11. četvrta nedjelja.

## Liturgija i prava

- **Automatski:** naziv nedjelje ili blagdana, liturgijska godina (A/B/C), boja, svetac
  dana, **navod** čitanja. To je izračun kalendara, bez tuđeg teksta.
- **Ne automatski:** puni tekst evanđelja i čitanja (lekcionar, prijevod Biblije;
  nositelj prava nije provjeren). Urednik ga smije zalijepiti sam, kao danas u Wordu;
  aplikacija prikazuje polje „izvor teksta”. Uključivanje izvora uz dozvolu je pitanje
  za R2.

## Skice izgleda

### A. Tjedni listić, 1 stranica A4, dva stupca (najčešće u uzorku)

```
+--------------------------------------------------------------------------+
| ŽUPNI LISTIĆ  ·  Župa sv. Nikole biskupa, Jastrebarsko   Br. 567, god. XII |
| 33. nedjelja kroz godinu (A) · 15. – 22. studenoga 2026.                  |
+-------------------------------------+------------------------------------+
| RASPORED SVETIH MISA                | EVANĐELJE  Mt 25, 14-30            |
| Pon 16.11. sv. Margareta            |  (tekst ili samo navod)            |
|   7:30  sv. Nikola    + nakana      |                                    |
| Uto 17.11. BLAGDAN                  | RAZMATRANJE                        |
|   8:00  sv. Nikola    + nakana      |  ...                               |
|  19:00  sv. Nikola    + nakana      |                                    |
| ...                                 | OBAVIJESTI                         |
| Ned 22.11. KRIST KRALJ              |  • Župno klečanje u utorak ...     |
|   7:30  sv. Nikola                  |  • Kateheza nedjeljom 20:15 ...    |
|   9:00  Cvetković (filijala)        |                                    |
|   9:30 · 11:00 · 19:00 sv. Nikola   | NAJAVE                             |
|                                     |  22.11. 17:30 ministranti          |
| ISPOVIJED uto, čet, pet, ned 18:15  |                                    |
+-------------------------------------+------------------------------------+
| Župni ured: uto–pet 17:30–18:30 · tel · e-mail · web · IBAN               |
+--------------------------------------------------------------------------+
```

### B. Presavijeni A4 → A5 knjižica, 4 stranice (16 od 63 u uzorku)

```
 str. 1 (naslovnica)        str. 2               str. 3               str. 4 (poleđina)
+------------------+  +------------------+  +------------------+  +------------------+
| ŽUPNI LISTIĆ     |  | RAZMATRANJE      |  | RASPORED MISA    |  | ŽUPNE ZAJEDNICE  |
| župa, br., datum |  |                  |  |  (tjedni, sve    |  |  zbor, mladi,    |
| nedjelja, boja   |  | OBAVIJESTI       |  |   crkve)         |  |  Caritas         |
|                  |  |                  |  |                  |  | DAROVI / IBAN    |
| EVANĐELJE        |  | NAJAVE           |  | ISPOVIJED,       |  | KONTAKT,         |
| (tekst ili navod)|  |                  |  | KLANJANJE        |  | UREDOVNO VRIJEME |
+------------------+  +------------------+  +------------------+  +------------------+
 PDF se slaže za tisak u redoslijedu 4-1 / 2-3 (A4 položeno, obostrano).
```

### C. Web prikaz broja (mobitel)

```
+------------------------------+
| ← Župa sv. Nikole, Jastrebar.|
| Br. 567 · 15.–22. 11. 2026.  |
| 33. nedjelja kroz godinu (A) |
+------------------------------+
| DANAS I SUTRA                |
|  Ned 18:00 sv. Nikola        |
|  Pon  7:30 sv. Nikola        |
|  [ cijeli tjedan ▾ ]         |
+------------------------------+
| OBAVIJESTI                   |
|  • ...                       |
+------------------------------+
| [ PDF za tisak ]  [ Pretplata]|
+------------------------------+
 Nakane, sakramenti i pokojnici se na webu po zadanom ne prikazuju (odluka 102).
```

## Što obrazac namjerno ne radi

- Časopisni župni list (4–92 str., tromjesečni): izvan opsega.
- Slobodan prijelom (DTP): predlošci A, B s nekoliko tema; urednik bira sekcije i
  redoslijed, ne crta.
- Uvoz postojećih Word ili PDF listića (scraping) u produkciji: polazište, „Što ne
  raditi na početku”.

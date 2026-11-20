# Kako župni listići stvarno izgledaju (R1)

Sesija R1, 2026-11-20. Pitanje: imaju li hrvatski župni listići dovoljno zajedničke
strukture da se standardizira obrazac, i kakav je raspored misa u njima.

**Kratko:** imaju. Svaki listić ima isti kostur (zaglavlje, raspored misa, obavijesti,
kontakt) i tjedni liturgijski dio. Raspored misa je **tjedna datirana tablica s
nakanama, a ne stalni raspored**: samo 9 od 63 listića navodi stalni raspored. U više od
pola listića je više od jedne crkve. Nedjeljne mise su iz tjedna u tjedan stabilne, a
radni dani nisu. Osobni podaci su u većini listića, i to ne samo u nakanama.

## Metoda

- **Popis župa:** `https://crkve.domovina.ai/data/zupe-index.json`, dohvaćeno
  2026-11-20 (`count` 2358 ustanova, od toga 1561 `kind == "zupa"` u 16 biskupija i
  eparhija; Vojni ordinarijat u indeksu nije). Telefon i web iz tog izvora nisu korišteni.
- **Pronalazak:** 25 pretraga (Firecrawl search, 10 rezultata) po biskupiji i gradu,
  nekoliko dopunskih kroz WebSearch; 241 URL. Upiti: `data/raw/queries.tsv` (gitignoran).
- **Zbirka:** 3 agenta (Sonnet 5.5) po regijama dohvatili su listiće curlom s javnih
  stranica župa, biskupija i e-zupe.com. Bez preglednika i bez Facebooka/Instagrama.
  Datoteke, `index.csv` i bilješke su u `data/uzorci/` (gitignorano, ne objavljuje se).
- **Analiza:** 3 agenta (Sonnet 5.5) pročitali su svaki listić (`pdftotext -layout`,
  slike vizualno, HTML) i zapisali jedan JSON red po listiću u `data/uzorci/analiza.jsonl`
  (sekcije s kanonskim tipovima, format, alat, liturgija, crkve, svaka misa s danom,
  satom, crkvom i vrstom, bez imena iz nakana). Brojke ispod su iz tog fajla
  (`python3` nad `analiza.jsonl`, 2026-11-20). Ručna provjera jednog retka
  (Jastrebarsko, 2026-11-15) prema PDF-u: mise, sati i filijala se poklapaju.

### Uzorak

| | |
|---|---|
| Datoteke | 77 (`wc -l data/uzorci/index.csv` = 78 s headerom) |
| Listići (višestranične slike spojene) | 71 |
| od toga **tjedni/dvotjedni/blagdanski listići** | **63**, iz 37 župa i 15 biskupija |
| od toga **časopisi** (župni list, 4–92 str., 2–4 puta godišnje) | 8 |
| Serije uzastopnih brojeva | 13 župa (12 × 3 broja, 1 × 2) |
| Datum listića | 54 iz 2026, 7 iz 2025, 9 stariji (2017–2024), 7 nepoznato |
| Izvor | web župe 54, e-zupe.com 9, web biskupije 7, ostalo (općina, grad, Google Drive) 7 |
| Mjesto | grad 41, gradić 23, selo 13 (datoteke) |

Sve brojke u nastavku odnose se na **63 listića**, osim gdje piše drukčije. Časopisi
(Sinj, Hrvace, Vinjani, Šibenik-Meterize ×2, Šibenik-Crnica, Dubrovnik katedrala i jedan
sezonski broj Popovače) su drugi proizvod i nisu cilj ove aplikacije.

Popis župa u uzorku je na kraju dokumenta.

### Ograničenja

- **Križevačka eparhija: 0 listića.** Nijedna grkokatolička župa nema javni listić na
  webu (probano: krizevacka-eparhija.hr, web pretraga, Žumberak/Pribić). Moguće da ga
  imaju samo na Facebooku.
- Požeška (1 župa), Krk (1), Hvarska (1), Riječka (samo grad Rijeka) i Gospićko-senjska
  (bez Gospića: domena župe se 2026-11-20 nije razrješavala) slabo su pokrivene.
- **Uzorak je pristran prema župama s webom.** Za Slavonski Brod, Novu Gradišku, Požegu,
  Lipik, Supetar, Nin, Mokošicu i druge listić je nađen samo na Facebooku (vidi niže),
  a Facebook nije skupljan. Župe koje objavljuju samo na papiru uopće nisu vidljive.
- Tri listića su skenovi bez tekstnog sloja (čitani kao slika), a jedan (Koprivnica)
  ima tri stupca koje `pdftotext` miješa; ti redovi imaju moguće greške u satima.

## Gdje i kako se listići objavljuju

Iz bilješki agenata (`data/uzorci/biljeske-{A,B,C}.md`):

- **WordPress s PDF-om u `wp-content/uploads`** je najčešći put. Naziv datoteke je
  proizvoljan (`Zupni-listic-28.-NKG.pdf`, `listicXIX_20.pdf`, `GZ-46-26.pdf`), pa se
  arhiv ne može pogoditi. Neke župe objavljuju cijeli listić kao **WordPress/Wix objavu
  (HTML)** bez PDF-a (Stari Pazin, Jelsa, Visoka, Vinkovci, Otočac): 11 od 63.
- **e-zupe.com** (postojeća platforma za web stranice župa) hostira PDF-ove u
  `/zupni-dokumenti/<id>/`. Stranica župe je JS-renderirana, a nazivi datoteka nisu
  normirani. Svibovec ima modul, ali „nema objavljenih župnih listića”.
- Ostalo: Joomla + Phoca Download (Osijek, listići kao **DOCX**), Google Sites + Drive
  (Bjelovar), site123 (Benkovac, 4 JPG-a), web općine ili grada (Kaptol, Grubišno
  Polje), slika u objavi (Mali Lošinj, Rijeka sv. Antun), flipbook plugin bez PDF linka
  (Mokošica).
- **Facebook i Instagram** su za dio župa jedini kanal (u rezultatima pretrage: Nova
  Gradiška, Lipik, Končanica, Supetar, Nin, Mokošica, Dugo Selo, Mali Lošinj, Gospić,
  Rovinj, Sv. Ćiril i Metod Osijek). Listić je tamo slika ili tekst objave.
- **sveta-misa.org** se pojavljuje kao jedini izvor rasporeda za dio slavonskih župa;
  postojeći servis rasporeda misa (za R2).

**Alat** (iz `pdfinfo` Creator/Producer i izgleda): Word 27, WPS 3, Canva 3, Wix 3,
WordPress 3, LibreOffice 1, InDesign 1, Publisher 1, nepoznato 20 (slike, skenovi). Dakle
**listić se piše u Wordu**, a ne u DTP alatu; obrazac se natječe s Wordovim dokumentom
koji župnik kopira iz tjedna u tjedan.

## Format

| | broj od 63 |
|---|---|
| A4 | 41 |
| A5 | 8 |
| drugo (A4 položeno, A3/A2 presavijeno, web) | 14 |
| 1 stranica | 18 |
| 2 stranice | 29 |
| 4 stranice | 16 |
| presavijen (A4 → A5 knjižica ili A3 → A4) | 19 (35 ne, 9 nepoznato) |
| stupci: 1 / 2 / 3 | 23 / 35 / 11 (od 69 svih) |
| učestalost: tjedni / dvotjedni / blagdanski / nepoznato | 56 / 2 / 3 / 2 |

Prevladava **tjedni listić na 1–2 stranice A4 (ili presavijenom A4) u dva stupca**,
od nedjelje do nedjelje. Za blagdane (Božić, Uskrs) izlazi dvobroj ili veći broj.

## Sekcije

Kanonski tipovi (definicija u `data/raw/brief-analiza.md`), udio listića u kojima se
sekcija pojavljuje (n = 63):

| Sekcija | Listića | Udio | Osobni podaci |
|---|---:|---:|---|
| zaglavlje (naslov lista, broj, godište, nedjelja, datum) | 53 | 84 % | |
| **raspored misa** (s nakanama ili bez) | 51 | 81 % | imena pokojnih u nakanama (46 sekcija) |
| kontakt i uredovno vrijeme | 46 | 73 % | |
| obavijesti | 40 | 63 % | ponekad imena živih (5) |
| razmatranje / propovijed | 38 | 60 % | |
| evanđelje (puni tekst) | 30 | 48 % | |
| događaji i najave | 25 | 40 % | djeca (2) |
| darovi i financije (darovatelji, iznosi, IBAN) | 22 | 35 % | **imena i iznosi darovatelja** (10) |
| župne zajednice i skupine (zbor, mladi, Caritas, ministranti) | 22 | 35 % | imena (4), djeca (3) |
| sakramenti (krštenja, vjenčanja, ženidbeni navještaji, pričest, krizma) | 21 | 33 % | **imena živih (10), djece (9)**, navještaji s datumom rođenja i adresom |
| liturgijski kalendar (svetac, blagdan po danu) | 20 | 32 % | |
| ispovijed i klanjanje | 14 | 22 % | |
| kateheza i vjeronauk | 13 | 21 % | djeca (3) |
| humor i zanimljivosti | 12 | 19 % | |
| molitva | 11 | 17 % | |
| čitanja (navod ili tekst) | 8 | 13 % | |
| pokojnici (umrli tjedna) | 7 | 11 % | imena pokojnih (7) |
| papa / Crkva u svijetu | 7 | 11 % | |
| svetac (zaseban tekst) | 6 | 10 % | |
| intencije (zaseban blok, ne uz mise) | 2 | 3 % | imena pokojnih |
| oglasi i sponzori | 2 | 3 % | |
| vijesti biskupije | 2 | 3 % | |

Što se iz tjedna u tjedan **ne mijenja**: zaglavlje, kontakt, uredovno vrijeme, IBAN,
stalni termini ispovijedi, proba zbora. U serijama je 2–7 tipova sekcija isto u svim
brojevima, a ukupno ih se pojavi 7–13 (`analiza.jsonl`, serije iz `index.csv`, stupac
`serija`). Obrazac zato treba **stalne blokove župe** (upiše se jednom) i **tjedni sadržaj**.

## Raspored misa

| | |
|---|---|
| Listića s misama | 53 od 63 (10 nema rasporeda: časopisni dio, samo evanđelje, samo slika naslovnice) |
| od toga s datiranim misama (konkretni dani u tjednu) | 52 |
| od toga s **nakanama** uz misu | 41 |
| Listića koji navode **stalni raspored** | 9 |
| Listića s **iznimkama** (blagdan, promjena sata, ukinuta ili dodatna misa) | 59 od 69 |
| Misa ukupno (69 listića) | 694; medijan 11 po listiću, raspon 0–34 |
| Misa s nakanom / bez | 443 / 251 |
| Crkava po listiću | medijan 1; **više od jedne u 31 od 58** listića koji navode crkve; do 4 |
| Uloga crkava | župna 66, filijala 29, kapela 11, ostalo (bolnica, dom, groblje) 10 |
| Vrsta mise | redovna 284, nedjeljna 204, blagdanska 128, ostalo 35, krunica 14, zornica 12, klanjanje 7, vjenčana 6, ispovijed 3, sprovodna 1 |
| Najčešći sati | 18:00 (125), 18:30 (115), 08:00 (60), 11:00 (54), 07:00 (53), 19:00 (48), 09:00 (46) |

**Koliko je raspored pravilan.** Za 12 serija s misama usporedili smo skup (dan, sat)
u uzastopnim brojevima:

| Serija | (dan, sat) u svim brojevima / ukupno | nedjelja | radni dani |
|---|---|---|---|
| Jastrebarsko | 11/14 | 5/5 | 6/9 |
| Belafuža (Zadar) | 9/12 | 3/3 | 6/9 |
| Pula | 9/13 | 3/4 | 6/9 |
| Vugrovec | 6/10 | 3/3 | 3/7 |
| Kman (Split) | 8/16 | 5/5 | 3/11 |
| Stari Pazin | 9/17 | 3/3 | 6/14 |
| Kaptol | 8/18 | 2/3 | 6/15 |
| Vukovar | 3/17 | 2/2 | 1/15 |
| Jelsa | 4/22 | 3/7 | 1/15 |
| Koprivnica (*) | 2/20 | 1/4 | 1/16 |

(*) Koprivnica je trostupčani PDF; dio razlike je greška čitanja. Popovača (sezonski
list) je izostavljena.

Zaključak: **nedjeljne mise su uglavnom stabilne** (u 6 od 10 serija iste u svim brojevima; u ostalima se mijenja jedna misa ili crkva, a Koprivnica je dijelom greška čitanja), a
**radni dani se mijenjaju svaki tjedan**: blagdani, sprovodne i zavjetne mise, misa
koja se seli po filijalama, zimsko računanje vremena. Model zato ne može biti samo
„stalni raspored”. Mora biti **stalni raspored + tjedna lista stvarnih misa** koja se
predpopuni iz stalnog rasporeda i ručno ispravi. To potvrđuje i to da 52 od 53 listića
s misama navode konkretne datume, a samo 9 stalni raspored.

Oblici koji se javljaju (iz `zapazanja`):
1. datirana tablica po danima s nakanama (najčešće),
2. slobodan tekst po danima (Jelsa, HTML),
3. dvotjedni ili blagdanski dvobroj (Kaptol, Žminj, Velika Gorica, Duga Resa),
4. samo stalni raspored (Mali Lošinj, Rijeka, Šibenik),
5. bez misa (Bjelovar sv. Antuna, Split Srce Isusovo, Otočac).

Što model mora podržati:
- **crkva po misi**, ne po listiću; nedjeljna misa rotira po filijalama (Virje, Kaptol),
- **jedan listić za više župa** (Vukovar + Bogdanovci, Grubišno Polje + Veliki Zdenci,
  Stari Pazin sv. Juraj + sv. Lucija, Kaptol + Ramanovci),
- **jezik mise** (Vukovar ima misu na albanskom),
- **nakanu kao slobodan tekst ili skupnu** („zajedničke nakane”, „za pokojne iz ulice X”,
  „nema nakane”), do 12 imena po misi,
- **„nema svete mise”** kao eksplicitnu iznimku,
- **promjenu rasporeda s datumom početka** (zimski/ljetni raspored),
- **pobožnosti uz mise** (krunica, klanjanje, ispovijed prije mise, zornica),
- satove u svim zapisima („8,00”, „18:30h”, „8 i 10”) treba normalizirati na `HH:MM`.

Listići imaju i vlastite greške: pogrešan dan u tjednu uz datum (Hrvace, 10. 1. 2026.),
pogrešan naziv nedjelje (Kman). Strukturirani unos s kalendarom ih uklanja.

## Liturgijski sadržaj

| | listića od 63 |
|---|---:|
| svetac dana ili blagdan uz datum | 45 |
| razmatranje / propovijed | 39 |
| liturgijski tjedan ili nedjelja (npr. „33. nedjelja kroz godinu, godina A”) | 35 |
| **puni tekst evanđelja** | 30 |
| navod čitanja (knjiga, poglavlje, retci) | 26 |
| puni tekst svih čitanja | 2 |
| **naveden izvor** teksta | 2 (biskupija-varazdinska.hr; navod nedjelje) |

Gotovo pola listića prenosi **puni tekst evanđelja**, a praktično nijedan ne navodi
odakle. Tekst je iz hrvatskog lekcionara i prijevoda Biblije (nositelj prava HBK /
Kršćanska sadašnjost). To je **pitanje za R2**: aplikacija ne smije automatski ubacivati
puni tekst bez dozvole. Navod čitanja, naziv nedjelje, liturgijsku boju i sveca dana
smije se izračunati (liturgijski kalendar nije autorsko djelo); puni tekst je
opcija tek uz dozvolu nositelja prava ili kao poveznica.

## Osobni podaci

Brojke su sekcije s oznakom osobnih podataka (agent je označavao, imena nisu prepisana):

- **nakane s imenima pokojnih** uz mise: 46 sekcija; 443 od 694 mise imaju nakanu,
- **sakramenti**: imena živih (10) i djece (9): krštenici, prvopričesnici, krizmanici,
  i **ženidbeni navještaji s datumom rođenja, roditeljima i adresom** (Krašić, Kaptol),
- **darovatelji s imenom, adresom i iznosom** (10),
- pokojnici tjedna (7), popisi ministranata, zbora, rasporeda čišćenja crkve,
  rođendani starijih župljana.

Sve se to danas objavljuje javno na webu i Facebooku, bez vidljive privole. Kad
aplikacija to ima strukturirano i indeksirano, rizik je veći nego kod PDF-a. Odluke
101–103 i R2.

## Što iz ovoga slijedi

1. Zajednička struktura postoji (odluka 4 polazišta drži): obrazac je realan.
2. Srce modela je **misa kao zaseban zapis** (datum, sat, crkva, vrsta, jezik, nakana,
   napomena), predpopunjena iz **stalnog rasporeda po crkvi**.
3. Listić = **stalni blokovi župe** + **tjedni sadržaj** (liturgija, obavijesti,
   događaji, slobodni blokovi).
4. Časopisni župni list nije cilj.
5. Konkurencija za R2: e-zupe.com (web župa s rubrikom listića), sveta-misa.org
   (raspored misa), Word (glavni alat).

Prijedlog obrasca: `docs/research/2026-11-20-obrazac-listica.md`. Odluke: blok 100 u
`docs/decisions.md`.

## Prilog: župe u uzorku

Izvor: `data/uzorci/index.csv` (2026-11-20). Stupac „Datoteka” je broj datoteka
(višestranične slike broje se po stranici). Slug `nepoznato-*` znači da župa nije u
crkve indeksu; slugovi Vugrovca, Starog Pazina i Duge Rese (u indeksu kao Ogulin)
su pretpostavka zbirke i treba ih provjeriti.

| Biskupija | Župa (slug) | Mjesto | Tip | Izvor | Format | Datoteka | Najnoviji |
|---|---|---|---|---|---|---|---|
| bjelovarsko-krizevacka | `sv-antuna-padovanskog-bjelovar-0766` | Bjelovar | grad | ostalo | pdf | 2 | 2026-11-15 |
| bjelovarsko-krizevacka | `sv-josipa-grubisno-polje-9499` | Grubišno Polje | gradić | ostalo | pdf | 1 | 2026-11-15 |
| bjelovarsko-krizevacka | `sv-terezije-avilske-bjelovar-3631` | Bjelovar | grad | web-zupe | pdf | 1 | 2026-11-15 |
| djakovacko-osjecka | `kraljice-mucenika-vukovar-6400` | Vukovar | grad | web-zupe | pdf | 3 | 2026-11-15 |
| djakovacko-osjecka | `presvetog-srca-isusova-vinkovci-9782` | Vinkovci | grad | web-zupe | html | 1 | 2026-09-20 |
| djakovacko-osjecka | `sv-cirila-i-metoda-slavenskih-apostola-osijek-5783` | Osijek | grad | web-zupe | docx | 1 | 2026-11-08 |
| djakovacko-osjecka | `uzvisenja-svetog-kriza-osijek-4605` | Osijek | grad | web-zupe | html | 1 | 2026-11-15 |
| dubrovacka | `sv-mihajla-lapad-dubrovnik-4051` | Dubrovnik | grad | web-zupe | jpg | 2 | 2022-01-14 |
| dubrovacka | `velike-gospe-dubrovnik-9656` | Dubrovnik | grad | web-zupe | pdf | 1 |  |
| gospicko-senjska | `bl-alojzija-stepinca-ogulin-6703` | Ogulin | gradić | web-zupe | pdf | 1 | 2026-11-15 |
| gospicko-senjska | `presvetog-trojstva-otocac-4521` | Otočac | gradić | web-zupe | html | 1 | 2026-11-15 |
| gospicko-senjska | `uznesenja-bdm-ostarije-6152` | Oštarije | selo | web-zupe | pdf | 1 | 2026-11-15 |
| hvarska | `uznesenja-marijina-jelsa-9268` | Jelsa | gradić | web-zupe | html | 3 | 2026-11-15 |
| krk | `rodenja-b-d-marije-mali-losinj-9738` | Mali Lošinj | gradić | web-zupe | jpg, png | 3 | 2026-11-15 |
| porecko-pulska | `sv-ivana-krstitelja-pula-4766` | Pula | grad | web-zupe | pdf | 3 | 2026-11-15 |
| porecko-pulska | `sv-mihovila-zminj-6272` | Žminj | selo | web-biskupije | jpg | 2 |  |
| porecko-pulska | `sv-nikole-pazin-2476` | Pazin | gradić | web-zupe | html | 3 | 2026-11-15 |
| pozeska | `sv-petra-i-pavla-apostola-kaptol-2440` | Kaptol | selo | ostalo | pdf | 3 | 2026-07-26 |
| rijecka | `marije-pomocnice-rijeka-9856` | Rijeka | grad | e-zupe | pdf | 2 | 2026-11-08 |
| rijecka | `sv-antuna-padovanskog-rijeka-7791` | Rijeka | grad | web-zupe | jpg | 2 | 2021-07-11 |
| sibenska | `bezgrjesnog-zaceca-bdm-sibenik-crnica-701336` | Šibenik | grad | web-biskupije | pdf | 1 |  |
| sibenska | `nepoznato-vidici-sibenik` | Šibenik | grad | ostalo | pdf | 1 | 2021-08-07 |
| sibenska | `sv-jeronima-sibenik-meterize-5260` | Šibenik | grad | web-biskupije | pdf | 2 |  |
| sisacka | `preobrazenja-gospodnjeg-petrinja-7610` | Petrinja | grad | web-zupe | html, pdf | 2 | 2026-11-20 |
| sisacka | `sv-alojzija-gonzage-popovaca-701767` | Popovača | gradić | web-zupe | pdf | 3 | 2025-br2 |
| sisacka | `uzvisenja-sv-kriza-sisak-1416` | Sisak | grad | web-zupe | jpg | 1 | 2020-09-06 |
| splitsko-makarska | `gospe-sinjske-700572` | Sinj | gradić | web-zupe | pdf | 1 |  |
| splitsko-makarska | `nepoznato-vinjani` | Vinjani | selo | web-biskupije | pdf | 1 | 2025-12-25 |
| splitsko-makarska | `pomocnice-krscana-split-700413` | Split | grad | e-zupe | pdf | 3 | 2025-04-27 |
| splitsko-makarska | `presv-srca-isusova-split-700579` | Split | grad | web-zupe | html | 1 | 2026-11-22 |
| splitsko-makarska | `svih-svetih-hrvace-700419` | Hrvace | selo | web-biskupije | pdf | 1 | 2025-12-25 |
| varazdinska | `sv-antuna-padovanskog-koprivnica-2941` | Koprivnica | grad | web-zupe | pdf | 3 | 2026-05-24 |
| varazdinska | `sv-martina-b-virje-1162` | Virje | selo | web-zupe | pdf | 1 | 2026-11-08 |
| zadarska | `porodenja-bdm-benkovac-701781` | Benkovac | gradić | web-zupe | jpg | 4 | 2026-11-15 |
| zadarska | `sv-josipa-radnika-zadar-plovanija-701961` | Zadar | grad | web-zupe | pdf | 1 | 2021-04-18 |
| zadarska | `uznesenja-bdm-zadar-belafuza-701962` | Zadar | grad | e-zupe | pdf | 3 | 2026-04-26 |
| zagrebacka | `b-d-marije-snjezne-karlovac-4573` | Karlovac | grad | web-zupe | pdf | 1 | 2026-11-15 |
| zagrebacka | `muke-isusove-zagreb-1062` | Zagreb | grad | e-zupe | pdf | 1 | 2026-11-02 |
| zagrebacka | `navjestenja-b-d-marije-velika-gorica-1477` | Velika Gorica | grad | web-zupe | pdf | 1 | 2026-11-15 |
| zagrebacka | `presvetog-srca-isusova-karlovac-7536` | Karlovac | grad | web-zupe | pdf | 1 | 2026-11-16 |
| zagrebacka | `presvetog-trojstva-krasic-4246` | Krašić | selo | web-zupe | pdf | 1 | 2026-11-01 |
| zagrebacka | `sv-franje-ksaverskog-sesvete-3439` | Vugrovec (Sesvete, Zagreb) | selo | web-zupe | pdf | 3 | 2026-11-16 |
| zagrebacka | `sv-nikole-biskupa-jastrebarsko-5673` | Jastrebarsko | gradić | web-zupe | pdf | 3 | 2026-11-15 |

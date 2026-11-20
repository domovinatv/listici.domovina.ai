# Odluke

Svaka odluka ima broj, datum, razlog i uvjet revizije. Ne briše se nego zamjenjuje.
Blokovi: polazište 1–99, R1 100–199, R2 200–299; plan sesija dodjeljuje dalje.

## Polazište (2026-11-20)

1. **Zaseban javni repo, MIT.** Veza s crkve.domovina.ai je slug župe (+ OIB).
2. **Stack:** Astro SSR + Cloudflare Worker + D1; predložak `../omm.domovina.ai`.
3. **Župe se uvoze iz crkve.domovina.ai**, ne održavaju se ovdje. Telefon/web/koordinate
   koje crkve ima iz Google Placesa se ne preuzimaju.
4. **Prvo istraživanje (R1, R2), zatim `/todo-plan`.** Revizija: nikad unatrag; ako R1
   pokaže da ideja ne drži (npr. listići nemaju zajedničku strukturu), to je nalaz.
5. **Tuđi listići nisu u gitu** (`data/uzorci/` gitignoran): autorsko pravo i osobni
   podaci. U git ide samo analiza.

## R1: kako listići izgledaju (2026-11-20)

Izvor: `docs/research/2026-11-20-zupni-listici.md`, prijedlog
`docs/research/2026-11-20-obrazac-listica.md`.

100. **Cilj je tjedni listić, ne časopis.** 56 od 63 listića je tjedno; 8 uzoraka su
     časopisni „župni listovi” (4–92 str., 2–4 puta godišnje) i nisu u opsegu.
     Revizija: ako R2 ili pilot pokažu da župe traže i časopis.
101. **Listić = profil župe + broj.** Zaglavlje, crkve, stalni raspored, kontakt,
     uredovno vrijeme, IBAN i stalni termini unose se jednom; broj ima razdoblje,
     liturgiju, tjedne mise, obavijesti i slobodne blokove. Razlog: u serijama se
     isti blokovi ponavljaju svaki tjedan. Revizija: nikad unatrag.
102. **Osobni podaci: zadano samo na papiru.** Nakane s imenima, sakramenti (krštenja,
     ženidbeni navještaji), pokojnici i darovatelji ulaze u PDF za tisak, a na webu i u
     API-ju se po zadanom ne prikazuju. Urednik ih može uključiti po sekciji tek kad R2
     zatvori pravno pitanje. Razlog: u 41 od 53 listića s misama su imena u nakanama,
     a navještaji imaju datum rođenja i adresu. Revizija: R2 (pravno).
103. **Javni raspored misa nikad ne nosi nakane.** API i karta „mise u blizini” daju
     samo datum, sat, crkvu, vrstu, jezik i napomenu. Revizija: nema.
104. **Model rasporeda: crkva → stalni raspored → tjedne mise.** Tjedne mise se
     predpopune iz stalnih pravila i ručno ispravljaju; iznimke se izračunavaju kao
     razlika. Crkva je po misi, listić može pokrivati više župa. Razlog: 52 od 53
     listića s misama navode datirane mise, samo 9 stalni raspored; radni dani se
     mijenjaju svaki tjedan, nedjelje rijetko. Shema u prijedlogu obrasca.
     Revizija: S-sesija koja gradi unos, ako se pokaže da urednici ne održavaju stalni raspored.
105. **Liturgija: automatski samo kalendar i navodi.** Naziv nedjelje, godina A/B/C,
     boja, svetac i navod čitanja računaju se; puni tekst evanđelja (u 30 od 63
     listića, gotovo nikad s izvorom) urednik unosi sam. Revizija: R2, ako nositelj
     prava (HBK/KS) dopusti preuzimanje.
106. **Tri obavezne sekcije:** zaglavlje, raspored misa (može biti samo stalni),
     kontakt. Sve ostalo je opcijsko. Razlog: 84 %, 81 % i 73 % listića; ostale
     sekcije su ispod 65 %. Revizija: pilot sa župama.
107. **Izlaz: A4 jedna/dvije stranice u dva stupca i presavijeni A4 → A5 knjižica.**
     41 od 63 je A4, 19 presavijenih, 2 stupca najčešća. Revizija: pilot.

## R2: identitet, osobni podaci, liturgija, servisi (2026-11-20)

Izvor: `docs/research/2026-11-20-identitet-pravo-servisi.md`. Odluke označene (!)
su prijedlog dok ih korisnik ne potvrdi (pitanja na vrhu izvještaja i `S1.md`).

200. **Prvi urednik župe potvrđuje se preko službenog kontakta iz biskupijskog
     adresara.** Kod na e-mail župe iz adresara (bilo koja domena), a gdje e-maila nema,
     administrator zove broj iz adresara. Administrator ručno upiše URL adresara i datum.
     Razlog: e-mail na domeni biskupije je pravilo samo u Varaždinskoj (70/72) i
     Zadarskoj (116/117), a u Đakovačko-osječkoj 94 od 108 e-mailova su besplatni ili ISP.
     Telefon daju svi obrađeni adresari. Revizija: biskupija pristane slati pozivnice
     (odluka 202) ili pilot pokaže da administrator ne stiže.
201. **Uloge po župi: jedan župnik, više urednika.** Župnik odobrava urednike svoje župe
     (pozivnica ili zahtjev). Novi zahtjev za župu s potvrđenim župnikom ide njemu, a
     administratoru tek nakon 14 dana bez odgovora ili kad podnositelj tvrdi da je novi
     župnik. Istodobni prvi zahtjevi rješavaju se pozivom na broj iz adresara. Svaka
     promjena uloge ide u dnevnik. Objavljeni brojevi ostaju kad se župnik promijeni.
     Revizija: pilot.
202. **Pozivnica od biskupije je kasnija nadogradnja, ne preduvjet.** Shema mora
     dopuštati ulogu „biskupija” koja poziva župnike, ali se ona ne gradi dok neka
     biskupija ne pristane. Vrata: kontakt s biskupijom (korisnik).
203. **Odluka 102 se potvrđuje i pooštrava: osobni podaci nikad na webu, u javnom PDF-u
     ni u API-ju** dok korisnik ne odluči na temelju odgovora HBK-a ili biskupije. Nema
     prekidača „objavi i ovo” po sekciji. Razlog: HBK pravilo prema čl. 91 GDPR-a,
     biskupijske smjernice i AZOP mišljenje o listićima nisu nađeni. Crkvena pravila u
     DE i AT za internet traže privolu. Revizija: odgovor HBK-a ili biskupije.
204. **Dva PDF-a: tiskani (cijeli, samo za prijavljenog urednika) i javni (bez
     osjetljivih sekcija).** Osjetljive su: nakane, sakramenti, ženidbeni navještaji,
     darovatelji s imenom ili iznosom, pokojnici tjedna i skupine s imenima. Na mjestu
     nakane javno piše najviše „s nakanom”. Tiskani PDF se ne sprema javno (R2 putanja
     bez javnog URL-a ili generiranje na zahtjev). Revizija: odluka 203.
205. **Liturgija: odluka 105 vrijedi, uz poveznicu.** Kalendar se računa romcalom (MIT,
     ima `countries/croatia`) s vlastitim hrvatskim nazivima. Uz navod čitanja ide
     poveznica na hilp.hr/liturgija-dana ili biblija.ks.hr. Puni tekst unosi urednik.
     Razlog: uvjeti biblija.ks.hr zabranjuju objavu dijelova u aplikacijama bez pisanog
     odobrenja, a nositelj prava na lekcionar nije nađen. Revizija: pisano odobrenje
     KS-a ili HILP-a.
206. **Kontakti iz adresara se ne scrapaju skupno i ne spremaju kao imenik.** Sprema se
     samo zapis provjere (kanal, URL izvora, datum, administrator), a kontakt župe
     tek kad ga urednik sam unese u profil. Telefon i web iz crkve.domovina.ai (Google
     Places) se ne koriste ni za provjeru. Revizija: biskupija ponudi službeni izvoz.
207. **Suradnja s postojećim servisima nakon pilota.** sveta-misa.org (izvoz rasporeda),
     e-zupe.com (widget/JSON), otvorena shema i iCal za ostale. Prije pilota nema
     vanjskih kontakata. Revizija: korisnik odluči drukčije.

## Odgovori korisnika na pitanja R2 (2026-11-20, početak S1)

Pitanja s vrha `S1.md`; odgovori u S1 sesiji.

- **200 potvrđena** (bez „(!)”): model identiteta prihvaćen, vrata prije S4 otvorena.
- **Administrator** (tko provjerava, s kojeg e-maila i broja): još nije određen. Treba prije S4.
  *Dopuna 2026-11-20 (kraj S2):* administrator je vlasnik projekta. Adresa se zadaje
  konfiguracijom `ADMIN_EMAILS` (lokalno `.dev.vars`, u S9 Cloudflare secret), nikad u
  javnom repou; broj se ne sprema, telefonske provjere radi sa svog telefona.
- **203:** tko piše HBK-u ili biskupiji o osobnim podacima, i kada: još nije određeno.
  Do tada 203 vrijedi kako je: osobni podaci nikad na web.
- **205 potvrđena:** upit KS-u i HILP-u ne sada; navod + poveznica.
- **Domena:** `listici.domovina.ai` (za S9).
- **Pilot (S10):** korisnik ima župnika na umu; odluka kasnije.
- **207 potvrđena:** sveta-misa.org i e-zupe.com tek nakon pilota.

## S1: kostur i uvoz župa (2026-11-20)

300. **Kostur po omm, uz tri razlike.** `workers_dev: true` i bez `routes` (domena je S9);
     `session: false` i `imageService: "passthrough"` u `astro.config.mjs`, jer bi adapter
     inače dodao vezove `SESSION` (KV) i `IMAGES` i pri deployu ih sam stvorio, a ništa ih
     ne koristi; TypeScript 6 umjesto 7 iz omm-a, jer `@astrojs/check` 0.9.12 traži
     `typescript ^5 || ^6`. Revizija: `@astrojs/check` podrži TS 7.
301. **Privremeni `database_id` `00000000-0000-0000-0000-000000000000`.** D1 na računu ne
     postoji; S1 radi samo `--local`. S9 ga zamjenjuje ID-om iz `wrangler d1 create`.
302. **Crkve u tablici `crkve_izvor`, ne u JSON stupcu.** Raspored misa veže misu uz crkvu
     (odluka 104), pa crkva treba ključ (slug crkve iz crkve.domovina.ai). Pri promjeni
     župe njene crkve se brišu i upisuju ponovo; `INSERT OR REPLACE` premješta crkvu koja
     prijeđe u drugu župu. Revizija: crkve promijeni slugove crkava.
303. **Polja po popisu dopuštenih, ne po popisu zabranjenih** (`src/lib/zupa-izvor.ts`).
     Ne preuzimaju se `phone`, `website`, `email`, `google_maps_uri`, `source` ni ijedno
     novo polje dok ga netko ne doda. Koordinate župe samo kad je `geocode_source` u
     {`church`, `naselje-centroid`, `nominatim`, `dgu`}; `places` i nepoznat izvor → NULL.
     Koordinate crkava se preuzimaju: u crkve su iz OSM-a/Wikidate, a Places ih samo
     potvrđuje (`geo_verified`, ne izvozi se; crkve `scripts/13_places_parishes.py`).
     Revizija: crkve uvede novi izvor koordinata.
304. **Promjena = hash, nestanak = indeks, preimenovanje = OIB pa SBT_ID.** `izvor_hash` je
     SHA-256 preuzetih polja i crkava, pa promjena telefona u crkve nije promjena ovdje.
     Slug koji nije u indeksu dobiva `nestalo_u` (red ostaje); neuspio dohvat detalja nije
     nestanak. Novi slug s istim OIB-om, a bez OIB-a s istim `registry_id`, upisuje se u
     `zupe.novi_slug` i `zupe_preimenovanja`, a `/zupa/<stari>` vraća 301 na novi. Slug
     koji se vrati briše `nestalo_u`. Uvoz staje ako indeks ima manje od 50 % aktivnih
     župa. Revizija: crkve uvede vlastitu tablicu preimenovanja.
305. **Testovi nad `node:sqlite`, ne `@cloudflare/vitest-pool-workers` ni better-sqlite3.**
     Ugrađen je u Node 24, nema nativnog builda ni workerd-a, a izvršava iste
     `migrations/*.sql`; logika prima sučelje `Baza` (podskup D1, `src/lib/baza.ts`).
     Revizija: kad treba testirati same rute Workera.
306. **Uvoz je skripta (`npm run uvoz:zupe` = `node scripts/uvoz-zupa.ts`) nad lokalnom D1
     preko `getPlatformProxy`**, s paralelom 4 i tri pokušaja po URL-u. Isti
     `uveziZupe()` kasnije zove `scheduled` kad baza bude na računu (S9). Prvi stvarni
     uvoz 2026-11-20 (indeks u 18:54 UTC: `count` 2358, `kind == "zupa"` 1561, naredba
     `curl -s https://crkve.domovina.ai/data/zupe-index.json | python3 …`):
     - 1. uvoz: 1561 novih, 0 grešaka, 32,5 s; 2. uvoz: 0 promjena, 11,0 s.
     - `npx wrangler d1 execute listici-domovina-ai --local --command "SELECT count(*) FROM zupe"`
       → 1561; `crkve_izvor` 2780; bez OIB-a 626.
     - `geocode_source`: `church` 1078 (s koordinatom), `places` 456 (lat/lng NULL),
       `naselje-centroid` 26, bez izvora 1 (NULL).
     - `SELECT count(*) FROM pragma_table_info('zupe') WHERE name LIKE '%phone%' OR … '%web%'
       OR … '%mail%' OR … '%google%'` → 0; nijedan tekstni stupac `zupe`/`crkve_izvor` ne
       sadrži `http` → 0.
307. **Pretraga: stupac `trazi` (naziv, titular, mjesto; mala slova bez dijakritika) i
     `LIKE` po riječima.** Dovoljno za 1561 redak. Revizija: FTS5 kad pretraga dobije
     listiće ili crkve.

## S2: model listića i rasporeda (2026-11-20)

Kod: `migrations/0002_listici.sql`, `src/lib/{raspored-shema,listic-shema,tjedne-mise,sati,listici,javni-raspored,datum}.ts`.
Obrazac nije imao JSON primjer; izmišljen primjer je dodan u
`docs/research/2026-11-20-obrazac-listica.md` (`### Primjer`), a test ga čita iz markdowna.

400. **`listic_crkve.crkva_izvor_slug` je meka veza, bez REFERENCES.** Uvoz briše i
     ponovo upisuje crkve promijenjene župe (302), pa bi strani ključ zaustavio uvoz ili
     uz SET NULL gubio vezu. Postojanje crkve i njena župa provjeravaju se pri spremanju.
     Revizija: crkve uvede stabilne slugove crkava ili tablicu preimenovanja.
401. **Nakane su u zasebnoj tablici `mise_nakane` (ON DELETE CASCADE), a `objava =
     'papir_i_web'` odbijaju zod (poruka navodi 203) i CHECK u bazi.** Javni modul
     `javni-raspored.ts` ne spominje nakane; test to provjerava nad rezultatom, izvršenim
     SQL-om i izvornim kodom. Revizija: odluka 203.
402. **Uvijek osjetljive sekcije: `sakramenti` (uključuje ženidbene navještaje) i
     `pokojnici`**, provjera u zodu i CHECK-om u bazi. Darove i zajednice osjetljivima
     označava urednik kad nose imena ili iznose. Kanonski popis: 16 tipova iz tablice
     sekcija obrasca. Revizija: S5/S6, treba li zaseban tip za navještaje.
403. **Validacija: zod 4 sa `strictObject`** (nepoznato polje je greška, da se tipfeler ne
     izgubi tiho). Vjerno JSON shemi, uz dodatke: `ostali_termini.sat` HH:MM, ista misa
     (datum, sat, crkva) samo jednom, `crkve[].zupa_slug` mora biti glavna ili dodatna
     župa, `do_sata` nakon `sat`, mise unutar razdoblja. Revizija: objava sheme vanjskim
     servisima (207).
404. **Granice sezona (zimsko/ljetno) su u profilu listića (`listici.sezone`).** Pravilo
     sa sezonom bez granica je greška u generatoru i pri spremanju; javni upit ga
     preskače. Revizija: izvoz za vanjske servise (207).
405. **Generator tjednih misa:** blagdan (`jeBlagdan`, iz S3) zamjenjuje redovni dan za
     crkve s blagdanskim pravilom; bez `jeBlagdan` blagdanska pravila ne daju misu;
     `tjedni_u_mjesecu` samo za dane u tjednu; isti dan, sat i crkva daju jednu misu.
     Razlika stvarno ↔ stalno: premještaj je isti dan i sat u drugoj crkvi ili ista crkva
     i dan s najbližim satom; premještaj na drugi dan je izostavljena + dodana; kao
     promjena se prate vrsta i jezik, ne napomena. Revizija: S5, nakon sučelja za unos.
406. **Normalizacija sati:** tekst bez broja → `[]`; nemoguć sat (`25:00`, `8:75`, `830`)
     baca `NeispravanSat`; redni broj (`3.`) se preskače. Tiho ispuštanje bi izgubilo
     misu. Revizija: uvoz iz slobodnog teksta.
407. **Javni raspored:** samo listići s bar jednim objavljenim brojem; mise po crkvama
     župe (`listic_crkve.zupa_slug`); dani pod objavljenim brojem s tjednim misama →
     te mise (`potvrdeno: true`), ostali dani i broj „samo stalni raspored” → izračun iz
     stalnog (`potvrdeno: false`); nacrti nikad; upit najviše 92 dana; objavljeni brojevi
     istog listića se ne preklapaju. Revizija: S6/S8.
408. **Objava broja (106) traži stalni raspored ili tjedne mise te telefon ili e-mail u
     profilu.** Broj bez misa (oblik 5) smije biti nacrt. Revizija: pilot.
409. **Spremanje broja je jedan D1 batch** (retci kao JSON kroz `json_each`, ~17 naredbi
     neovisno o broju misa); ponovno spremanje zamjenjuje broj; crkva koja nestane iz
     dokumenta briše se samo ako je ništa ne koristi. Stupci razdoblja su `datum_od` i
     `datum_do` (`do` je ključna riječ SQL-a). Revizija: S9, ograničenja D1 na računu.

Otvoreno iz S2: napomena mise je javna (103), pa uređivač (S6) mora upozoriti na ime u
njoj; ostali termini i stalni blokovi još nisu u javnom upitu (S8); nestanak crkve iz
izvora ili `novi_slug` župe dok je listić na starom se ne prati; dva listića za istu
župu se u javnom upitu samo zbroje; rotacija „svake druge nedjelje” se ne modelira.

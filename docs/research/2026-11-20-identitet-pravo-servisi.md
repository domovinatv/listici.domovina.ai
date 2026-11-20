# Identitet urednika, osobni podaci, liturgija, postojeći servisi (R2)

Sesija R2, 2026-11-20. Pitanja iz `docs/handoffs/R2.md`: kako dokazati da osoba smije
objavljivati za župu, što se smije objaviti na webu, smije li se preuzimati liturgijski
tekst i tko već radi nešto slično. Odluke: blok 200 u `docs/decisions.md`.

## Pitanja za korisnika (odlučuje korisnik, ne sesija)

1. **Model identiteta.** Preporuka (odluka 200): urednik podnese zahtjev za župu, a
   administrator ga potvrdi preko **službenog kontakta župe iz biskupijskog adresara**.
   To je kod na e-mail župe iz adresara ili poziv na broj iz adresara. Dodatne urednike
   poziva potvrđeni župnik. Pozivnica od biskupije dolazi kasnije, kad biskupija pristane.
   Prihvaćaš li ovaj model za pilot?
2. **Tko je administrator** koji obavlja provjere (poziv na broj iz adresara traje
   nekoliko minuta po župi) i s kojeg e-maila ili broja se javlja?
3. **Kontakt s HBK-om ili biskupijom o osobnim podacima** (pitanja u § 2.4): tko piše i
   kada? Dok nema odgovora, osobni podaci se ne objavljuju na webu (odluka 203).
   Planu to ne smeta: plan radi i bez odgovora.
4. **Pisani upit Kršćanskoj sadašnjosti i HILP-u** za puni tekst evanđelja: šaljemo li ga?
   Bez dozvole aplikacija daje navod i poveznicu (odluka 205).
5. **Domena:** `listici.domovina.ai`, ili drugo ime? Odlučuje se tek pred produkcijski
   deploy (S9).
6. **Prvi župnik za pilot:** poznaješ li nekoga? Najlakše je u Varaždinskoj ili Zadarskoj
   biskupiji, gdje gotovo sve župe imaju e-mail na domeni biskupije (§ 1.2).
7. **Suradnja sa sveta-misa.org i e-zupe.com** (§ 4.3): javiti se sada ili nakon pilota?
   Preporuka: nakon pilota, kad postoji raspored koji se može ponuditi.

## Metoda

Tri istraživačka agenta (Sonnet 5.5, `effort` medium), 2026-11-20, WebSearch, WebFetch i
Firecrawl. Ukupno 119 alatnih poziva. Sirove bilješke su u scratchpadu sesije i nisu
sačuvane. Svaki izvor ispod ima URL, a datum dohvata svih je 2026-11-20. Citati su
doslovni tamo gdje su pod navodnicima. Gdje je agent imao samo sažetak alata, to piše.
Domene listića izbrojane su lokalno iz `data/uzorci/index.csv` (`python3`, hostname
stupca `url`).

## 1. Identitet urednika

### 1.1 Gdje župe danas objavljuju (zbirka R1, 43 župe)

| Gdje je listić | Župa |
|---|---:|
| vlastita domena župe | 27 |
| poddomena biskupije (`*.djos.hr`) | 2 |
| stranica reda (ofm.hr, franjevci-split.hr) | 5 |
| e-zupe.com | 4 |
| ostalo (Google Drive, wordpress.com, općina, site123 CDN) | 5 |

Uzorak je pristran prema župama s webom. Za Slavonski Brod, Požegu, Novu Gradišku, Lipik,
Supetar i Nin nađen je samo Facebook (R1). Domena weba ne znači ni da župa ima e-mail na
toj domeni.

### 1.2 Službeni kontakti u biskupijskim adresarima

Brojeni su cijeli popisi s weba biskupija, a ne uzorak. Za svaku župu uzet je prvi e-mail
iz bloka župe. U stupcu „besplatni/ISP” su gmail, yahoo, hotmail, net.hr, inet.hr i
t-com.hr. Osobni podaci nisu prepisani.

| Biskupija | Adresar | Telefon | Župa | s e-mailom | na domeni biskupije | vlastita domena | besplatni/ISP |
|---|---|---|---:|---:|---:|---:|---:|
| Varaždinska | biskupija-varazdinska.hr/adresar/biskupijski-adresar/zupe-41431/41431 | da | 72 | 72 | 70 | 1 | 1 |
| Zadarska | zadarskanadbiskupija.hr/adresar/ | da | 117 | 117 | 116 | 0 | 1 |
| Đakovačko-osječka | djos.hr/popis-zupa/ | 150/152 | 152 | 108 | 6 | 8 | 94 |
| Šibenska | sibenska-biskupija.hr/adresar/ | 72/73 | 73 | 46 | 0 | 2 | 44 |
| Porečko-pulska | biskupija-porecko-pulska.hr/adresar-i-kontakti/ | da | 102 (svećenika, ne župa) | 102 | 12 | 19 | 71 |

Gospićko-senjska ima adresar s telefonima i e-mailom na podstranicama, ali nije prebrojana.
Zagrebačka (`zg-nadbiskupija.hr/zupe`) i Riječka (`ri-nadbiskupija.hr/zupe`) imaju popis
župa, ali u izvučenom tekstu nema e-mailova. Kod Splitsko-makarske (`smn.hr/14-zupe`)
dohvat nije prošao. Ostale biskupije i Križevačka eparhija nisu obrađene.

**Nalaz:** svi obrađeni adresari daju telefon župe. E-mail na domeni biskupije je
pravilo u Varaždinskoj i Zadarskoj, a iznimka drugdje. U Đakovačko-osječkoj i Šibenskoj
četvrtina do trećina župa nema nikakav e-mail. Gmail adresa ne dokazuje ništa sama po
sebi, ali **dokazuje kad je upisana u službeni adresar biskupije**: tada je to službeni
kontakt župe, bez obzira na domenu.

### 1.3 Usporedba modela

| Model | Pokriva | Trošak | Slabost |
|---|---|---|---|
| A. E-mail na domeni župe ili biskupije (automatski) | ~2 biskupije gotovo potpuno, drugdje malo | nula | isključuje većinu župa; vlastita domena ne znači da je mail župni |
| B. Kod na **e-mail iz biskupijskog adresara** (bilo koja domena) | sve župe s e-mailom u adresaru (u četiri biskupije s popisom župa 343 od 414) | administrator nađe adresu u adresaru | adresar može biti zastario; ne razlikuje župnika od tajnice |
| C. **Poziv na telefon iz adresara**, administrator pročita kod | gotovo sve župe | nekoliko minuta po župi | ručni rad; ne skalira se na stotine župa odjednom |
| D. Pozivnica od potvrđenog župnika | dodatni urednici iste župe | nula | treba prvog potvrđenog |
| E. Pozivnica od biskupije | sve župe biskupije | dogovor s biskupijom | ovisi o biskupiji; vrata |

Nijedan pronađeni servis (§ 4) ne opisuje kako provjerava urednike. Sveta-misa.org piše
samo „svaki zahtjev pregledavamo prije promjene”. Standarda koji bi trebalo preuzeti zato
nema.

**Preporuka za početak: B + C kao provjera prvog urednika, D za ostale, E kasnije.**
Detalji su u odlukama 200–202. Kontakt za provjeru uzima se **ručno iz adresara u
trenutku provjere** (administrator upiše URL adresara i datum). Adresari se ne scrapaju
skupno, a telefon iz crkve.domovina.ai (Google Places) se ne koristi.

### 1.4 Dvije osobe traže istu župu

- Župa ima najviše jednog **župnika** (uloga koja odobrava) i proizvoljno mnogo **urednika**.
- Novi zahtjev za župu koja već ima potvrđenog župnika ide **njemu** na odobrenje, ne
  administratoru. Administrator ga preuzima ako župnik ne odgovori u 14 dana ili ako
  podnositelj tvrdi da je on novi župnik (premještaji su redoviti, obično u ljeto).
- Ako dva zahtjeva za prvu potvrdu stignu istodobno, administrator **zove broj iz
  adresara** i pita župni ured tko radi listić. Telefon iz zahtjeva ne vrijedi.
- Promjena župnika ne briše stare brojeve. Stari župnik gubi ulogu, a objavljeni listići
  ostaju s njegovim imenom kao autorom.
- Svaka provjera, odobrenje i oduzimanje uloge upisuje se u dnevnik: tko, kada, kanal,
  izvor kontakta.

## 2. Osobni podaci

### 2.1 Što listići nose (R1)

Imena pokojnih u nakanama (46 sekcija; 443 od 694 mise imaju nakanu), imena živih u
nakanama i obavijestima, djeca u sakramentima i katehezi, ženidbeni navještaji s datumom
rođenja, roditeljima i adresom, darovatelji s imenom, adresom i iznosom, pokojnici tjedna,
popisi ministranata i zbora, rođendani starijih župljana.

### 2.2 Pravni okvir (izvori, bez zaključaka)

- **GDPR čl. 9 st. 2 t. (d):** vjerska neprofitna tijela smiju obrađivati posebne
  kategorije podataka o članovima i osobama u redovitom kontaktu, a podaci se **ne
  priopćavaju izvan tijela bez privole**. Ovo je parafraza agenta prema
  gdpr-text.com/hr/read/article-9/. EUR-Lex nije prošao.
- **GDPR čl. 91:** crkve koje su imale vlastita pravila smiju ih primjenjivati ako ih
  usklade s Uredbom, a nadzor može imati „posebno tijelo” (gdpr-text.com/hr/read/article-91/).
- **GDPR uvodna izjava 27:** „Ova se Uredba ne primjenjuje na osobne podatke preminulih
  osoba.” Države članice mogu urediti preminule (gdpr-text.com/hr/read/recital-27/).
- **Zakon o provedbi Opće uredbe (NN 42/2018), čl. 19:** dob od 16 godina za privolu,
  samo za usluge informacijskog društva ponuđene izravno djetetu
  (narodne-novine.nn.hr/clanci/sluzbeni/2018_05_42_805.html). Odredbe o preminulima i
  vjerskim zajednicama nisu nađene (sažetak alata, ne čitanje cijelog zakona).
- **HBK:** opće pravilo o zaštiti podataka prema čl. 91 i crkveni nadzornik **nisu
  nađeni**. Pregledani su hbk.hr, dok.hbk.hr i Službene vijesti 2019/1 i 2023/2, ali ne
  izdanja iz 2018. ni stranice nadbiskupija, pa to nije dokaz da ne postoje. Savić i
  Škvorc, *Bogoslovska smotra* 95/2025 (hrcak.srce.hr/file/477726): „Stoga bi valjalo,
  ako takva pravila već nisu izrađena, pristupiti izradi partikularnih odredaba o zaštiti
  osobnih podataka.” Pravilnik o crkvenim maticama (2001), čl. 16, uređuje uvid u matice,
  a ne objavu.
- **Biskupijske smjernice za web i Facebook župa:** nisu nađene.
- **Ženidbeni navještaji:** temelj je kan. 1067 ZKP, a HBK je donio Postupak za ženidbu
  (plenarno zasjedanje 4.–6. 4. 2000., prema Savić i Škvorc). Propis o **načinu** objave
  (oglasna ploča, misa, internet) nije nađen.
- **AZOP:** nema mišljenja o župama, listićima, nakanama ni osmrtnicama. Najbliža je
  odluka o oglasnoj ploči kluba (azop.hr/javna-objava-osobnih-podataka-ispitanika/,
  27. 5. 2025.): „Za takvu objavu/obradu osobnih podataka ne nalazi se opravdana i
  zakonita svrha, a tako niti pravna osnova.” To je udruga, ne vjerska zajednica, pa
  služi samo kao analogija.

### 2.3 Usporedba: crkvena pravila u Njemačkoj i Austriji

- **Biskupija Mainz, FAQ prema KDG-u (rujan 2022.),** bistummainz.de, Merkblatt-FAQ:
  - za internet: „Die Veröffentlichung von personenbezogenen Daten im Internet darf nicht
    ohne eine Einwilligung der betroffenen Person erfolgen.”;
  - za imena pokojnika u listiću: „Ja.”, uz uvjet „kein Rückschluss auf Lebende”, a
    obitelj se može usprotiviti.
- **Austrija:** crkveni Decretum Generale na snazi je od 25. 5. 2018., s crkvenom
  komisijom za zaštitu podataka (bischofskonferenz.at/datenschutz/rechtsgrundlagen).
  ÖBK Medienreferat (2016., prije GDPR-a): „Besonders die Veröffentlichung im Internet ist
  problematisch.” Privola ispitanika ili roditelja „macht eine Veröffentlichung in jedem
  Fall zulässig” (medien.katholisch.at/rechtliches/pfarrblatt/personendaten).

Obrazac koji se ponavlja: **papir u crkvi da, internet tek uz privolu**, a pokojnici su
blaži slučaj. Za Hrvatsku taj obrazac nema izvor. Navodi se samo kao usporedba.

### 2.4 Prijedlog: što gdje ide

| Sekcija | Tiskani PDF (samo urednik) | Javni web, javni PDF, API | Napomena |
|---|---|---|---|
| zaglavlje, kontakt župe, uredovno vrijeme, IBAN župe | da | da | institucionalni podaci |
| raspored misa: datum, sat, crkva, vrsta, jezik, napomena | da | da | odluka 103 |
| nakane uz mise | da | **ne** (piše „misa s nakanom” ili ništa) | i imena pokojnih često otkrivaju obitelj |
| obavijesti, razmatranje, događaji, kateheza | da | da | upozorenje pri unosu ako tekst sadrži ime (heuristika, ne blokada) |
| sakramenti (krštenja, prvopričest, krizma) | da | **ne** | djeca |
| ženidbeni navještaji | da | **ne** | datum rođenja, roditelji, adresa |
| darovatelji s imenom ili iznosom | da | **ne**; zbroj bez imena smije | |
| pokojnici tjedna | da | **ne** | |
| župne skupine s imenima (ministranti, zbor, čišćenje) | da | **ne** | |

Zadano je, dakle, da web i API nikad ne nose ništa što je u stupcu „ne”. **Tiskani PDF s
osjetljivim sekcijama nije javan**: preuzima ga samo prijavljeni urednik. Javni PDF je
druga datoteka, bez tih sekcija. Prekidač „objavi i ovo na webu” po sekciji ne gradi se
dok korisnik ne odluči na temelju odgovora HBK-a ili biskupije (odluka 203).

Pitanja za HBK ili biskupiju:

1. Postoji li ili se priprema HBK pravilo o zaštiti podataka prema čl. 91 GDPR-a?
   Postoji li crkveni nadzornik ili povjerenik?
2. Smije li listić s imenima (nakane, krštenici, prvopričesnici, darovatelji) biti javno
   na internetu, i uz čiju privolu?
3. Daje li privolu za djecu roditelj, i u kojem obliku?
4. Smiju li se ženidbeni navještaji objavljivati na internetu, i s kojim podacima?
5. Treba li javna inačica biti neindeksirana ili se skidati nakon nekog roka?

## 3. Liturgijski sadržaj

- **Biblija, Kršćanska sadašnjost:** prema uvjetima korištenja
  (biblija.ks.hr/uvjeti-koristenja/, ažurirano 14. 8. 2026.) KS je „nositelj isključivog
  prava iskorištavanja” izdanja iz 2015. Uvjeti kažu: „Nije dopušteno … ponovno
  objavljivati cijeli biblijski tekst ili njegove dijelove na drugim internetskim
  stranicama, u aplikacijama, publikacijama … bez prethodnog pisanog odobrenja”.
  Citiranje „u ograničenom i razumnom opsegu” dopušteno je uz navod izvora i poveznicu.
  Izričito su zabranjeni sustavno preuzimanje i scraping.
- **Lekcionar:** nositelj prava nije nađen (pregledani hbk.hr, hilp.hr i ks.hr).
  Liturgijska izdanja priprema Hrvatski institut za liturgijski pastoral (HILP, hilp.hr/o-institutu/)
  za Biskupsku komisiju HBK za liturgiju, pa je HILP vjerojatni kontakt.
  hilp.hr/liturgija-dana/ objavljuje evanđelje dana bez napomene o licenci.
- **Portali** (hkm.hr, bitno.net) imaju „Sva prava pridržana”. Nijedan otvoreni portal
  ne navodi dozvolu za čitanja.
- **Kalendar:** romcal (github.com/romcal/romcal, MIT, zadnji push 14. 11. 2026.) ima
  kalendar `countries/croatia` s 9 vlastitih slavlja, ali nema `hr` lokalizacije
  (postoje cs, de, en, es, fr, it, la, pl, pt-br, sk, ta, zh-cn). HILP izdaje tiskani
  „Liturgijski kalendar 2027.” (hilp.hr/trgovina/ostala-izdanja/liturgijski-kalendar/).
  Slobodno strojno čitljivo hrvatsko izdanje nije nađeno.
- **Navod čitanja:** u ovom paketu nije utvrđeno daje li romcal navode čitanja po danu.
  To se mjeri u S3.

**Slijedi:** odluka 105 vrijedi i dalje. Aplikacija sama računa kalendar (romcal + vlastiti
hrvatski nazivi), daje navod i **poveznicu** na hilp.hr ili biblija.ks.hr, a puni tekst unosi
urednik sam. Automatsko umetanje teksta zabranjuju uvjeti KS-a.

## 4. Postojeći servisi

### 4.1 Popis

| Servis | Zemlja | Tko | Što | Izvor podataka | Provjera urednika |
|---|---|---|---|---|---|
| [sveta-misa.org](https://sveta-misa.org) | HR, BiH | Udruga Sv. Mati Slobode, Zagreb; aplikacija WebTech | raspored misa, crkve u blizini, iOS/Android, od 2020. | župe, urednici, volonteri preko zahtjeva | „svaki zahtjev pregledavamo”, bez opisa |
| [e-zupe.com](https://www.e-zupe.com) | HR | izrada Cloud Digital, operator nije naveden | web stranice župa, prijave za sakramente, newsletter, donacije; hostira PDF listića (9 od 77 datoteka u R1) | župe | nije opisana |
| [glasila.hr](https://glasila.hr) | HR | tvrtka, Petrinja | službena glasila općina i gradova, tisak | naručitelj | n/a (nije konkurent) |
| raspored bogoslužja, [zg-nadbiskupija.hr](https://zg-nadbiskupija.hr) | HR | Zagrebačka nadbiskupija | službeni raspored | nadbiskupija | n/a; prema agentu zadnje ažuriranje 01/2022 |
| [data.zagreb.hr](https://data.zagreb.hr), „Zagrebačka nadbiskupija – teritorijalna struktura” | HR | Grad Zagreb | otvoreni podaci: župe, dekanati, adrese, bez misa | nadbiskupija | n/a |
| [DinDonDan](https://dindondan.app) | IT, 56 zemalja | udruga | mise i ispovijedi u blizini | korisnici prijavljuju izmjene s fotografijom | nije opisana |
| [MassTimes.org](https://masstimes.org) | SAD, globalno | Mass Times Trust | pretraga misa, aplikacija | nije navedeno | nije navedeno |
| 1000 Kirchen | AT | Nadbiskupija Beč i Fluxguide | mise u sljedećem satu, 1.400+ crkava | župe same unose | kontrolu radi župa |
| ChurchDesk (Biskupija Mainz) | DE | biskupija | središnji unos bogoslužja, izvoz u više formata | župe | interno |
| [Pfarrbriefservice.de](https://pfarrbriefservice.de) | DE | nije utvrđeno (403) | materijali za župni list (tekstovi, slike) | n/a | n/a |

Župna aplikacija Supetar iz R1 nije nađena ni na naslovnici hvarskabiskupija.hr ni u
pretrazi. Na naslovnici e-zupe.com vidi se „Župni Newsletter”, ali ne i modul „Župni
listić”, iako R1 ima listiće na `e-zupe.com/zupni-dokumenti/`. Za Sloveniju, BiH (osim
sveta-misa.org), Srbiju i alate za izradu listića nije nađen nijedan pogodak, što znači
samo da u ~35 poziva ništa nije nađeno.

### 4.2 Po čemu se ovo razlikuje

Svi pronađeni servisi rasporeda misa održavaju raspored **odvojeno** od posla župe:
volonteri, zahtjevi, fotografije. Zato raspored zastarijeva (zagrebački primjer iz 2022.).
Ovdje raspored nastaje iz listića koji župnik ionako piše svaki tjedan. Usto ovdje postoje
PDF za tisak, otvoreni API i MIT kod, a nijedan pronađeni servis ne navodi API ni licencu
podataka. Glavni „konkurent” ostaje Word (27 od 63 listića u R1).

### 4.3 Prilike za suradnju (nakon pilota)

1. **sveta-misa.org:** izvoz tjednog rasporeda župa koje rade listić ovdje, da župe ne
   vode dva izvora. Zauzvrat njihov popis crkava za usklađivanje s crkve.domovina.ai.
2. **e-zupe.com:** widget ili JSON s rasporedom i zadnjim listićem za stranice župa koje
   već imaju. Prvo provjeriti što e-zupe danas nudi kao „župni listić”.
3. **Otvorena shema rasporeda** (JSON iz R1, iCal), koju mogu preuzeti DinDonDan i slični.
4. **Biskupije:** Mainz i Beč pokazuju da biskupije žele središnji unos s izvozom.
   Pozivnica od biskupije (model E) i biskupijski izvoz idu zajedno.

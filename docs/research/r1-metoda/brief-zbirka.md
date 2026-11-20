# Zadatak: zbirka župnih listića (R1, listici.domovina.ai)

Repo: /Users/ms/git/domovinatv/listici.domovina.ai. Sve što preuzmeš je GITIGNORANO
(`data/uzorci/`, `data/raw/`). NE commitaj ništa, ne diraj git.

## Cilj
Prikupi stvarne, javno objavljene **župne listiće** (tjedni/mjesečni list župe s
rasporedom misa, obavijestima…) za biskupije svoje grupe, prema kvoti u promptu.

## Ulazi
- `data/raw/zupe-index.json` — `{count, items}`; župe su `kind == "zupa"`, polja
  `slug, name, city, diocese, church_count`. Koristi ga **samo** za slug, biskupiju i
  broj crkava. Grep: `python3 -c` ili `jq`. NE koristi telefon/web iz crkve izvora.
- `data/raw/seeds.tsv` — rezultati pretraga (kod, URL, naslov). Biskupija nije
  označena; odredi je po mjestu (provjeri u zupe-index.json).
- Župe iz **Bosne i Hercegovine** (Mostar, Banja Luka/Petrićevac, Goričani-Sovići,
  Domanovići, Kruševo, Široki…) i nekatoličke NE ulaze u uzorak.

## Pravila dohvaćanja
- Prvo `curl -sL -A "Mozilla/5.0" --max-time 60`. Stranice „župni listić” čitaj
  curlom i grep/sed na linkove `.pdf`/slike; ne ispisuj cijeli HTML u kontekst.
- Firecrawl (`firecrawl scrape <url> --format markdown` ili `firecrawl search`) samo
  kad curl ne ide, **najviše 12 poziva ukupno**, između poziva `sleep 7` (račun je
  ograničen, 429). WebSearch smiješ za traženje weba pojedine župe.
- **Bez preglednika.** Facebook/Instagram objave samo ako slika listića ide curlom s
  javnog URL-a; inače uzmi drugu župu. Nikamo se ne prijavljuj.
- Preferiraj **najnovije** brojeve (2025–2026). Ako je samo stari arhiv, smije, ali označi.
- Listić koji je samo HTML stranica (npr. objava „Župne obavijesti” na webu) spremi kao
  `.html` (curl), to je također valjan format i bitan nalaz.

## Raspored datoteka
`data/uzorci/<biskupija-slug>/<slug-zupe>/<YYYY-MM-DD>.<ext>` gdje je datum = datum
listića (nedjelja/početak razdoblja); ako ga ne znaš, datum dohvata + `-x`.
`<biskupija-slug>`: zagrebacka, varazdinska, sisacka, bjelovarsko-krizevacka,
krizevacka-eparhija, gospicko-senjska, djakovacko-osjecka, pozeska, rijecka, krk,
porecko-pulska, splitsko-makarska, zadarska, sibenska, dubrovacka, hvarska.
Ako župu ne nađeš u zupe-index.json, slug = `nepoznato-<kratko-ime>` i napiši zašto.

Provjeri svaki PDF: `pdfinfo` (stranice, veličina stranice u pts → A4 595x842, A5 420x595)
i `pdftotext -l 1 file - | head -20` da je to stvarno župni listić. Ako nije, obriši.

## Izlaz
1. `data/uzorci/index-<GRUPA>.csv` s headerom:
   `datoteka,url,datum_dohvata,biskupija,slug_zupe,naziv_zupe,mjesto,grad_selo,izvor,format,stranice,velicina_str,datum_listica,serija,napomena`
   - `grad_selo`: grad (>20k stan. ili sjedište biskupije) / gradić / selo
   - `izvor`: web-zupe | web-biskupije | e-zupe | issuu | facebook | instagram | ostalo
   - `format`: pdf | jpg | png | html; `velicina_str`: A4/A5/drugo/—
   - `serija`: id serije ako je to jedan od uzastopnih brojeva iste župe, inače prazno
   - CSV ispravno quotaj (python csv modul).
2. `data/uzorci/biljeske-<GRUPA>.md`: kratko (≤40 redaka) — koje župe si probao a nisu
   imale listić online, koje platforme/alate su koristile (e-zupe.com, WordPress,
   heyzine, Issuu, sveta-misa.org, glasila…), i bilo što neobično. Bez osobnih podataka.

## Završni izvještaj (vraćaš meni)
≤15 redaka: broj listića po biskupiji, broj serija, broj datoteka po formatu, problemi.
Ne prepisuj sadržaj listića.

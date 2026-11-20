# Zadatak: analiza župnih listića (R1, listici.domovina.ai)

Repo: /Users/ms/git/domovinatv/listici.domovina.ai. Ulaz i izlaz su GITIGNORANI
(`data/uzorci/`). NE commitaj, ne diraj git.

Dobivaš popis datoteka (putanje relativne na repo). Za svaku napiši **jedan JSON red**
u `data/uzorci/analiza-<GRUPA>.jsonl` (append, `python3` + `json.dumps(..., ensure_ascii=False)`).

## Kako čitati
- PDF: `pdftotext -layout <f> -` (cijeli tekst je obično 1–4 stranice; ako je >400
  redaka, čitaj po stranicama `-f N -l N`). `pdfinfo` za stranice i veličinu.
  Ako PDF nema teksta (sken), pretvori prvu i drugu stranicu u PNG
  (`pdftoppm -r 80 -png -f 1 -l 2 <f> /tmp/...` — koristi svoj scratchpad) i pogledaj Read alatom.
- Slike (jpg/png): Read alatom.
- HTML: `python3 -c` s html.parser ili `sed 's/<[^>]*>//g'` pa samo glavni sadržaj.
- Raspored stranica (presavijanje, stupci) procijeni iz `-layout` teksta ili PNG-a
  prve stranice (`pdftoppm -r 40`), ne za svaki listić, nego kad nije jasno.

## Shema retka
```json
{
  "datoteka": "data/uzorci/.../2026-11-15.pdf",
  "slug_zupe": "...", "biskupija": "...",
  "naslov_lista": "npr. Župni listić / Zvono / Sv. Mihovil",
  "broj_godiste": "npr. br. 42, god. XVIII" ,
  "razdoblje": {"od": "YYYY-MM-DD", "do": "YYYY-MM-DD"},
  "ucestalost": "tjedni|dvotjedni|mjesecni|blagdanski|nepoznato",
  "format": {"medij": "pdf|slika|html", "stranice": 2, "velicina": "A4|A5|drugo",
             "presavijen": "da|ne|nepoznato", "stupci": 1},
  "alat": "Word|Publisher|InDesign|Canva|e-zupe|WordPress|nepoznato (+ kako zaključeno: pdfinfo Creator/Producer)",
  "sekcije": [
    {"tip": "<jedan od TIPOVA>", "naslov": "doslovni naslov sekcije", "udio_prostora": 0.25,
     "osobni_podaci": "ne|imena_pokojnih|imena_zivih|djeca|ostalo",
     "napomena": ""}
  ],
  "liturgija": {"citanja_navod": true, "citanja_puni_tekst": false, "evandjelje_puni_tekst": true,
                "razmatranje": true, "svetac_dana": false, "liturgijska_boja_ili_tjedan": true,
                "izvor_navedeni": "npr. HBK lekcionar / Glas Koncila / bez navoda"},
  "crkve": [{"naziv": "crkva sv. X", "mjesto": "Y", "uloga": "zupna|filijala|kapela|ostalo"}],
  "mise": [
    {"datum": "YYYY-MM-DD ili null", "dan": "pon..ned", "sat": "HH:MM",
     "crkva": "naziv iz popisa crkve", "vrsta": "redovna|nedjeljna|blagdanska|zornica|sprovodna|vjencana|klanjanje|ispovijed|krunica|ostalo",
     "jezik": "hr ili drugi", "intencija_navedena": true, "napomena": ""}
  ],
  "redovni_raspored_naveden": true,
  "redovni_raspored": "doslovni kratki opis ako listić ima stalni raspored (npr. 'radnim danom 18h, nedjeljom 8, 10, 18h'), inače null",
  "iznimke": ["kratki opis svake iznimke od redovnog: promjena sata, ukinuta misa, dodatna misa…"],
  "kontakt_uredovno": {"uredovno_vrijeme": true, "telefon": true, "email": true, "web": true, "iban": false},
  "zapazanja": "≤3 rečenice: što je posebno, što bi obrazac morao podržati"
}
```
**Osobni podaci**: u `mise` NE upisuj imena iz intencija; samo `intencija_navedena: true`.
U `sekcije.napomena` nikad imena osoba (osim sveca/pape/biskupa po funkciji).
Ako listić ima više od 40 misa, upiši sve (to je bitna brojka), ali bez intencija.

## TIPOVI sekcija (kanonski, koristi točno ove)
zaglavlje, liturgijski_kalendar, citanja, evandjelje, razmatranje, svetac,
raspored_misa, intencije, obavijesti, sakramenti (krštenja/vjenčanja/prvopričest/krizma),
pokojnici, kateheza_vjeronauk, zupna_zajednica_grupe (zbor, mladi, Caritas…),
dogadjaji_najave, molitva, papa_crkva_vijesti, biskupija_vijesti, darovi_financije,
kontakt_uredovno, ispovijed_klanjanje, humor_zanimljivosti, djeca, oglasi_sponzori,
ostalo (u `naslov` napiši što je).

## Na kraju
Vrati ≤12 redaka: koliko je redaka zapisano, koje datoteke nisu čitljive i zašto,
3 najvažnija zapažanja za obrazac. Ne prepisuj sadržaj listića.

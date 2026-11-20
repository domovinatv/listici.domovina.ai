# Polazište: listici.domovina.ai

Zapisano 2026-11-20 u sesiji u `crkve.domovina.ai`, prije nego je ovaj repo imao
ijedan red koda. Ovo je **baza znanja za istraživanje i `/todo-plan`**, ne plan.

## Ideja

1. **Župnik** složi župni listić u obrascu (ne u Wordu), preuzme PDF za tisak i jednim
   klikom ga objavi. Besplatno, bez instalacije.
2. **Župljanin** na jednom mjestu ima listiće svoje župe (web, po želji pretplata).
3. **Putnik** u bilo kojem mjestu vidi raspored misa obližnjih župa.

Ključ vrijednosti: listić je danas PDF ili slika na Facebooku i web stranici župe, pa
raspored misa **nije strojno čitljiv**. Ako obrazac ima strukturirana polja (misa:
dan, sat, crkva, napomena), raspored za cijelu Hrvatsku nastaje kao nusproizvod
posla koji župnik ionako radi svaki tjedan.

## Korisnici i uloge (prijedlog, potvrditi istraživanjem)

| Uloga | Što radi | Prijava |
|---|---|---|
| urednik župe | piše i objavljuje listić | da, vezan na župu |
| župnik | odobrava urednike svoje župe | da |
| čitatelj | čita, traži, pretplaćuje se | ne |
| administrator | rješava sporove „tko smije uređivati župu X” | da |

## Što je odlučeno

1. **Zaseban repo** `listici.domovina.ai`, MIT, javan; povezan s crkve preko sluga
   župe, ne zajedničkom bazom.
2. **Stack:** Astro SSR na Cloudflare Workeru + D1 (predložak `../omm.domovina.ai`).
3. **Župe se ne unose ručno**: uvoze se iz crkve.domovina.ai (vidi CLAUDE.md, ugovor).
4. **PDF i web iz istog izvora**: listić je strukturirani dokument; PDF i HTML su dva
   prikaza. (Kako se PDF radi, Browser Rendering ili u pregledniku, odlučuje plan.)
5. **Prvo istraživanje, onda plan.** Obrazac se standardizira na temelju stvarnih
   listića, ne pretpostavke.

## Otvorena pitanja (istraživanje ih mora zatvoriti ili pretvoriti u odluke)

**Sadržaj listića** (R1)
- Koje sekcije listići imaju i koliko često (raspored misa, liturgijski kalendar i
  čitanja, evanđelje/razmatranje, obavijesti, intencije, sakramenti i sprovodi,
  kateheza, kontakt, uredovno vrijeme, oglasi)? Što je zajedničko većini?
- Format: A4/A5, presavijeni, jedna ili dvije stranice; tjedni, dvotjedni, mjesečni.
- Raspored misa: koliko je pravilan (tjedni obrazac + iznimke) i koliko se mijenja
  po crkvama i filijalama iste župe. To je srce strukturiranog modela.
- Liturgijski sadržaj (čitanja, svetac dana): smije li se automatski ubaciti i iz
  kojeg izvora, i pod kojom licencom (tekst Biblije i lekcionara ima nositelja prava)?

**Identitet i povjerenje** (R2) — najrizičnija točka projekta
- Kako znati da osoba stvarno smije objavljivati za župu X? Kandidati: e-mail na
  domeni biskupije/župe, potvrda od biskupije, pozivnica od već potvrđenog župnika,
  ručna provjera. Sva rješenja imaju trošak; lažni listić s krivim rasporedom misa je
  stvarna šteta.
- Tko je kontakt u biskupijama (16 biskupija i eparhija), i postoje li već službeni
  kanali ili aplikacije s kojima bi ovo bilo u sukobu ili koje bi ovo mogle hraniti.

**Pravno** (R2)
- Osobni podaci u listiću (imena u intencijama, krštenja, vjenčanja, sprovodi):
  objavljuju se na webu, a ovdje bi bili i indeksirani. Što je dopušteno, što treba
  privolu, i treba li web inačica skrivati dio koji papir ima?
- Autorska prava na tuđe listiće pri istraživanju (zato `data/uzorci/` nije u gitu).

**Postojeće stanje** (R2)
- Postoje li već servisi rasporeda misa ili alati za listiće u HR i susjedstvu? Popis
  ne postoji; napraviti ga i zapisati po čemu se ovo razlikuje.

## Što ne raditi na početku
- Mobilne aplikacije, push, plaćanja, oglasi, više jezika.
- Automatsko „čitanje” tuđih PDF listića u produkciji (scraping kao izvor podataka).
  Istraživanje smije čitati uzorke; aplikacija prikazuje samo ono što je urednik unio.

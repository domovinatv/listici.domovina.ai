# TODO — listici.domovina.ai

Radna lista. Čuva se u repou da napredak preživi između sesija. Označene stavke su gotove
i provjerene (`npm run check` zelen). Odluke idu u [docs/decisions.md](docs/decisions.md).

Plan po sesijama: [docs/plan.md](docs/plan.md). Handoff po sesiji: [docs/handoffs/](docs/handoffs/).

Legenda: `[x]` gotovo · `[ ]` otvoreno · `[~]` u radu · `(!)` traži korisnika · `→ Sn` planirana sesija

## Istraživanje

- [x] R1: kako listići izgledaju, prijedlog obrasca (odluke 100–107)
- [x] R2: identitet, osobni podaci, liturgija, postojeći servisi (odluke 200–207)

## Odluke korisnika (pitanja: vrh `docs/handoffs/S1.md`)

- [ ] (!) model identiteta (odluka 200) i tko je administrator — prije S4
- [ ] (!) kontakt s HBK-om ili biskupijom o osobnim podacima (odluka 203)
- [ ] (!) upit KS-u i HILP-u za puni tekst evanđelja (odluka 205)
- [ ] (!) ime domene — prije S9
- [ ] (!) prvi župnik za pilot — prije S10
- [ ] (!) suradnja sa sveta-misa.org i e-zupe.com — nakon pilota (odluka 207)

## F0 — temelj (ništa javno)

- [ ] kostur Astro 7 + `@astrojs/cloudflare` + D1 po `../omm.domovina.ai`, `workers_dev: true`, bez `routes` → S1
- [ ] `npm run check` = astro check + vitest, testovi bez mreže → S1
- [ ] migracija `zupe` (slug, OIB, SBT_ID, naziv, biskupija, mjesto, koordinate iz crkve osim Google Placesa) → S1
- [ ] uvoz iz `zupe-index.json` + `zupa/<slug>.json`, idempotentan, bilježi promijenjene i nestale slugove → S1
- [ ] prijaviti crkve lancu: Vugrovec, Vinjani, Vidici nisu u indeksu; slug Starog Pazina i Duge Rese → S1
- [ ] migracije profila župe, crkava, stalnog rasporeda, broja, sekcija, misa → S2
- [ ] validacija po JSON shemi iz `docs/research/2026-11-20-obrazac-listica.md` → S2
- [ ] tjedne mise iz stalnog rasporeda + iznimke („nema mise”, promjena s datumom) → S2
- [ ] normalizacija sati („8,00”, „18:30h”, „8 i 10”) → S2
- [ ] liturgijski kalendar: romcal `countries/croatia` + hrvatski nazivi → S3
- [ ] navod čitanja: izmjeriti daje li ga romcal; inače prijedlog izvora → S3

## F1 — urednik

- [ ] prijava: e-mail kod + passkey (po uzoru na omm `src/lib/admin/passkey.ts`) → S4
- [ ] uloge (župnik, urednik, administrator; biskupija samo u shemi) i pravila odluke 201 → S4
- [ ] zahtjev za župu, admin red provjera (Cloudflare Access), zapis provjere bez imenika (odluka 206) → S4
- [ ] pozivnice župnika, dnevnik promjena uloga → S4
- [ ] uređivač profila župe: crkve, stalni raspored, kontakt, uredovno vrijeme, IBAN, stalni blokovi → S5
- [ ] uređivač broja: liturgija, tjedne mise, obavijesti, razmatranje, događaji, slobodni blokovi → S6
- [ ] osjetljivi blokovi (odluka 204) i upozorenje kad javni tekst sadrži ime → S6

## F2 — izlaz

- [ ] PDF A4 dva stupca i A5 knjižica (Browser Rendering) → S7
- [ ] tiskani PDF samo za urednika, javni PDF bez osjetljivih blokova → S7
- [ ] HTML prikaz broja (mobitel) → S7
- [ ] stranica župe + arhiva brojeva → S8
- [ ] „mise u blizini” + `/api/mise` (JSON) + iCal, licenca podataka → S8
- [ ] stranica privatnosti → S8

## F3 — puštanje

- [ ] rate limiti, CSP s nonceom, `/security-review` → S9
- [ ] (!) produkcijski deploy i domena → S9
- [ ] (!) pilot s prvim župnikom, mjerenje vremena izrade broja → S10

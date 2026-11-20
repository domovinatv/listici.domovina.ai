# Handoffi

Istraživanje (R1, R2) je prethodilo planu. R2 je napisao `TODO.md`, `docs/plan.md` i
handoffe razvojnih sesija S1…S10 u ovaj direktorij.

## Lanac

1. Sesija N počinje iz svog handoffa (`SN.md`).
2. Na kraju: označi red u „Stanje lanca” i stavke u `TODO.md`. Ako je naučila nešto što
   mijenja kasnije pakete, uredi `S(N+1).md` (nedovršeno ide na **vrh**). Upiše polazni
   commit i `npm run check` brojke u `S(N+1).md`. `/wrap-up` uzima **sadržaj
   `S(N+1).md`** kao handoff prompt.
3. Bez konteksta usred paketa: nastavak je opet `SN`, broj se ne povećava.
4. **Vrata:** lanac staje dok korisnik ne odluči. Pitanje je na vrhu sljedećeg handoffa.
5. Handoff se mijenja samo prema naprijed.

„Nastavi listiće” (ili „nastavi zadnji handoff”) znači prvi otvoreni red u tablici ispod.

## Stanje lanca

| Sesija | Paket | Stanje | Commit | Testovi | Napomena |
| --- | --- | --- | --- | --- | --- |
| R0 | Inicijalizacija repoa + baza znanja | gotovo | 621f5c4 | | napravljeno iz sesije u crkve.domovina.ai |
| R1 | Kako župni listići izgledaju: zbirka i analiza | gotovo | 44098a3 | | 71 listić, 15 biskupija; odluke 100–107 |
| R2 (S0) | Identitet, pravno, servisi → `/todo-plan` | gotovo | 19c0ecc | | odluke 200–207; plan S1–S10 |
| S1 | Kostur + `npm run check` + uvoz župa | otvoreno | | | |
| S2 | Model listića i rasporeda | otvoreno | | | |
| S3 | Liturgijski kalendar | otvoreno | | | |
| S4 | Identitet i uloge | otvoreno | | | vrata: odluka 200 |
| S5 | Uređivač profila župe | otvoreno | | | |
| S6 | Uređivač broja | otvoreno | | | |
| S7 | PDF i HTML broja | otvoreno | | | |
| S8 | Javni web i API | otvoreno | | | |
| S9 | Sigurnost + produkcijski deploy | otvoreno | | | vrata: domena, deploy |
| S10 | Pilot s prvim župnikom | otvoreno | | | vrata: župnik |

## Zajednička pravila

- **Polazak:** `npm run check` zelen (od S1); ako nije, prvo popravi.
- **Opseg:** samo paket iz handoffa. `../omm.domovina.ai` se čita kao predložak, ne mijenja se.
- **Orkestracija:** posao rade subagenti Opus 5.5 (`effort` eksplicitno: `high` za kod,
  `medium` za čitanje), najviše 2–3 paralelno. Fable samo na izričit korisnikov zahtjev.
  Agentima su zabranjeni `TODO.md`, `docs/plan.md` i handoffi: njih ažurira orkestrator.
  U brief svakog agenta: radi samo unutar repoa i svog scratchpada, bez shell aliasa,
  ne otvaraj `~/Downloads`.
- **Testovi** bez mreže (fixture umjesto crkve.domovina.ai), `skipped 0`.
- **Osjetljivi podaci** (odluke 103, 203, 204): svaka javna ruta ima test da ih nema.
- **Uzorci nisu u gitu** (`data/uzorci/`). Prije commita `git status` ne smije pokazati
  nijedan PDF ili sliku listića. Test fixture se piše ručno, bez stvarnih imena.
- **Trošak:** procjena prije više od ~100 poziva (web, subagenti); nikad `claude -p` petlja.
- **Brojke s izvorom:** naredba ili URL + datum.
- **Autonomno:** odluči, zapiši u svoj blok u `docs/decisions.md`, commitaj svaki zeleni
  korak. Nepovratno i vanjsko (deploy, domena, mail stvarnim osobama, kontakt s
  biskupijom) ostavi korisniku.
- **Token budget:** bez Monitora za napredak; oko 150k konteksta zatvori sesiju.
- **Preglednik:** samo pinned Brave profil iz globalnog CLAUDE.md, nikad `open`.
- Istraživanja u `docs/research/YYYY-MM-DD-*.md`.
- Zamke Workera (CLAUDE.md): `env.ASSETS.fetch()` za vlastite assete, `"workers_dev": true`,
  `wrangler dev --local` hvata ono što `npm run dev` ne hvata.

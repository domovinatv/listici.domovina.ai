# Handoffi

Faza istraživanja (R1, R2) prethodi planu. R2 na kraju pokreće `/todo-plan`, koji
napiše `TODO.md`, `docs/plan.md` i handoffe razvojnih sesija S1…SN u ovaj direktorij.

## Lanac

1. Sesija počinje iz svog handoffa (`R1.md`, `R2.md`, kasnije `S1.md`…).
2. Na kraju: označi red ispod (commit, kratka napomena), dopuni sljedeći handoff onim
   što je naučila (nedovršeno na **vrh**), `/wrap-up` sa sadržajem sljedećeg handoffa.
3. Bez konteksta usred paketa: nastavak je isti handoff, broj se ne povećava.
4. Handoff se mijenja samo prema naprijed.

## Stanje lanca

| Sesija | Paket | Stanje | Commit | Napomena |
| --- | --- | --- | --- | --- |
| R0 | Inicijalizacija repoa + baza znanja | gotovo | (upisuje R0) | napravljeno iz sesije u crkve.domovina.ai |
| R1 | Kako župni listići izgledaju: zbirka i analiza | otvoreno | | |
| R2 | Identitet urednika, pravno, postojeći servisi → `/todo-plan` | otvoreno | | |

## Zajednička pravila

- **Uzorci nisu u gitu** (`data/uzorci/`). Prije svakog commita `git status` ne smije
  pokazati nijedan PDF/sliku listića.
- **Trošak:** prije posla procijeni broj poziva (web fetch, Firecrawl krediti, subagenti).
  Iznad ~100 poziva javi procjenu korisniku i čekaj. Subagenti Opus 5.5 ili Sonnet 5.5,
  `effort` eksplicitno (`medium` za čitanje), ≤3 paralelno. Fable samo na izričit zahtjev.
- **Preglednik:** samo pinned Brave profil iz globalnog CLAUDE.md, nikad `open`. Samo
  javne stranice; ne prijavljuj se nikamo u ime korisnika.
- **Brojke s izvorom:** svaka brojka ima URL + datum ili naredbu.
- **Token budget:** bez Monitora za napredak; oko 150k konteksta zatvori sesiju.
- Odluke u svoj blok u `docs/decisions.md` (R1: 100–199, R2: 200–299).

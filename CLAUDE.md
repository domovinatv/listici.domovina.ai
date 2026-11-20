# CLAUDE.md — listici.domovina.ai

Orijentacija za agente. Drži je aktualnom.

## Što je ovo
Aplikacija za **župne listiće**. Župnik (ili tko radi listić u župi) ga složi u
standardiziranom obrascu, preuzme kao PDF za tisak i automatski objavi na webu.
Župljani na jednom mjestu prate svoju župu, a raspored misa vide za **bilo koju**
župu u Hrvatskoj. Besplatno za župe, 100 % open source (MIT), kao i ostali
`*.domovina.ai` projekti.

**Stanje (2026-11-20): istraživanje gotovo, koda nema.** Polazište je u
`docs/2026-11-20-polaziste.md`. R1 (kako listići izgledaju) je u
`docs/research/2026-11-20-zupni-listici.md` i `docs/research/2026-11-20-obrazac-listica.md`,
a R2 (identitet urednika, osobni podaci, liturgija, postojeći servisi) u
`docs/research/2026-11-20-identitet-pravo-servisi.md`. Plan je lanac S1–S10:
`docs/plan.md`, `TODO.md`, `docs/handoffs/`.

## Lanac
`docs/handoffs/README.md`: „nastavi listiće” (ili „nastavi zadnji handoff”) znači
prvi otvoreni red u tablici „Stanje lanca”, pa njegov handoff. Vrata (identitet
prije S4, deploy S9, pilot S10) su u `docs/plan.md`.

## Stack (odluka, ne prijedlog)
Astro SSR + `@astrojs/cloudflare` → **Cloudflare Worker**, **D1**, po potrebi R2
(slike, PDF-ovi) i Browser Rendering (PDF). Račun D.O.M., domena u `wrangler.jsonc`
(`custom_domain`). Živi predložak istog stacka: `../omm.domovina.ai` (Astro 7, D1,
R2, Browser Rendering za PDF, rate limiti). Zamke Workera iz
`/Volumes/DOMOVINA2TB/git/domovinatv/crkve.domovina.ai/CLAUDE.md` vrijede i ovdje:
`fetch` na vlastiti origin ne dohvaća assete (`env.ASSETS.fetch()`), `routes` gasi
`workers.dev` (drži `"workers_dev": true`), `bun run dev` ne hvata asset zamke
(`wrangler dev --local` hvata).

## Odnos prema crkve.domovina.ai
- crkve je **izvor istine za župe** (1561 aktivna katolička župa, slug, OIB,
  biskupija, koordinate, crkve župe). Ovdje se župe **ne održavaju ručno**; uvoze se.
- Ugovor: `https://crkve.domovina.ai/data/zupe-index.json` (`{count, items}`) i
  `https://crkve.domovina.ai/data/zupa/<slug>.json`. Ključ veze je **slug župe**, uz
  OIB gdje postoji (723 katoličke pravne osobe nemaju OIB, slug tada nosi `SBT_ID`).
- crkve ima otvoren lanac popravaka podataka (konfesija, duplikati, koordinate). Brojke
  i slugovi se mogu promijeniti dok on ne završi; vidi njegov `docs/handoffs/README.md`.
- **Telefon, web i dio koordinata župa u crkve dolaze iz Google Placesa** i ne smiju
  se ovdje preuzimati ni prikazivati (uvjeti Googlea; crkve ih uklanja u svom S5).

## Pravila
- Repo je javan. **Prikupljeni tuđi listići (PDF, slike, tekst) nikad u git**:
  `data/uzorci/` je gitignoran. Commita se samo izvedena analiza bez osobnih podataka.
- Listići sadrže **osobne podatke** (intencije s imenima, krštenja, vjenčanja, sprovodi).
  Svaka odluka o pohrani i objavi toga ide kroz `docs/decisions.md`.
- Trošak: istraživanje i scraping po pravilima iz globalnog CLAUDE.md (procjena prije
  >100 poziva, Sonnet/Opus subagenti, ≤3 paralelno, Fable samo na izričit zahtjev).
- Brojka u dokumentu ima izvor (naredba, URL, datum dohvata).

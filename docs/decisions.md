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

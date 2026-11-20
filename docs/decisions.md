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

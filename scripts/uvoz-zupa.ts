// Uvoz župa iz crkve.domovina.ai u LOKALNU D1 (.wrangler/state), odluka 306.
//
//   npm run db:migrate:local
//   npm run uvoz:zupe            # = node scripts/uvoz-zupa.ts
//
// Baza dolazi iz getPlatformProxy (wrangler), pa piše isti kod (src/lib/uvoz-zupa.ts)
// koji će kasnije zvati scheduled handler Workera. Udaljena baza se ovdje ne dira.
import { getPlatformProxy } from "wrangler";
import type { Baza } from "../src/lib/baza.ts";
import { uveziZupe } from "../src/lib/uvoz-zupa.ts";

const paralela = Number(process.env.PARALELA ?? 4);

async function dohvati(url: string): Promise<unknown> {
  for (let pokusaj = 1; ; pokusaj++) {
    try {
      const odg = await fetch(url, { headers: { "user-agent": "listici.domovina.ai uvoz-zupa" } });
      if (!odg.ok) throw new Error(`HTTP ${odg.status} ${url}`);
      return await odg.json();
    } catch (e) {
      if (pokusaj >= 3) throw e;
      await new Promise((r) => setTimeout(r, 1000 * pokusaj));
    }
  }
}

const proxy = await getPlatformProxy<{ DB: Baza }>({ configPath: "wrangler.jsonc", persist: true });
const t0 = performance.now();
try {
  const r = await uveziZupe({
    db: proxy.env.DB,
    dohvati,
    paralela,
    napredak: (n, u) => {
      if (n % 250 === 0 || n === u) console.error(`  ${n}/${u}`);
    },
  });
  const s = ((performance.now() - t0) / 1000).toFixed(1);
  console.log(
    `u indeksu kind=zupa: ${r.u_indeksu}; nove ${r.nove.length}, promijenjene ${r.promijenjene.length}, ` +
      `nestale ${r.nestale.length}, vraćene ${r.vracene.length}, preimenovane ${r.preimenovane.length}, ` +
      `greške ${r.greske.length}; promjena ukupno ${r.promjena}; trajanje ${s} s (paralela ${paralela})`,
  );
  for (const p of r.preimenovane) console.log(`  preimenovano (${p.kljuc}): ${p.stari} → ${p.novi}`);
  for (const g of r.greske.slice(0, 20)) console.log(`  greška: ${g.slug}: ${g.poruka}`);
  if (r.greske.length) process.exitCode = 1;
} finally {
  await proxy.dispose();
}

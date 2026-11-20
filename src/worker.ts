// Ulaz Workera. Zasad samo Astro za HTTP; uvoz župa (scheduled) dolazi kad baza
// bude na računu (S9). Logika uvoza je u src/lib/uvoz-zupa.ts i ne ovisi o ulazu.
import { handle } from "@astrojs/cloudflare/handler";

export default {
  fetch: (request, env, ctx) => handle(request, env, ctx),
} satisfies ExportedHandler<Env>;

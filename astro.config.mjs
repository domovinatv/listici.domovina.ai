// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: "https://listici.domovina.ai",
  output: "server",
  // Bez Astro sesija i Cloudflare Images: adapter bi inače dodao vezove SESSION (KV) i
  // IMAGES i pri deployu ih sam stvorio na računu, a ništa ih ne koristi (odluka 300).
  session: false,
  adapter: cloudflare({ imageService: "passthrough" }),
});

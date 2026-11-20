// Kalendarski datumi bez vremenske zone: čisti 'YYYY-MM-DD', računanje u UTC, pa
// pomak na ljetno računanje vremena ili zona poslužitelja ne mogu pomaknuti dan.

export type Dan = "pon" | "uto" | "sri" | "cet" | "pet" | "sub" | "ned";
const DANI: Dan[] = ["ned", "pon", "uto", "sri", "cet", "pet", "sub"]; // redom getUTCDay()

const UZORAK_DATUMA = /^\d{4}-\d{2}-\d{2}$/;
const UZORAK_SATA = /^([01]\d|2[0-3]):[0-5]\d$/;

function uMs(datum: string): number {
  return Date.UTC(Number(datum.slice(0, 4)), Number(datum.slice(5, 7)) - 1, Number(datum.slice(8, 10)));
}

/** Postoji li takav dan u kalendaru (2026-02-30 ne postoji). */
export function jeDatum(s: string): boolean {
  if (!UZORAK_DATUMA.test(s)) return false;
  return new Date(uMs(s)).toISOString().slice(0, 10) === s;
}

export function jeSat(s: string): boolean {
  return UZORAK_SATA.test(s);
}

export function dodajDane(datum: string, n: number): string {
  return new Date(uMs(datum) + n * 86_400_000).toISOString().slice(0, 10);
}

export function danUTjednu(datum: string): Dan {
  return DANI[new Date(uMs(datum)).getUTCDay()];
}

/** Koji je to po redu takav dan u tjednu u mjesecu (1–5): 2026-11-29 je 5. nedjelja. */
export function tjedanUMjesecu(datum: string): number {
  return Math.ceil(Number(datum.slice(8, 10)) / 7);
}

/** Svi datumi od `od` do `do` uključivo. */
export function dani(od: string, do_: string): string[] {
  const van: string[] = [];
  for (let d = od; d <= do_; d = dodajDane(d, 1)) van.push(d);
  return van;
}

export function brojDana(od: string, do_: string): number {
  return Math.round((uMs(do_) - uMs(od)) / 86_400_000) + 1;
}

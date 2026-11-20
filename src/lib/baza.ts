// Najmanji dio D1 sučelja koji koristi kod u src/lib. Pravi `env.DB` (Worker ili
// getPlatformProxy) ga zadovoljava, a testovi ga ostvaruju nad node:sqlite
// (test/d1-sqlite.ts), pa logika ne treba mrežu ni workerd (odluka 305).
export interface Upit {
  bind(...vrijednosti: unknown[]): Upit;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
}

export interface Baza {
  prepare(sql: string): Upit;
  batch(upiti: Upit[]): Promise<unknown[]>;
}

/** D1 batch po komadima: jedan batch je jedna transakcija, pa ne smije biti golem. */
export async function izvrsi(db: Baza, upiti: Upit[], komad = 200): Promise<void> {
  for (let i = 0; i < upiti.length; i += komad) await db.batch(upiti.slice(i, i + komad));
}

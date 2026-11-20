// D1 nad node:sqlite (Node ≥ 22.5), za testove bez mreže i bez workerd (odluka 305).
// Migracije iz migrations/ izvršavaju se istim redom kao `wrangler d1 migrations apply`.
import { readdirSync, readFileSync } from "node:fs";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import type { Baza, Upit } from "../src/lib/baza.ts";

const MIGRACIJE = new URL("../migrations/", import.meta.url);

class SqliteUpit implements Upit {
  constructor(
    private readonly db: DatabaseSync,
    private readonly sql: string,
    private readonly vrijednosti: unknown[] = [],
  ) {}
  bind(...v: unknown[]): Upit {
    return new SqliteUpit(this.db, this.sql, v);
  }
  private get args(): SQLInputValue[] {
    return this.vrijednosti.map((v) => (v === undefined ? null : typeof v === "boolean" ? Number(v) : v)) as SQLInputValue[];
  }
  async all<T>(): Promise<{ results: T[] }> {
    return { results: this.db.prepare(this.sql).all(...this.args) as T[] };
  }
  async first<T>(): Promise<T | null> {
    return (this.db.prepare(this.sql).get(...this.args) as T | undefined) ?? null;
  }
  async run(): Promise<unknown> {
    return this.db.prepare(this.sql).run(...this.args);
  }
  izvrsiSinkrono(): void {
    this.db.prepare(this.sql).run(...this.args);
  }
}

export function novaBaza(): Baza & { sirovo: DatabaseSync } {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON"); // kao D1
  for (const f of readdirSync(MIGRACIJE).filter((f) => f.endsWith(".sql")).sort()) {
    db.exec(readFileSync(new URL(f, MIGRACIJE), "utf8"));
  }
  return {
    sirovo: db,
    prepare: (sql) => new SqliteUpit(db, sql),
    async batch(upiti) {
      // D1 batch je transakcija: sve ili ništa.
      db.exec("BEGIN");
      try {
        for (const u of upiti) (u as SqliteUpit).izvrsiSinkrono();
        db.exec("COMMIT");
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
      return [];
    },
  };
}

import { describe, expect, it } from "vitest";
import { NeispravanSat, normalizirajSate } from "../src/lib/sati.ts";

describe("normalizirajSate", () => {
  it.each([
    ["8,00", ["08:00"]],
    ["8.00", ["08:00"]],
    ["8h", ["08:00"]],
    ["8 h", ["08:00"]],
    ["18:30h", ["18:30"]],
    ["18,30 h", ["18:30"]],
    ["8 i 10", ["08:00", "10:00"]],
    ["7:30, 9 i 11", ["07:30", "09:00", "11:00"]],
    ["8 i 10 sati", ["08:00", "10:00"]],
    ["u 18 sati", ["18:00"]],
    ["11, 8 i 8,00", ["08:00", "11:00"]],
    ["0:00", ["00:00"]],
    ["3. nedjelja u 10 h", ["10:00"]],
  ])("%s → %j", (ulaz, izlaz) => {
    expect(normalizirajSate(ulaz)).toEqual(izlaz);
  });

  it("tekst bez sata i prazno daju []", () => {
    expect(normalizirajSate("")).toEqual([]);
    expect(normalizirajSate("   ")).toEqual([]);
    expect(normalizirajSate("nema svete mise")).toEqual([]);
  });

  it.each(["25:00", "8:75", "8:5", "830", "24 h", "8 i 25"])("%s je greška", (ulaz) => {
    expect(() => normalizirajSate(ulaz)).toThrow(NeispravanSat);
  });

  it("poruka navodi neispravan zapis", () => {
    expect(() => normalizirajSate("8 i 8:75")).toThrow(/„8:75” u „8 i 8:75”/);
  });
});

import { describe, expect, it } from "vitest";
import { calculateProfit, requiredPrice } from "./profit";
import { parseCsv, parseMoney, validateRows } from "./csv";

const base = { cost: 50, marketplaceFeePct: 10, fixedFee: 5, shipping: 15, packaging: 2, taxPct: 5, otherPct: 0 };

describe("calculadora de lucro", () => {
  it("calcula lucro líquido e margem", () => {
    const r = calculateProfit({ ...base, price: 100 });
    expect(r.totalCosts).toBeCloseTo(87);
    expect(r.profit).toBeCloseTo(13);
    expect(r.marginPct).toBeCloseTo(13);
    expect(r.costsPct).toBeCloseTo(87);
  });
  it("calcula preço necessário para margem desejada", () => {
    const p = requiredPrice(base, 20)!;
    expect(p).toBeCloseTo(72 / 0.65);
    expect(calculateProfit({ ...base, price: p }).marginPct).toBeCloseTo(20);
  });
  it("retorna null quando a margem é impossível", () => {
    expect(requiredPrice(base, 90)).toBeNull();
  });
});

describe("importação CSV", () => {
  it("aceita valores no formato brasileiro", () => {
    expect(parseMoney("1.234,56")).toBeCloseTo(1234.56);
    expect(parseMoney("R$ 12,50")).toBeCloseTo(12.5);
  });
  it("aponta linhas inválidas", () => {
    const { rows } = validateRows(parseCsv("nome;custo;estoque\nCaneca;10,00;5\n;abc;-1"));
    expect(rows[0]?.errors).toEqual([]);
    expect(rows[1]?.errors.length).toBe(3);
  });
});

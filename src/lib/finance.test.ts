import { describe, expect, it } from "vitest";
import { financeSummary, saleFinancials, type SaleInput } from "./finance";

const sale = (o: Partial<SaleInput> = {}): SaleInput => ({
  quantity: 2, unit_price: 100, unit_cost: 40, marketplace_fees: 24, shipping_cost: 20,
  packaging_cost: 4, advertising_cost: 6, other_costs: 0, refunded_amount: 0, payment_status: "pendente", ...o,
});

describe("lucro por venda", () => {
  it("subtrai cada custo uma única vez", () => {
    const f = saleFinancials(sale());
    expect(f.gross).toBe(200);
    expect(f.netReceivable).toBe(156); // 200 - 24 - 20
    expect(f.cogs).toBe(80);
    expect(f.profit).toBe(66); // 156 - 80 - 10
  });
  it("marca como incompleto quando falta o custo", () => {
    const f = saleFinancials(sale({ unit_cost: null }));
    expect(f.complete).toBe(false);
    expect(f.missing).toContain("Custo unitário do produto");
  });
  it("venda cancelada não gera faturamento nem lucro", () => {
    const f = saleFinancials(sale({ payment_status: "cancelado" }));
    expect(f.gross).toBe(0);
    expect(f.profit).toBe(0);
    expect(f.cancelledAmount).toBe(200);
  });
  it("reembolso parcial reduz a receita líquida", () => {
    expect(saleFinancials(sale({ refunded_amount: 50 })).netReceivable).toBe(106);
  });
  it("aceita números vindos como texto do banco", () => {
    expect(saleFinancials(sale({ unit_price: "100" as unknown as number })).gross).toBe(200);
  });
});

describe("resumo financeiro", () => {
  it("separa pendente, liberado e transferido sem tratar transferência como lucro", () => {
    const s = financeSummary(
      [sale(), sale({ payment_status: "liberado" }), sale({ payment_status: "cancelado" })],
      [{ amount: 100, status: "concluida" }, { amount: 30, status: "solicitada" }],
    );
    expect(s.gross).toBe(400);
    expect(s.pending).toBe(156);
    expect(s.released).toBe(156);
    expect(s.transferred).toBe(100);
    expect(s.availableEstimate).toBe(26);
    expect(s.profitEstimated).toBe(132);
    expect(s.profitRealized).toBe(66);
    expect(s.cancelledCount).toBe(1);
  });
});

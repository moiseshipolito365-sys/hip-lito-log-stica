/**
 * Cálculos financeiros por venda e consolidados.
 * Regras:
 * - Venda cancelada não conta como faturamento nem lucro.
 * - Lucro = receita líquida − custo do produto − despesas atribuíveis (cada custo subtraído uma única vez).
 * - Custo do produto ausente => cálculo marcado como incompleto (não é tratado como zero em silêncio).
 * - Transferência para o banco é movimentação entre contas: não altera faturamento nem lucro.
 */
export type PaymentStatus = "pendente" | "liberado" | "cancelado" | "reembolsado";

export type SaleInput = {
  quantity: number;
  unit_price: number;
  unit_cost: number | null;
  marketplace_fees: number;
  shipping_cost: number;
  packaging_cost: number;
  advertising_cost: number;
  other_costs: number;
  refunded_amount: number;
  payment_status: string;
};

export type TransferInput = { amount: number; status: string };

const num = (v: unknown) => {
  const x = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(x) ? x : 0;
};
const round = (v: number) => Math.round(v * 100) / 100;

export function saleFinancials(s: SaleInput) {
  const cancelled = s.payment_status === "cancelado";
  const gross = round(num(s.quantity) * num(s.unit_price));
  const refunded = cancelled ? 0 : s.payment_status === "reembolsado" && num(s.refunded_amount) === 0 ? gross : Math.min(num(s.refunded_amount), gross);
  const marketplaceFees = cancelled ? 0 : num(s.marketplace_fees);
  const shipping = cancelled ? 0 : num(s.shipping_cost);
  // valor que a plataforma repassa ao vendedor
  const netReceivable = cancelled ? 0 : round(gross - refunded - marketplaceFees - shipping);
  const fullyRefunded = !cancelled && refunded >= gross && gross > 0;
  const cogs = s.unit_cost === null || s.unit_cost === undefined ? null : cancelled || fullyRefunded ? 0 : round(num(s.quantity) * num(s.unit_cost));
  const otherExpenses = cancelled ? 0 : round(num(s.packaging_cost) + num(s.advertising_cost) + num(s.other_costs));
  const missing: string[] = [];
  if (cogs === null && !cancelled) missing.push("Custo unitário do produto");
  const profit = cancelled ? 0 : round(netReceivable - (cogs ?? 0) - otherExpenses);
  return {
    gross: cancelled ? 0 : gross,
    cancelledAmount: cancelled ? gross : 0,
    refunded,
    marketplaceFees,
    shipping,
    netReceivable,
    cogs,
    otherExpenses,
    profit,
    complete: missing.length === 0,
    missing,
  };
}

export function financeSummary(sales: SaleInput[], transfers: TransferInput[]) {
  const t = {
    salesCount: 0, gross: 0, cancelledCount: 0, cancelledAmount: 0, refundedCount: 0, refunded: 0,
    fees: 0, cogs: 0, otherExpenses: 0, profitEstimated: 0, profitRealized: 0, incompleteCount: 0,
    pending: 0, released: 0, transferred: 0, transfersPending: 0, availableEstimate: 0,
  };
  for (const s of sales) {
    const f = saleFinancials(s);
    if (s.payment_status === "cancelado") { t.cancelledCount++; t.cancelledAmount += f.cancelledAmount; continue; }
    t.salesCount++;
    t.gross += f.gross;
    if (f.refunded > 0) { t.refundedCount++; t.refunded += f.refunded; }
    t.fees += f.marketplaceFees + f.shipping;
    t.cogs += f.cogs ?? 0;
    t.otherExpenses += f.otherExpenses;
    t.profitEstimated += f.profit;
    if (!f.complete) t.incompleteCount++;
    if (s.payment_status === "liberado" || s.payment_status === "reembolsado") {
      t.released += f.netReceivable;
      if (f.complete) t.profitRealized += f.profit;
    } else t.pending += f.netReceivable;
  }
  for (const tr of transfers) {
    if (tr.status === "concluida") t.transferred += num(tr.amount);
    else if (tr.status === "solicitada") t.transfersPending += num(tr.amount);
  }
  t.availableEstimate = t.released - t.transferred - t.transfersPending;
  for (const k of Object.keys(t) as (keyof typeof t)[]) t[k] = round(t[k]);
  return t;
}

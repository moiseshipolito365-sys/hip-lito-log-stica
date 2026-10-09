export type CostInputs = {
  cost: number;
  price: number;
  marketplaceFeePct: number;
  fixedFee: number;
  shipping: number;
  packaging: number;
  taxPct: number;
  otherPct: number;
};

export type ProfitResult = {
  totalCosts: number;
  profit: number;
  marginPct: number;
  costsPct: number;
};

const n = (v: number) => (Number.isFinite(v) ? v : 0);

export function calculateProfit(i: CostInputs): ProfitResult {
  const price = n(i.price);
  const pct = n(i.marketplaceFeePct) + n(i.taxPct) + n(i.otherPct);
  const totalCosts =
    n(i.cost) + n(i.fixedFee) + n(i.shipping) + n(i.packaging) + (price * pct) / 100;
  const profit = price - totalCosts;
  return {
    totalCosts,
    profit,
    marginPct: price > 0 ? (profit / price) * 100 : 0,
    costsPct: price > 0 ? (totalCosts / price) * 100 : 0,
  };
}

/** Preço de venda necessário para atingir a margem desejada. null = impossível. */
export function requiredPrice(i: Omit<CostInputs, "price">, targetMarginPct: number): number | null {
  const fixed = n(i.cost) + n(i.fixedFee) + n(i.shipping) + n(i.packaging);
  const denom = 1 - (n(i.marketplaceFeePct) + n(i.taxPct) + n(i.otherPct) + n(targetMarginPct)) / 100;
  if (denom <= 0) return null;
  return fixed / denom;
}

export const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n(v));

export const pct = (v: number) =>
  `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(n(v))}%`;

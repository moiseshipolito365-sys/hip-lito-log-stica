import { Input } from "@/components/ui/input";
import { Field } from "@/components/app/ProductForm";

export type CostForm = {
  marketplace_fee_pct: string;
  fixed_fee: string;
  shipping_cost: string;
  packaging_cost: string;
  tax_pct: string;
  other_pct: string;
  target_margin_pct: string;
};

export const COST_LABELS: Record<keyof CostForm, string> = {
  marketplace_fee_pct: "Tarifa do marketplace (%)",
  fixed_fee: "Tarifa fixa por venda (R$)",
  shipping_cost: "Frete pago pelo vendedor (R$)",
  packaging_cost: "Embalagem e outros custos (R$)",
  tax_pct: "Impostos (%)",
  other_pct: "Outros custos adicionais (%)",
  target_margin_pct: "Margem desejada (%)",
};

export function CostFields({ value, onChange }: { value: CostForm; onChange: (v: CostForm) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {(Object.keys(COST_LABELS) as (keyof CostForm)[]).map((k) => (
        <Field key={k} label={COST_LABELS[k]}>
          <Input inputMode="decimal" value={value[k]} onChange={(e) => onChange({ ...value, [k]: e.target.value })} placeholder="0" />
        </Field>
      ))}
    </div>
  );
}

export const MARKETPLACE_NOTICE =
  "As tarifas do Mercado Livre variam conforme a categoria, o tipo de anúncio (Clássico/Premium), a faixa de preço, o frete e as condições da sua conta. Confirme os valores reais na sua conta antes de usar estes cálculos.";

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/app/common";
import { Field } from "@/components/app/ProductForm";
import { CostFields, MARKETPLACE_NOTICE, type CostForm } from "@/components/app/CostFields";
import { productsQuery, settingsQuery } from "@/lib/queries";
import { calculateProfit, requiredPrice, brl, pct } from "@/lib/profit";
import { parseMoney } from "@/lib/csv";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/calculadora")({
  head: () => ({ meta: [{ title: "Calculadora de Lucro — HipólitoLogística" }, { name: "description", content: "Calcule lucro e margem por venda." }] }),
  component: Calculadora,
});

const num = (s: string) => parseMoney(s) ?? 0;
const blank: CostForm = { marketplace_fee_pct: "", fixed_fee: "", shipping_cost: "", packaging_cost: "", tax_pct: "", other_pct: "", target_margin_pct: "20" };

function Calculadora() {
  const settings = useQuery(settingsQuery);
  const products = useQuery(productsQuery);
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");
  const [c, setC] = useState<CostForm>(blank);
  const [productId, setProductId] = useState("none");

  useEffect(() => {
    const s = settings.data;
    if (!s) return;
    const str = (v: number) => String(v).replace(".", ",");
    setC({
      marketplace_fee_pct: str(s.marketplace_fee_pct), fixed_fee: str(s.fixed_fee), shipping_cost: str(s.shipping_cost),
      packaging_cost: str(s.packaging_cost), tax_pct: str(s.tax_pct), other_pct: str(s.other_pct), target_margin_pct: str(s.target_margin_pct),
    });
  }, [settings.data]);

  function pickProduct(id: string) {
    setProductId(id);
    const p = products.data?.find((x) => x.id === id);
    if (p) { setCost(String(p.cost_price).replace(".", ",")); setPrice(String(p.sale_price).replace(".", ",")); }
  }

  const inputs = {
    cost: num(cost), marketplaceFeePct: num(c.marketplace_fee_pct), fixedFee: num(c.fixed_fee), shipping: num(c.shipping_cost),
    packaging: num(c.packaging_cost), taxPct: num(c.tax_pct), otherPct: num(c.other_pct),
  };
  const r = calculateProfit({ ...inputs, price: num(price) });
  const target = num(c.target_margin_pct);
  const needed = requiredPrice(inputs, target);

  return (
    <>
      <PageHeader title="Calculadora de Lucro" description="Simule o lucro líquido de cada venda." />
      <div className="mb-6 flex gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
        <Info className="h-5 w-5 shrink-0 text-warning-foreground" />
        <p>{MARKETPLACE_NOTICE} Os valores padrão vêm de <Link to="/configuracoes" className="font-medium underline">Configurações</Link>.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-lg">Dados da venda</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Carregar de um produto do catálogo (opcional)">
              <Select value={productId} onValueChange={pickProduct}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Digitar manualmente</SelectItem>
                  {products.data?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Custo do produto (R$)"><Input inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0,00" /></Field>
              <Field label="Preço de venda (R$)"><Input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" /></Field>
            </div>
            <CostFields value={c} onChange={setC} />
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card className="bg-hero text-sidebar-foreground shadow-card">
            <CardContent className="p-6">
              <p className="text-sm">Lucro líquido estimado por venda</p>
              <p className={cn("mt-1 font-display text-4xl font-bold", r.profit < 0 ? "text-destructive" : "text-sidebar-primary")}>{brl(r.profit)}</p>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div><p className="text-xs">Margem de lucro</p><p className="font-display text-xl font-semibold text-sidebar-accent-foreground">{pct(r.marginPct)}</p></div>
                <div><p className="text-xs">Custos sobre o preço</p><p className="font-display text-xl font-semibold text-sidebar-accent-foreground">{pct(r.costsPct)}</p></div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="space-y-2 p-6 text-sm">
              <Row label="Custo total da venda" value={brl(r.totalCosts)} />
              <Row label="Tarifa do marketplace" value={brl((num(price) * inputs.marketplaceFeePct) / 100)} />
              <Row label="Impostos e outros (%)" value={brl((num(price) * (inputs.taxPct + inputs.otherPct)) / 100)} />
              <div className="border-t pt-3">
                <p className="text-muted-foreground">Preço necessário para margem de {pct(target)}</p>
                <p className="font-display text-2xl font-bold">{needed === null ? "Impossível com esses percentuais" : brl(needed)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>;
}

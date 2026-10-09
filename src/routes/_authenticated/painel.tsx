import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Boxes, Truck, CheckCircle2, XCircle, Wallet, TrendingUp, Activity as ActivityIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader, Loading, EmptyState } from "@/components/app/common";
import { productsQuery, suppliersQuery, activitiesQuery } from "@/lib/queries";
import { brl, pct } from "@/lib/profit";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({ meta: [{ title: "Painel — HipólitoLogística" }, { name: "description", content: "Resumo dos seus produtos e fornecedores." }] }),
  component: Painel,
});

const ENTITY: Record<string, string> = { products: "Produto", suppliers: "Fornecedor", listings: "Anúncio" };
const ACTION: Record<string, string> = { insert: "cadastrado", update: "atualizado", delete: "excluído" };

function Painel() {
  const products = useQuery(productsQuery);
  const suppliers = useQuery(suppliersQuery);
  const activities = useQuery(activitiesQuery);

  if (products.isLoading || suppliers.isLoading) return <Loading />;
  const p = products.data ?? [];
  const available = p.filter((x) => x.availability === "disponivel").length;
  const unavailable = p.filter((x) => x.availability === "indisponivel").length;
  const totalCost = p.reduce((s, x) => s + Number(x.cost_price) * (x.stock ?? 1), 0);
  const totalSale = p.reduce((s, x) => s + Number(x.sale_price) * (x.stock ?? 1), 0);
  const priced = p.filter((x) => Number(x.sale_price) > 0);
  const grossMargin = priced.length
    ? (priced.reduce((s, x) => s + (Number(x.sale_price) - Number(x.cost_price)), 0) /
        priced.reduce((s, x) => s + Number(x.sale_price), 0)) * 100
    : 0;

  const stats = [
    { label: "Produtos cadastrados", value: p.length, icon: Boxes },
    { label: "Fornecedores", value: suppliers.data?.length ?? 0, icon: Truck },
    { label: "Disponíveis", value: available, icon: CheckCircle2 },
    { label: "Indisponíveis", value: unavailable, icon: XCircle },
    { label: "Valor estimado (venda)", value: brl(totalSale), hint: `Custo: ${brl(totalCost)}`, icon: Wallet },
    { label: "Margem bruta estimada", value: pct(grossMargin), hint: "Antes de tarifas, frete e impostos", icon: TrendingUp },
  ];

  return (
    <>
      <PageHeader title="Painel" description="Visão geral com base nos dados cadastrados por você." />
      {p.length === 0 && (
        <div className="mb-6 rounded-xl border bg-card p-5 shadow-card">
          <p className="font-medium">Comece cadastrando seus fornecedores e produtos.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild size="sm"><Link to="/catalogo">Cadastrar produto</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/fornecedores">Cadastrar fornecedor</Link></Button>
          </div>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="shadow-card">
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="mt-1 font-display text-2xl font-bold">{s.value}</p>
                {s.hint && <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>}
              </div>
              <div className="rounded-lg bg-secondary p-2"><s.icon className="h-5 w-5 text-primary" /></div>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Valores estimados multiplicam o preço pelo estoque informado (ou 1 quando o estoque é desconhecido).</p>
      <Card className="mt-6 shadow-card">
        <CardHeader><CardTitle className="text-lg">Atividades recentes</CardTitle></CardHeader>
        <CardContent>
          {activities.isLoading ? <Loading /> : !activities.data?.length ? (
            <EmptyState icon={ActivityIcon} title="Nenhuma atividade ainda" description="Cadastros, edições e exclusões aparecerão aqui." />
          ) : (
            <ul className="divide-y">
              {activities.data.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span><strong>{ENTITY[a.entity] ?? a.entity}</strong> {ACTION[a.action] ?? a.action}: {a.label}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR })}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}

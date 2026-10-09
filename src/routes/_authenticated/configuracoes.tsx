import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, Loading } from "@/components/app/common";
import { CostFields, COST_LABELS, MARKETPLACE_NOTICE, type CostForm } from "@/components/app/CostFields";
import { settingsQuery, errMsg } from "@/lib/queries";
import { parseMoney } from "@/lib/csv";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — HipólitoLogística" }, { name: "description", content: "Configure seus custos padrão." }] }),
  component: Configuracoes,
});

const blank: CostForm = { marketplace_fee_pct: "0", fixed_fee: "0", shipping_cost: "0", packaging_cost: "0", tax_pct: "0", other_pct: "0", target_margin_pct: "20" };

function Configuracoes() {
  const qc = useQueryClient();
  const settings = useQuery(settingsQuery);
  const [f, setF] = useState<CostForm>(blank);

  useEffect(() => {
    const s = settings.data;
    if (!s) return;
    const str = (v: number) => String(v).replace(".", ",");
    setF({ marketplace_fee_pct: str(s.marketplace_fee_pct), fixed_fee: str(s.fixed_fee), shipping_cost: str(s.shipping_cost), packaging_cost: str(s.packaging_cost), tax_pct: str(s.tax_pct), other_pct: str(s.other_pct), target_margin_pct: str(s.target_margin_pct) });
  }, [settings.data]);

  const save = useMutation({
    mutationFn: async () => {
      const row: Record<string, number> = {};
      for (const k of Object.keys(f) as (keyof CostForm)[]) {
        const v = parseMoney(f[k] || "0");
        if (v === null || v < 0) throw new Error(`Valor inválido em "${COST_LABELS[k]}"`);
        if (k.endsWith("_pct") && v > 100) throw new Error(`"${COST_LABELS[k]}" não pode passar de 100%`);
        row[k] = v;
      }
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Sessão expirada");
      const { error } = await supabase.from("cost_settings").upsert({ user_id: u.user.id, ...row });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Configurações salvas"); qc.invalidateQueries({ queryKey: ["cost_settings"] }); },
    onError: (e) => toast.error(errMsg(e)),
  });

  return (
    <>
      <PageHeader title="Configurações" description="Valores padrão usados na calculadora de lucro." />
      <Card className="max-w-3xl shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Custos padrão por venda</CardTitle>
          <CardDescription>{MARKETPLACE_NOTICE}</CardDescription>
        </CardHeader>
        <CardContent>
          {settings.isLoading ? <Loading /> : (
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-6">
              <CostFields value={f} onChange={setF} />
              <Button disabled={save.isPending}>{save.isPending ? "Salvando..." : "Salvar configurações"}</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </>
  );
}

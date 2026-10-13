import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { format } from "date-fns";
import { ExternalLink, Link2, RefreshCw, Unplug } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading, StatusBadge } from "@/components/app/common";
import { getMlSetup, startMlAuth, disconnectMl, syncMlItems } from "@/lib/mercadolivre.functions";
import { errMsg } from "@/lib/queries";
import { brl } from "@/lib/profit";

const STATUS: Record<string, [string, string]> = {
  conectada: ["ativo", "Conectada"],
  erro: ["erro", "Com erro"],
  reconectar: ["erro", "Reconectar"],
};

export function MercadoLivreCard() {
  const qc = useQueryClient();
  const setupFn = useServerFn(getMlSetup);
  const startFn = useServerFn(startMlAuth);
  const disconnectFn = useServerFn(disconnectMl);
  const syncFn = useServerFn(syncMlItems);

  const setup = useQuery({ queryKey: ["ml_setup"], queryFn: () => setupFn() });
  const conn = useQuery({
    queryKey: ["ml_connection"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ml_connections").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const items = useQuery({
    queryKey: ["ml_items"],
    enabled: !!conn.data,
    queryFn: async () => {
      const { data, error } = await supabase.from("ml_items").select("*").order("title").limit(200);
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const s = p.get("ml");
    if (!s) return;
    if (s === "ok") toast.success("Conta do Mercado Livre conectada");
    else toast.error(p.get("msg") || "Falha ao conectar o Mercado Livre");
    window.history.replaceState(null, "", window.location.pathname);
    qc.invalidateQueries({ queryKey: ["ml_connection"] });
  }, [qc]);

  const connect = useMutation({
    mutationFn: () => startFn(),
    onSuccess: ({ url }) => { window.location.href = url; },
    onError: (e) => toast.error(errMsg(e)),
  });
  const disconnect = useMutation({
    mutationFn: () => disconnectFn(),
    onSuccess: () => { toast.success("Conta desconectada"); qc.invalidateQueries({ queryKey: ["ml_connection"] }); qc.removeQueries({ queryKey: ["ml_items"] }); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const sync = useMutation({
    mutationFn: () => syncFn(),
    onSuccess: (r) => { toast.success(`${r.synced} anúncio(s) sincronizado(s)`); qc.invalidateQueries({ queryKey: ["ml_connection"] }); qc.invalidateQueries({ queryKey: ["ml_items"] }); },
    onError: (e) => { toast.error(errMsg(e)); qc.invalidateQueries({ queryKey: ["ml_connection"] }); },
  });

  const c = conn.data;
  const missing = setup.data?.missing ?? [];

  return (
    <Card className="max-w-3xl shadow-card">
      <CardHeader>
        <CardTitle className="text-lg">Integração com o Mercado Livre</CardTitle>
        <CardDescription>Conexão oficial por autorização da sua conta. Nesta etapa o sistema apenas lê seus dados — não publica, altera nem exclui anúncios.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {conn.isLoading || setup.isLoading ? <Loading /> : (
          <>
            {missing.length > 0 && (
              <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
                <p className="font-medium">Configuração pendente: {missing.join(", ")}</p>
                {setup.data?.redirectUri && <p className="mt-1 break-all">URL de redirecionamento a cadastrar no Mercado Livre: <code>{setup.data.redirectUri}</code></p>}
              </div>
            )}
            {!c ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">Nenhuma conta conectada.</p>
                <Button onClick={() => connect.mutate()} disabled={connect.isPending || missing.length > 0}>
                  <Link2 className="mr-1 h-4 w-4" />{connect.isPending ? "Abrindo..." : "Conectar conta do Mercado Livre"}
                </Button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="text-sm">
                    <p className="font-semibold">{c.nickname ?? `Usuário ${c.ml_user_id}`}</p>
                    <p className="text-muted-foreground">ID {c.ml_user_id}{c.site_id ? ` · ${c.site_id}` : ""}{c.email ? ` · ${c.email}` : ""}</p>
                    <p className="text-muted-foreground">Última sincronização: {c.last_sync_at ? format(new Date(c.last_sync_at), "dd/MM/yyyy HH:mm") : "nunca"}</p>
                  </div>
                  <StatusBadge value={STATUS[c.status]?.[0] ?? "erro"} label={STATUS[c.status]?.[1] ?? c.status} />
                </div>
                {c.last_error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{c.last_error}</p>}
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => sync.mutate()} disabled={sync.isPending}><RefreshCw className={`mr-1 h-4 w-4 ${sync.isPending ? "animate-spin" : ""}`} />{sync.isPending ? "Sincronizando..." : "Sincronizar anúncios"}</Button>
                  {c.status === "reconectar" && <Button variant="outline" onClick={() => connect.mutate()}>Reconectar</Button>}
                  <Button variant="outline" onClick={() => disconnect.mutate()} disabled={disconnect.isPending}><Unplug className="mr-1 h-4 w-4" />Desconectar</Button>
                </div>
                {items.data && items.data.length > 0 && (
                  <div className="max-h-96 overflow-auto rounded-md border text-sm">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-muted text-left"><tr><th className="p-2">Anúncio</th><th className="p-2">Preço</th><th className="p-2">Status</th><th className="p-2">Estoque</th></tr></thead>
                      <tbody>
                        {items.data.map((i) => (
                          <tr key={i.id} className="border-t">
                            <td className="p-2">
                              <span className="font-medium">{i.title}</span>
                              <div className="text-xs text-muted-foreground">{i.ml_item_id} {i.permalink && <a href={i.permalink} target="_blank" rel="noopener noreferrer" className="inline-flex text-primary"><ExternalLink className="h-3 w-3" /></a>}</div>
                            </td>
                            <td className="p-2">{i.price !== null ? brl(Number(i.price)) : "—"}</td>
                            <td className="p-2">{i.status ?? "—"}</td>
                            <td className="p-2">{i.available_quantity ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {items.data && items.data.length === 0 && c.last_sync_at && <p className="text-sm text-muted-foreground">Nenhum anúncio encontrado na conta.</p>}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

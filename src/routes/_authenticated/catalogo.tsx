import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { Boxes, ExternalLink, FileUp, ImageOff, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, EmptyState, Loading, StatusBadge } from "@/components/app/common";
import { ProductForm } from "@/components/app/ProductForm";
import { CsvImport } from "@/components/app/CsvImport";
import { ConfirmDelete } from "@/components/app/ConfirmDelete";
import { productsQuery, suppliersQuery, AVAILABILITY_LABEL, errMsg, type Product } from "@/lib/queries";
import { brl, pct } from "@/lib/profit";

export const Route = createFileRoute("/_authenticated/catalogo")({
  head: () => ({ meta: [{ title: "Catálogo de Produtos — HipólitoLogística" }, { name: "description", content: "Cadastre e gerencie seus produtos." }] }),
  component: Catalogo,
});

function Catalogo() {
  const qc = useQueryClient();
  const products = useQuery(productsQuery);
  const suppliers = useQuery(suppliersQuery);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [sup, setSup] = useState("all");
  const [avail, setAvail] = useState("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Product | null>(null);

  const supplierName = useMemo(() => new Map((suppliers.data ?? []).map((s) => [s.id, s.name])), [suppliers.data]);
  const categories = useMemo(() => [...new Set((products.data ?? []).map((p) => p.category).filter(Boolean) as string[])].sort(), [products.data]);

  const filtered = (products.data ?? []).filter((p) => {
    const term = q.trim().toLowerCase();
    if (term && !p.name.toLowerCase().includes(term) && !(p.sku ?? "").toLowerCase().includes(term)) return false;
    if (cat !== "all" && p.category !== cat) return false;
    if (sup !== "all" && (sup === "none" ? p.supplier_id : p.supplier_id !== sup)) return false;
    if (avail !== "all" && p.availability !== avail) return false;
    return true;
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produto excluído");
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["activities"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const openNew = () => { setEditing(null); setFormOpen(true); };

  return (
    <>
      <PageHeader
        title="Catálogo de Produtos"
        description="Cadastre, pesquise, edite e importe produtos dos seus fornecedores."
        actions={<>
          <Button variant="outline" onClick={() => setImportOpen(true)}><FileUp className="mr-1 h-4 w-4" />Importar CSV</Button>
          <Button onClick={openNew}><Plus className="mr-1 h-4 w-4" />Novo produto</Button>
        </>}
      />

      <div className="mb-4 grid gap-2 md:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por nome ou SKU" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="md:w-44"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sup} onValueChange={setSup}>
          <SelectTrigger className="md:w-44"><SelectValue placeholder="Fornecedor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos fornecedores</SelectItem>
            <SelectItem value="none">Sem fornecedor</SelectItem>
            {suppliers.data?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={avail} onValueChange={setAvail}>
          <SelectTrigger className="md:w-40"><SelectValue placeholder="Disponibilidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Qualquer status</SelectItem>
            {Object.entries(AVAILABILITY_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {products.isLoading ? <Loading /> : products.error ? (
        <p className="text-destructive">Erro ao carregar produtos: {errMsg(products.error)}</p>
      ) : !products.data?.length ? (
        <EmptyState icon={Boxes} title="Nenhum produto cadastrado" description="Cadastre seu primeiro produto manualmente ou importe uma planilha CSV."
          action={<div className="flex gap-2"><Button onClick={openNew}>Cadastrar produto</Button><Button variant="outline" onClick={() => setImportOpen(true)}>Importar CSV</Button></div>} />
      ) : !filtered.length ? (
        <EmptyState icon={Search} title="Nenhum resultado" description="Nenhum produto corresponde à busca e aos filtros." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const margin = Number(p.sale_price) > 0 ? ((Number(p.sale_price) - Number(p.cost_price)) / Number(p.sale_price)) * 100 : null;
            return (
              <Card key={p.id} className="overflow-hidden shadow-card">
                <div className="flex aspect-[16/9] items-center justify-center bg-muted">
                  {p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" loading="lazy" /> : <ImageOff className="h-8 w-8 text-muted-foreground" />}
                </div>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{p.name}</h3>
                      <p className="truncate text-xs text-muted-foreground">
                        {[p.sku && `SKU ${p.sku}`, p.category, p.supplier_id && supplierName.get(p.supplier_id)].filter(Boolean).join(" · ") || "Sem detalhes"}
                      </p>
                    </div>
                    <StatusBadge value={p.availability} label={AVAILABILITY_LABEL[p.availability]} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/60 p-2 text-center text-xs">
                    <div><p className="text-muted-foreground">Custo</p><p className="font-semibold">{brl(Number(p.cost_price))}</p></div>
                    <div><p className="text-muted-foreground">Venda</p><p className="font-semibold">{brl(Number(p.sale_price))}</p></div>
                    <div><p className="text-muted-foreground">Margem bruta</p><p className="font-semibold">{margin === null ? "—" : pct(margin)}</p></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Estoque: {p.stock ?? "desconhecido"}</span>
                    <span>Atualizado {format(new Date(p.updated_at), "dd/MM/yyyy HH:mm")}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditing(p); setFormOpen(true); }}><Pencil className="mr-1 h-3.5 w-3.5" />Editar</Button>
                    {p.supplier_url && <Button size="sm" variant="outline" asChild><a href={p.supplier_url} target="_blank" rel="noopener noreferrer" aria-label="Abrir no fornecedor"><ExternalLink className="h-3.5 w-3.5" /></a></Button>}
                    <Button size="sm" variant="outline" onClick={() => setToDelete(p)} aria-label="Excluir"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ProductForm open={formOpen} onOpenChange={setFormOpen} product={editing} />
      <CsvImport open={importOpen} onOpenChange={setImportOpen} />
      <ConfirmDelete open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} title={`"${toDelete?.name}"`} onConfirm={() => toDelete && del.mutate(toDelete.id)} />
    </>
  );
}

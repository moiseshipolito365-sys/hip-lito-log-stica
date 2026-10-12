import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { ExternalLink, Pencil, Plus, Trash2, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, EmptyState, Loading, StatusBadge } from "@/components/app/common";
import { Field } from "@/components/app/ProductForm";
import { ConfirmDelete } from "@/components/app/ConfirmDelete";
import { suppliersQuery, productsQuery, SUPPLIER_STATUS_LABEL, errMsg, type Supplier } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/fornecedores")({
  head: () => ({ meta: [{ title: "Fornecedores — HipólitoLogística" }, { name: "description", content: "Gerencie seus fornecedores." }] }),
  component: Fornecedores,
});

const url = z.string().trim().url("URL inválida").max(1000).or(z.literal(""));
const schema = z.object({
  name: z.string().trim().min(1, "Informe o nome da empresa").max(200),
  website: url,
  catalog_url: url,
  contact: z.string().trim().max(500),
  notes: z.string().max(5000),
  status: z.enum(["ativo", "em_avaliacao", "inativo"]),
});
const empty = { name: "", website: "", catalog_url: "", contact: "", notes: "", status: "ativo" as const };

function Fornecedores() {
  const qc = useQueryClient();
  const suppliers = useQuery(suppliersQuery);
  const products = useQuery(productsQuery);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [f, setF] = useState<z.infer<typeof schema>>(empty);
  const [toDelete, setToDelete] = useState<Supplier | null>(null);

  useEffect(() => {
    if (!open) return;
    setF(editing ? { name: editing.name, website: editing.website ?? "", catalog_url: editing.catalog_url ?? "", contact: editing.contact ?? "", notes: editing.notes ?? "", status: editing.status as typeof empty.status } : empty);
  }, [open, editing]);

  const invalidate = () => ["suppliers", "products", "activities"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));

  const save = useMutation({
    mutationFn: async () => {
      const p = schema.safeParse(f);
      if (!p.success) throw new Error(p.error.issues[0]?.message ?? "Dados inválidos");
      const row = { ...p.data, website: p.data.website || null, catalog_url: p.data.catalog_url || null, contact: p.data.contact || null, notes: p.data.notes || null };
      const { error } = editing ? await supabase.from("suppliers").update(row).eq("id", editing.id) : await supabase.from("suppliers").insert(row);
      if (error) throw error;
    },
    onSuccess: () => { toast.success(editing ? "Fornecedor atualizado" : "Fornecedor cadastrado"); invalidate(); setOpen(false); },
    onError: (e) => toast.error(errMsg(e)),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("suppliers").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Fornecedor excluído. Produtos associados ficaram sem fornecedor."); invalidate(); },
    onError: (e) => toast.error(errMsg(e)),
  });

  const count = (id: string) => (products.data ?? []).filter((p) => p.supplier_id === id).length;
  const openNew = () => { setEditing(null); setOpen(true); };

  return (
    <>
      <PageHeader title="Fornecedores" description="Cadastre fornecedores e associe-os aos produtos do catálogo." actions={<Button onClick={openNew}><Plus className="mr-1 h-4 w-4" />Novo fornecedor</Button>} />
      {suppliers.isLoading ? <Loading /> : !suppliers.data?.length ? (
        <EmptyState icon={Truck} title="Nenhum fornecedor cadastrado" description="Cadastre seus fornecedores para associá-los aos produtos." action={<Button onClick={openNew}>Cadastrar fornecedor</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {suppliers.data.map((s) => (
            <Card key={s.id} className="shadow-card">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><h3 className="truncate font-semibold">{s.name}</h3><p className="text-xs text-muted-foreground">{count(s.id)} produto(s)</p></div>
                  <StatusBadge value={s.status} label={SUPPLIER_STATUS_LABEL[s.status]} />
                </div>
                {s.contact && <p className="text-sm"><span className="text-muted-foreground">Contato:</span> {s.contact}</p>}
                {s.notes && <p className="line-clamp-2 text-sm text-muted-foreground">{s.notes}</p>}
                <div className="flex flex-wrap gap-2 text-sm">
                  {s.website && <a className="inline-flex items-center gap-1 text-primary hover:underline" href={s.website} target="_blank" rel="noopener noreferrer">Site <ExternalLink className="h-3 w-3" /></a>}
                  {s.catalog_url && <a className="inline-flex items-center gap-1 text-primary hover:underline" href={s.catalog_url} target="_blank" rel="noopener noreferrer">Catálogo <ExternalLink className="h-3 w-3" /></a>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditing(s); setOpen(true); }}><Pencil className="mr-1 h-3.5 w-3.5" />Editar</Button>
                  <Button size="sm" variant="outline" onClick={() => setToDelete(s)} aria-label="Excluir"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle>{editing ? "Editar fornecedor" : "Novo fornecedor"}</DialogTitle></DialogHeader>
          <form id="sup-form" onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome da empresa *" className="sm:col-span-2"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></Field>
            <Field label="Site"><Input value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} placeholder="https://..." /></Field>
            <Field label="Link do catálogo"><Input value={f.catalog_url} onChange={(e) => setF({ ...f, catalog_url: e.target.value })} placeholder="https://..." /></Field>
            <Field label="Contato comercial"><Input value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} placeholder="Nome, telefone, e-mail" /></Field>
            <Field label="Status">
              <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v as typeof f.status })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(SUPPLIER_STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Observações" className="sm:col-span-2"><Textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} rows={3} /></Field>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" form="sup-form" disabled={save.isPending}>{save.isPending ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDelete open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} title={`"${toDelete?.name}"`} onConfirm={() => toDelete && del.mutate(toDelete.id)} />
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Info, Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
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
import { listingsQuery, productsQuery, LISTING_STATUS_LABEL, errMsg, type Listing } from "@/lib/queries";
import { parseMoney } from "@/lib/csv";
import { brl } from "@/lib/profit";

export const Route = createFileRoute("/_authenticated/anuncios")({
  head: () => ({ meta: [{ title: "Anúncios — HipólitoLogística" }, { name: "description", content: "Prepare anúncios para o Mercado Livre." }] }),
  component: Anuncios,
});

// "publicado" e "erro" serão definidos pela futura integração oficial — não podem ser escolhidos manualmente.
const EDITABLE_STATUS = ["rascunho", "revisar"] as const;
const schema = z.object({
  title: z.string().trim().min(1, "Informe o título").max(60, "O título deve ter até 60 caracteres"),
  description: z.string().max(50000),
  price: z.number({ message: "Preço inválido" }).min(0),
  category: z.string().trim().max(100),
  photos: z.array(z.string().url("Foto com URL inválida")).max(12, "Máximo de 12 fotos"),
  status: z.enum(EDITABLE_STATUS),
});
const empty = { product_id: "none", title: "", description: "", price: "", category: "", photos: "", status: "rascunho" };

function Anuncios() {
  const qc = useQueryClient();
  const listings = useQuery(listingsQuery);
  const products = useQuery(productsQuery);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Listing | null>(null);
  const [f, setF] = useState(empty);
  const [toDelete, setToDelete] = useState<Listing | null>(null);

  useEffect(() => {
    if (!open) return;
    setF(editing ? {
      product_id: editing.product_id ?? "none", title: editing.title, description: editing.description ?? "",
      price: String(editing.price).replace(".", ","), category: editing.category ?? "", photos: editing.photos.join("\n"),
      status: EDITABLE_STATUS.includes(editing.status as never) ? editing.status : "revisar",
    } : empty);
  }, [open, editing]);

  function pickProduct(id: string) {
    const p = products.data?.find((x) => x.id === id);
    if (!p) return setF({ ...f, product_id: "none" });
    setF({
      ...f, product_id: id, title: f.title || p.name.slice(0, 60), description: f.description || (p.description ?? ""),
      price: f.price || String(p.sale_price).replace(".", ","), category: f.category || (p.category ?? ""),
      photos: f.photos || (p.image_url ?? ""),
    });
  }

  const invalidate = () => ["listings", "activities"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
  const save = useMutation({
    mutationFn: async () => {
      const p = schema.safeParse({
        ...f, price: f.price.trim() ? parseMoney(f.price) ?? NaN : 0,
        photos: f.photos.split(/\n+/).map((s) => s.trim()).filter(Boolean),
      });
      if (!p.success) throw new Error(p.error.issues[0].message);
      const row = { ...p.data, description: p.data.description || null, category: p.data.category || null, product_id: f.product_id === "none" ? null : f.product_id };
      const { error } = editing ? await supabase.from("listings").update(row).eq("id", editing.id) : await supabase.from("listings").insert(row);
      if (error) throw error;
    },
    onSuccess: () => { toast.success(editing ? "Anúncio atualizado" : "Rascunho criado"); invalidate(); setOpen(false); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("listings").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Anúncio excluído"); invalidate(); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const openNew = () => { setEditing(null); setOpen(true); };

  return (
    <>
      <PageHeader title="Anúncios" description="Prepare anúncios a partir do seu catálogo." actions={<Button onClick={openNew}><Plus className="mr-1 h-4 w-4" />Novo anúncio</Button>} />
      <div className="mb-6 flex gap-3 rounded-xl border bg-secondary p-4 text-sm">
        <Info className="h-5 w-5 shrink-0 text-primary" />
        <p>A publicação no Mercado Livre ainda não está conectada. Os anúncios ficam salvos como rascunho ou prontos para revisar. Os status “Publicado” e “Com erro”, o identificador e o link serão preenchidos automaticamente quando a integração oficial for ativada.</p>
      </div>
      {listings.isLoading ? <Loading /> : !listings.data?.length ? (
        <EmptyState icon={Megaphone} title="Nenhum anúncio preparado" description="Crie um rascunho a partir de um produto do catálogo." action={<Button onClick={openNew}>Criar rascunho</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {listings.data.map((l) => (
            <Card key={l.id} className="shadow-card">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 font-semibold">{l.title}</h3>
                  <StatusBadge value={l.status} label={LISTING_STATUS_LABEL[l.status]} />
                </div>
                <p className="font-display text-xl font-bold">{brl(Number(l.price))}</p>
                <p className="text-xs text-muted-foreground">{l.category || "Sem categoria"} · {l.photos.length} foto(s)</p>
                <div className="rounded-md bg-muted/60 p-2 text-xs text-muted-foreground">
                  ID Mercado Livre: {l.external_id ?? "—"}<br />
                  Link: {l.external_url ? <a href={l.external_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">abrir</a> : "—"}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditing(l); setOpen(true); }}><Pencil className="mr-1 h-3.5 w-3.5" />Editar</Button>
                  <Button size="sm" variant="outline" onClick={() => setToDelete(l)} aria-label="Excluir"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Editar anúncio" : "Novo anúncio"}</DialogTitle></DialogHeader>
          <form id="listing-form" onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="grid gap-4 sm:grid-cols-2">
            <Field label="Produto do catálogo" className="sm:col-span-2">
              <Select value={f.product_id} onValueChange={pickProduct}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {products.data?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={`Título * (${f.title.length}/60)`} className="sm:col-span-2"><Input value={f.title} maxLength={60} onChange={(e) => setF({ ...f, title: e.target.value })} required /></Field>
            <Field label="Descrição" className="sm:col-span-2"><Textarea rows={4} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
            <Field label="Preço (R$)"><Input inputMode="decimal" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></Field>
            <Field label="Categoria do anúncio"><Input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /></Field>
            <Field label="Fotos (uma URL por linha)" className="sm:col-span-2"><Textarea rows={3} value={f.photos} onChange={(e) => setF({ ...f, photos: e.target.value })} placeholder="https://..." /></Field>
            <Field label="Status">
              <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EDITABLE_STATUS.map((s) => <SelectItem key={s} value={s}>{LISTING_STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" form="listing-form" disabled={save.isPending}>{save.isPending ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDelete open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} title={`"${toDelete?.title}"`} onConfirm={() => toDelete && del.mutate(toDelete.id)} />
    </>
  );
}

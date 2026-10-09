import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { suppliersQuery, errMsg, type Product } from "@/lib/queries";
import { parseMoney } from "@/lib/csv";

const url = z.string().trim().url("URL inválida").max(1000).or(z.literal(""));
const schema = z.object({
  name: z.string().trim().min(1, "Informe o nome").max(200),
  description: z.string().max(5000),
  image_url: url,
  category: z.string().trim().max(100),
  supplier_id: z.string(),
  supplier_url: url,
  sku: z.string().trim().max(100),
  cost_price: z.number({ message: "Custo inválido" }).min(0, "Custo não pode ser negativo"),
  sale_price: z.number({ message: "Preço inválido" }).min(0, "Preço não pode ser negativo"),
  stock: z.number().int("Estoque deve ser inteiro").min(0).nullable(),
  availability: z.enum(["disponivel", "indisponivel", "desconhecido"]),
  notes: z.string().max(5000),
});

const empty = { name: "", description: "", image_url: "", category: "", supplier_id: "none", supplier_url: "", sku: "", cost: "", price: "", stock: "", availability: "disponivel", notes: "" };

export function ProductForm({ open, onOpenChange, product }: { open: boolean; onOpenChange: (o: boolean) => void; product: Product | null }) {
  const qc = useQueryClient();
  const suppliers = useQuery(suppliersQuery);
  const [f, setF] = useState(empty);

  useEffect(() => {
    if (!open) return;
    setF(product ? {
      name: product.name, description: product.description ?? "", image_url: product.image_url ?? "",
      category: product.category ?? "", supplier_id: product.supplier_id ?? "none", supplier_url: product.supplier_url ?? "",
      sku: product.sku ?? "", cost: String(product.cost_price).replace(".", ","), price: String(product.sale_price).replace(".", ","),
      stock: product.stock?.toString() ?? "", availability: product.availability, notes: product.notes ?? "",
    } : empty);
  }, [open, product]);

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({
        ...f,
        cost_price: f.cost.trim() ? parseMoney(f.cost) ?? NaN : 0,
        sale_price: f.price.trim() ? parseMoney(f.price) ?? NaN : 0,
        stock: f.stock.trim() ? Number(f.stock) : null,
      });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      const d = parsed.data;
      const row = {
        name: d.name, description: d.description || null, image_url: d.image_url || null, category: d.category || null,
        supplier_id: d.supplier_id === "none" ? null : d.supplier_id, supplier_url: d.supplier_url || null, sku: d.sku || null,
        cost_price: d.cost_price, sale_price: d.sale_price, stock: d.stock, availability: d.availability, notes: d.notes || null,
      };
      const { error } = product
        ? await supabase.from("products").update(row).eq("id", product.id)
        : await supabase.from("products").insert(row);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(product ? "Produto atualizado" : "Produto cadastrado");
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["activities"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{product ? "Editar produto" : "Novo produto"}</DialogTitle></DialogHeader>
        <form id="product-form" onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome *" className="sm:col-span-2"><Input value={f.name} onChange={set("name")} required maxLength={200} /></Field>
          <Field label="Descrição" className="sm:col-span-2"><Textarea value={f.description} onChange={set("description")} rows={3} /></Field>
          <Field label="URL da imagem"><Input value={f.image_url} onChange={set("image_url")} placeholder="https://..." /></Field>
          <Field label="Categoria"><Input value={f.category} onChange={set("category")} /></Field>
          <Field label="Fornecedor">
            <Select value={f.supplier_id} onValueChange={(v) => setF({ ...f, supplier_id: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem fornecedor</SelectItem>
                {suppliers.data?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Link do produto no fornecedor"><Input value={f.supplier_url} onChange={set("supplier_url")} placeholder="https://..." /></Field>
          <Field label="Código / SKU"><Input value={f.sku} onChange={set("sku")} /></Field>
          <Field label="Disponibilidade no fornecedor">
            <Select value={f.availability} onValueChange={(v) => setF({ ...f, availability: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="disponivel">Disponível</SelectItem>
                <SelectItem value="indisponivel">Indisponível</SelectItem>
                <SelectItem value="desconhecido">Desconhecido</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Custo de compra (R$)"><Input inputMode="decimal" value={f.cost} onChange={set("cost")} placeholder="0,00" /></Field>
          <Field label="Preço de venda pretendido (R$)"><Input inputMode="decimal" value={f.price} onChange={set("price")} placeholder="0,00" /></Field>
          <Field label="Estoque (se conhecido)"><Input inputMode="numeric" value={f.stock} onChange={set("stock")} /></Field>
          <Field label="Observações" className="sm:col-span-2"><Textarea value={f.notes} onChange={set("notes")} rows={2} /></Field>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit" form="product-form" disabled={save.isPending}>{save.isPending ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`space-y-1.5 ${className ?? ""}`}><Label>{label}</Label>{children}</div>;
}

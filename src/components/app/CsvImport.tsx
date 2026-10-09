import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CSV_HEADERS, parseCsv, validateRows, type ImportRow } from "@/lib/csv";
import { suppliersQuery, errMsg } from "@/lib/queries";
import { brl } from "@/lib/profit";

export function CsvImport({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const suppliers = useQuery(suppliersQuery);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [headerError, setHeaderError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const supplierByName = new Map((suppliers.data ?? []).map((s) => [s.name.trim().toLowerCase(), s.id]));
  const withSupplierWarnings = rows.map((r) => ({
    ...r,
    warning: r.data.supplier_name && !supplierByName.has(r.data.supplier_name.toLowerCase())
      ? `Fornecedor "${r.data.supplier_name}" não cadastrado — produto ficará sem fornecedor`
      : undefined,
  }));
  const valid = rows.filter((r) => r.errors.length === 0);
  const invalid = rows.length - valid.length;

  async function onFile(file: File) {
    if (file.size > 2_000_000) return toast.error("Arquivo maior que 2 MB");
    const text = await file.text();
    const res = validateRows(parseCsv(text));
    setHeaderError(res.headerError);
    setRows(res.rows);
  }

  function template() {
    const blob = new Blob(["\uFEFF" + CSV_HEADERS.join(";") + "\n"], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "modelo-produtos-hipolito.csv";
    a.click();
  }

  async function save() {
    if (!valid.length) return;
    setSaving(true);
    const payload = valid.map(({ data: { supplier_name, ...d } }) => ({
      ...d,
      supplier_id: supplier_name ? supplierByName.get(supplier_name.toLowerCase()) ?? null : null,
    }));
    const { error } = await supabase.from("products").insert(payload);
    setSaving(false);
    if (error) return toast.error(errMsg(error));
    toast.success(`${payload.length} produto(s) importado(s)`);
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["activities"] });
    setRows([]);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setRows([]); setHeaderError(undefined); } onOpenChange(o); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Importar produtos por CSV</DialogTitle>
          <DialogDescription>
            Use o modelo (separador ; ou ,). Coluna obrigatória: <strong>nome</strong>. Valores aceitam formato 1.234,56.
            Disponibilidade: disponivel, indisponivel ou desconhecido. O fornecedor é associado pelo nome cadastrado.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={template}><Download className="mr-1 h-4 w-4" />Baixar modelo</Button>
          <Input type="file" accept=".csv,text/csv" className="max-w-xs" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        </div>
        {headerError && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{headerError}</p>}
        {rows.length > 0 && (
          <>
            <p className="text-sm">
              <strong>{valid.length}</strong> linha(s) válida(s) · <strong className={invalid ? "text-destructive" : ""}>{invalid}</strong> com erro (não serão importadas)
            </p>
            <div className="max-h-80 overflow-auto rounded-md border text-sm">
              <table className="w-full">
                <thead className="sticky top-0 bg-muted text-left"><tr><th className="p-2">Linha</th><th className="p-2">Nome</th><th className="p-2">Custo</th><th className="p-2">Preço</th><th className="p-2">Situação</th></tr></thead>
                <tbody>
                  {withSupplierWarnings.map((r) => (
                    <tr key={r.line} className="border-t align-top">
                      <td className="p-2">{r.line}</td>
                      <td className="p-2">{r.data.name || "—"}</td>
                      <td className="p-2">{brl(r.data.cost_price)}</td>
                      <td className="p-2">{brl(r.data.sale_price)}</td>
                      <td className="p-2">
                        {r.errors.length ? <span className="text-destructive">{r.errors.join("; ")}</span> : <span className="text-success">OK</span>}
                        {r.warning && <div className="text-xs text-warning-foreground">{r.warning}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={!valid.length || saving}><Upload className="mr-1 h-4 w-4" />{saving ? "Importando..." : `Importar ${valid.length} produto(s)`}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

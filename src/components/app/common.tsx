import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-16 text-center">
      <div className="rounded-full bg-secondary p-4"><Icon className="h-7 w-7 text-primary" /></div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Loading({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" /> {label}
    </div>
  );
}

const tone: Record<string, string> = {
  disponivel: "bg-success/15 text-success border-success/30",
  ativo: "bg-success/15 text-success border-success/30",
  publicado: "bg-success/15 text-success border-success/30",
  indisponivel: "bg-destructive/10 text-destructive border-destructive/30",
  inativo: "bg-muted text-muted-foreground",
  erro: "bg-destructive/10 text-destructive border-destructive/30",
  em_avaliacao: "bg-warning/20 text-warning-foreground border-warning/40",
  revisar: "bg-warning/20 text-warning-foreground border-warning/40",
  desconhecido: "bg-muted text-muted-foreground",
  rascunho: "bg-secondary text-secondary-foreground",
};

export function StatusBadge({ value, label }: { value: string; label?: string }) {
  return <Badge variant="outline" className={cn("font-medium", tone[value])}>{label ?? value}</Badge>;
}

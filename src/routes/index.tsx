import { createFileRoute, Link } from "@tanstack/react-router";
import { Boxes, Calculator, Truck, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HipólitoLogística — Produtos, fornecedores e lucro" },
      { name: "description", content: "Organize produtos de fornecedores, calcule seu lucro e prepare anúncios para o Mercado Livre." },
      { property: "og:title", content: "HipólitoLogística — Produtos, fornecedores e lucro" },
      { property: "og:description", content: "Organize produtos de fornecedores, calcule seu lucro e prepare anúncios para o Mercado Livre." },
    ],
  }),
  component: Index,
});

const features = [
  { icon: Boxes, t: "Catálogo de produtos", d: "Cadastre manualmente ou importe por CSV com validação." },
  { icon: Truck, t: "Fornecedores", d: "Contatos, catálogos e status em um só lugar." },
  { icon: Calculator, t: "Calculadora de lucro", d: "Tarifas, frete e impostos configuráveis." },
  { icon: Megaphone, t: "Anúncios", d: "Prepare rascunhos para o Mercado Livre." },
];

function Index() {
  return (
    <div className="min-h-screen bg-hero text-sidebar-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-display text-xl font-bold text-sidebar-accent-foreground">
          Hipólito<span className="text-sidebar-primary">Logística</span>
        </span>
        <Button asChild variant="secondary"><Link to="/auth">Entrar</Link></Button>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-20 pt-12 md:pt-24">
        <h1 className="max-w-3xl text-4xl font-bold leading-tight text-sidebar-accent-foreground md:text-6xl">
          Seus fornecedores, produtos e lucro <span className="text-sidebar-primary">organizados</span>.
        </h1>
        <p className="mt-6 max-w-xl text-lg">
          Plataforma para vendedores do Mercado Livre encontrarem, organizarem e controlarem produtos antes de anunciar.
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild size="lg" className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90">
            <Link to="/auth">Criar conta grátis</Link>
          </Button>
        </div>
        <div className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.t} className="rounded-xl border border-sidebar-border bg-sidebar-accent/60 p-5">
              <f.icon className="h-6 w-6 text-sidebar-primary" />
              <h3 className="mt-3 font-semibold text-sidebar-accent-foreground">{f.t}</h3>
              <p className="mt-1 text-sm">{f.d}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

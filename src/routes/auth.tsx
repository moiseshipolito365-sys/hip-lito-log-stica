import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — HipólitoLogística" },
      { name: "description", content: "Acesse sua conta HipólitoLogística." },
      { property: "og:title", content: "Entrar — HipólitoLogística" },
      { property: "og:description", content: "Acesse sua conta HipólitoLogística." },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/painel", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) return void toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
    setLoading(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword(parsed.data);
      setLoading(false);
      if (error) return void toast.error(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos" : error.message);
      navigate({ to: "/painel", replace: true });
    } else {
      const { error } = await supabase.auth.signUp({ ...parsed.data, options: { emailRedirectTo: window.location.origin + "/painel" } });
      setLoading(false);
      if (error) return void toast.error(error.message);
      toast.success("Conta criada! Confira seu e-mail para confirmar o cadastro.");
      setMode("login");
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (result.error) return void toast.error("Não foi possível entrar com Google");
    if (result.redirected) return;
    navigate({ to: "/painel", replace: true });
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden bg-hero p-12 md:flex md:flex-col md:justify-between">
        <Link to="/" className="font-display text-xl font-bold text-sidebar-accent-foreground">
          Hipólito<span className="text-sidebar-primary">Logística</span>
        </Link>
        <p className="max-w-sm text-2xl font-display text-sidebar-accent-foreground">
          Controle cada produto, cada fornecedor e cada centavo de lucro.
        </p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{mode === "login" ? "Entrar" : "Criar conta"}</h1>
            <p className="text-sm text-muted-foreground">Acesse seu painel HipólitoLogística.</p>
          </div>
          <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>
          </Tabs>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button className="w-full" disabled={loading}>{loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}</Button>
          </form>
          <div className="relative text-center text-xs text-muted-foreground"><span className="bg-background px-2">ou</span></div>
          <Button variant="outline" className="w-full" onClick={google}>Continuar com Google</Button>
        </div>
      </div>
    </div>
  );
}

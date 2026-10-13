import { createFileRoute } from "@tanstack/react-router";

// Retorno OAuth do Mercado Livre. Rota pública: a segurança vem do "state" de uso único
// (vinculado ao usuário que iniciou o fluxo, válido por 10 minutos) + PKCE.
export const Route = createFileRoute("/api/public/mercadolivre/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const back = (status: string, msg?: string) => {
          const to = new URL("/configuracoes", url.origin);
          to.searchParams.set("ml", status);
          if (msg) to.searchParams.set("msg", msg.slice(0, 200));
          return Response.redirect(to.toString(), 302);
        };
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        if (url.searchParams.get("error")) return back("erro", "Autorização negada no Mercado Livre.");
        if (!code || !state || state.length > 200) return back("erro", "Retorno de autorização inválido.");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { mlConfig, tokenRequest, saveTokens, ML_API } = await import("@/lib/mercadolivre.server");

        const { data: st } = await supabaseAdmin.from("ml_oauth_states").select("*").eq("state", state).maybeSingle();
        if (!st) return back("erro", "Autorização expirada ou já utilizada. Tente conectar novamente.");
        await supabaseAdmin.from("ml_oauth_states").delete().eq("state", state);
        if (Date.now() - new Date(st.created_at).getTime() > 10 * 60 * 1000) return back("erro", "Autorização expirada. Tente novamente.");

        const cfg = mlConfig();
        if (!cfg.clientId || !cfg.clientSecret) return back("erro", "Credenciais do aplicativo não configuradas.");
        try {
          const t = await tokenRequest({
            grant_type: "authorization_code", client_id: cfg.clientId, client_secret: cfg.clientSecret,
            code, redirect_uri: st.redirect_uri, code_verifier: st.code_verifier,
          });
          const meRes = await fetch(`${ML_API}/users/me`, { headers: { authorization: `Bearer ${t.access_token}` } });
          if (!meRes.ok) throw new Error(`Falha ao ler a conta autorizada [${meRes.status}]`);
          const me = (await meRes.json()) as { id: number; nickname?: string; email?: string; site_id?: string };
          const { error } = await supabaseAdmin.from("ml_connections").upsert({
            user_id: st.user_id, ml_user_id: me.id, nickname: me.nickname ?? null, email: me.email ?? null,
            site_id: me.site_id ?? null, status: "conectada", last_error: null, connected_at: new Date().toISOString(),
          });
          if (error) throw new Error("Falha ao salvar a conexão");
          await saveTokens(st.user_id, t);
          return back("ok");
        } catch (e) {
          console.error("ML callback falhou:", e instanceof Error ? e.message : "erro");
          return back("erro", e instanceof Error ? e.message : "Falha na autorização");
        }
      },
    },
  },
});

import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Diz se o app tem as credenciais do Mercado Livre configuradas (sem revelar valores). */
export const getMlSetup = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { mlConfig } = await import("./mercadolivre.server");
    const origin = new URL(getRequest().url).origin;
    const cfg = mlConfig(origin);
    return { missing: cfg.missing, redirectUri: cfg.redirectUri ?? null };
  });

export const startMlAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { mlConfig, randomToken, pkceChallenge, ML_AUTH_URL } = await import("./mercadolivre.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cfg = mlConfig(new URL(getRequest().url).origin);
    if (cfg.missing.length) throw new Error(`Configuração ausente: ${cfg.missing.join(", ")}`);
    const state = randomToken();
    const verifier = randomToken(48);
    // limpa estados antigos do usuário
    await supabaseAdmin.from("ml_oauth_states").delete().eq("user_id", context.userId);
    const { error } = await supabaseAdmin.from("ml_oauth_states").insert({ state, user_id: context.userId, code_verifier: verifier, redirect_uri: cfg.redirectUri! });
    if (error) throw new Error("Não foi possível iniciar a autorização");
    const url = new URL(ML_AUTH_URL);
    url.search = new URLSearchParams({
      response_type: "code", client_id: cfg.clientId!, redirect_uri: cfg.redirectUri!, state,
      code_challenge: await pkceChallenge(verifier), code_challenge_method: "S256",
    }).toString();
    return { url: url.toString() };
  });

export const disconnectMl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("ml_items").delete().eq("user_id", context.userId);
    const { error } = await supabaseAdmin.from("ml_connections").delete().eq("user_id", context.userId); // tokens apagados em cascata
    if (error) throw new Error("Não foi possível desconectar");
    return { ok: true };
  });

type ItemsSearch = { results: string[]; paging: { total: number; offset: number; limit: number } };
type ItemBody = { id: string; title: string; price: number | null; currency_id: string | null; status: string | null; available_quantity: number | null; sold_quantity: number | null; permalink: string | null; thumbnail: string | null; category_id: string | null; listing_type_id: string | null };

export const syncMlItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { mlGet, markError } = await import("./mercadolivre.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: conn } = await supabaseAdmin.from("ml_connections").select("ml_user_id").eq("user_id", context.userId).maybeSingle();
    if (!conn) throw new Error("Conta do Mercado Livre não conectada");
    try {
      const ids: string[] = [];
      let offset = 0;
      let total = 0;
      // A API limita a paginação por offset a 1000 itens; acima disso seria necessário search_type=scan.
      do {
        const page = await mlGet<ItemsSearch>(context.userId, `/users/${conn.ml_user_id}/items/search?limit=50&offset=${offset}`);
        ids.push(...page.results);
        total = page.paging.total;
        offset += page.paging.limit || 50;
      } while (offset < total && offset < 1000);

      const now = new Date().toISOString();
      for (let i = 0; i < ids.length; i += 20) {
        const chunk = ids.slice(i, i + 20);
        const res = await mlGet<{ code: number; body: ItemBody }[]>(context.userId, `/items?ids=${chunk.join(",")}&attributes=id,title,price,currency_id,status,available_quantity,sold_quantity,permalink,thumbnail,category_id,listing_type_id`);
        const rows = res.filter((r) => r.code === 200 && r.body?.id).map(({ body: b }) => ({
          user_id: context.userId, ml_item_id: b.id, title: b.title, price: b.price, currency_id: b.currency_id, status: b.status,
          available_quantity: b.available_quantity, sold_quantity: b.sold_quantity, permalink: b.permalink, thumbnail: b.thumbnail,
          category_id: b.category_id, listing_type_id: b.listing_type_id, synced_at: now,
        }));
        if (rows.length) {
          const { error } = await supabaseAdmin.from("ml_items").upsert(rows, { onConflict: "user_id,ml_item_id" });
          if (error) throw new Error("Falha ao salvar anúncios sincronizados");
        }
      }
      // remove anúncios que não existem mais na conta
      if (ids.length && total <= 1000) {
        await supabaseAdmin.from("ml_items").delete().eq("user_id", context.userId).lt("synced_at", now);
      } else if (!ids.length) {
        await supabaseAdmin.from("ml_items").delete().eq("user_id", context.userId);
      }
      await supabaseAdmin.from("ml_connections").update({ status: "conectada", last_error: null, last_sync_at: now, items_count: total }).eq("user_id", context.userId);
      return { synced: ids.length, total };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro na sincronização";
      if (!msg.includes("[401]") && !msg.includes("expirou")) await markError(context.userId, "erro", msg);
      throw new Error(msg);
    }
  });

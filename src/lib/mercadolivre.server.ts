// Somente servidor. Nunca importar em componentes.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const ML_API = "https://api.mercadolibre.com";
export const ML_AUTH_URL = "https://auth.mercadolivre.com.br/authorization";
export const CALLBACK_PATH = "/api/public/mercadolivre/callback";

export function mlConfig(origin?: string) {
  const clientId = process.env['ML_CLIENT_ID'];
  const clientSecret = process.env['ML_CLIENT_SECRET'];
  const redirectUri = process.env['ML_REDIRECT_URI'] || (origin ? origin + CALLBACK_PATH : undefined);
  const missing = [!clientId && "ML_CLIENT_ID", !clientSecret && "ML_CLIENT_SECRET", !redirectUri && "ML_REDIRECT_URI"].filter(Boolean) as string[];
  return { clientId, clientSecret, redirectUri, missing };
}

const b64url = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export function randomToken(bytes = 32) {
  return b64url(crypto.getRandomValues(new Uint8Array(bytes)));
}
export async function pkceChallenge(verifier: string) {
  return b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
}

type TokenResponse = { access_token: string; refresh_token: string; expires_in: number; user_id: number };

export async function tokenRequest(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(`${ML_API}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body: new URLSearchParams(body),
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = text.slice(0, 300);
    try { const j = JSON.parse(text); msg = j.message || j.error || msg; } catch { /* resposta não-JSON */ }
    throw new Error(`Mercado Livre recusou a autorização [${res.status}]: ${msg}`);
  }
  return JSON.parse(text) as TokenResponse;
}

export async function saveTokens(userId: string, t: TokenResponse) {
  const { error } = await supabaseAdmin.from("ml_tokens").upsert({
    user_id: userId,
    access_token: t.access_token,
    refresh_token: t.refresh_token,
    expires_at: new Date(Date.now() + (t.expires_in - 120) * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error("Falha ao salvar tokens");
}

async function markError(userId: string, status: "erro" | "reconectar", message: string) {
  await supabaseAdmin.from("ml_connections").update({ status, last_error: message }).eq("user_id", userId);
}

/** Retorna um access token válido, renovando com o refresh token quando expirado. */
export async function getAccessToken(userId: string): Promise<string> {
  const { data } = await supabaseAdmin.from("ml_tokens").select("*").eq("user_id", userId).maybeSingle();
  if (!data) throw new Error("Conta do Mercado Livre não conectada");
  if (new Date(data.expires_at).getTime() > Date.now()) return data.access_token;
  const cfg = mlConfig();
  if (!cfg.clientId || !cfg.clientSecret) throw new Error("Credenciais do aplicativo Mercado Livre não configuradas");
  try {
    const t = await tokenRequest({ grant_type: "refresh_token", client_id: cfg.clientId, client_secret: cfg.clientSecret, refresh_token: data.refresh_token });
    await saveTokens(userId, t); // o refresh token do ML é de uso único: sempre gravar o novo
    return t.access_token;
  } catch (e) {
    await markError(userId, "reconectar", "A autorização expirou ou foi revogada. Conecte a conta novamente.");
    throw e;
  }
}

export async function mlGet<T>(userId: string, path: string, attempt = 0): Promise<T> {
  const token = await getAccessToken(userId);
  const res = await fetch(`${ML_API}${path}`, { headers: { authorization: `Bearer ${token}`, accept: "application/json" } });
  if (res.status === 429 && attempt < 3) {
    await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    return mlGet<T>(userId, path, attempt + 1);
  }
  if (res.status === 401) {
    await markError(userId, "reconectar", "Token recusado pelo Mercado Livre. Conecte a conta novamente.");
    throw new Error("Token recusado pelo Mercado Livre [401]");
  }
  if (!res.ok) throw new Error(`Erro da API do Mercado Livre em ${path.split("?")[0]} [${res.status}]: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as T;
}

export { markError };

import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Supplier = Database["public"]["Tables"]["suppliers"]["Row"];
export type Listing = Database["public"]["Tables"]["listings"]["Row"];
export type CostSettings = Database["public"]["Tables"]["cost_settings"]["Row"];
export type Activity = Database["public"]["Tables"]["activities"]["Row"];

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async () => {
    const { data, error } = await supabase.from("products").select("*").order("updated_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const suppliersQuery = queryOptions({
  queryKey: ["suppliers"],
  queryFn: async () => {
    const { data, error } = await supabase.from("suppliers").select("*").order("name");
    if (error) throw error;
    return data;
  },
});

export const listingsQuery = queryOptions({
  queryKey: ["listings"],
  queryFn: async () => {
    const { data, error } = await supabase.from("listings").select("*").order("updated_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const activitiesQuery = queryOptions({
  queryKey: ["activities"],
  queryFn: async () => {
    const { data, error } = await supabase.from("activities").select("*").order("created_at", { ascending: false }).limit(10);
    if (error) throw error;
    return data;
  },
});

export const settingsQuery = queryOptions({
  queryKey: ["cost_settings"],
  queryFn: async () => {
    const { data, error } = await supabase.from("cost_settings").select("*").maybeSingle();
    if (error) throw error;
    return data;
  },
});

export const AVAILABILITY_LABEL: Record<string, string> = {
  disponivel: "Disponível",
  indisponivel: "Indisponível",
  desconhecido: "Desconhecido",
};
export const SUPPLIER_STATUS_LABEL: Record<string, string> = {
  ativo: "Ativo",
  em_avaliacao: "Em avaliação",
  inativo: "Inativo",
};
export const LISTING_STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  revisar: "Pronto para revisar",
  publicado: "Publicado",
  erro: "Com erro",
};

export function errMsg(e: unknown) {
  if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
  return "Erro inesperado";
}

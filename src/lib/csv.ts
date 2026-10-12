export const CSV_HEADERS = [
  "nome",
  "descricao",
  "imagem_url",
  "categoria",
  "fornecedor",
  "link_fornecedor",
  "sku",
  "custo",
  "preco_venda",
  "estoque",
  "disponibilidade",
  "observacoes",
] as const;

export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, "");
  const firstLine = clean.split(/\r?\n/)[0] ?? "";
  const sep = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (inQ) {
      if (c === '"') {
        if (clean[i + 1] === '"') { cur += '"'; i++; } else inQ = false;
      } else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === sep) { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && clean[i + 1] === "\n") i++;
      row.push(cur); cur = "";
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
    } else cur += c;
  }
  row.push(cur);
  if (row.some((x) => x.trim() !== "")) rows.push(row);
  return rows;
}

/** Aceita "1.234,56", "1234,56" e "1234.56". */
export function parseMoney(raw: string): number | null {
  const s = raw.trim().replace(/R\$\s?/i, "");
  if (!s) return null;
  const normalized = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  const v = Number(normalized);
  return Number.isFinite(v) ? v : null;
}

export type ImportRow = {
  line: number;
  data: {
    name: string;
    description: string | null;
    image_url: string | null;
    category: string | null;
    supplier_name: string | null;
    supplier_url: string | null;
    sku: string | null;
    cost_price: number;
    sale_price: number;
    stock: number | null;
    availability: "disponivel" | "indisponivel" | "desconhecido";
    notes: string | null;
  };
  errors: string[];
};

const AVAIL: Record<string, ImportRow["data"]["availability"]> = {
  disponivel: "disponivel", "disponível": "disponivel", sim: "disponivel",
  indisponivel: "indisponivel", "indisponível": "indisponivel", nao: "indisponivel", "não": "indisponivel",
  desconhecido: "desconhecido", "": "desconhecido",
};

const isUrl = (s: string) => /^https?:\/\/\S+$/i.test(s);

export function validateRows(rows: string[][]): { rows: ImportRow[]; headerError?: string } {
  if (rows.length === 0) return { rows: [], headerError: "Arquivo vazio." };
  const header = (rows[0] ?? []).map((h) => h.trim().toLowerCase());
  if (!header.includes("nome")) return { rows: [], headerError: 'Coluna obrigatória "nome" não encontrada no cabeçalho.' };
  const idx = (k: string) => header.indexOf(k);
  const get = (r: string[], k: string) => (idx(k) >= 0 ? (r[idx(k)] ?? "").trim() : "");

  return {
    rows: rows.slice(1).map((r, i) => {
      const errors: string[] = [];
      const name = get(r, "nome");
      if (!name) errors.push("Nome é obrigatório");
      if (name.length > 200) errors.push("Nome com mais de 200 caracteres");
      const costRaw = get(r, "custo");
      const cost = costRaw ? parseMoney(costRaw) : 0;
      if (cost === null || cost < 0) errors.push(`Custo inválido: "${costRaw}"`);
      const priceRaw = get(r, "preco_venda");
      const price = priceRaw ? parseMoney(priceRaw) : 0;
      if (price === null || price < 0) errors.push(`Preço de venda inválido: "${priceRaw}"`);
      const stockRaw = get(r, "estoque");
      let stock: number | null = null;
      if (stockRaw) {
        const s = Number(stockRaw);
        if (!Number.isInteger(s) || s < 0) errors.push(`Estoque inválido: "${stockRaw}"`);
        else stock = s;
      }
      const availRaw = get(r, "disponibilidade").toLowerCase();
      const availability = AVAIL[availRaw];
      if (!availability) errors.push(`Disponibilidade inválida: "${availRaw}" (use disponivel, indisponivel ou desconhecido)`);
      const image = get(r, "imagem_url");
      if (image && !isUrl(image)) errors.push("URL da imagem inválida");
      const link = get(r, "link_fornecedor");
      if (link && !isUrl(link)) errors.push("Link do fornecedor inválido");
      return {
        line: i + 2,
        errors,
        data: {
          name,
          description: get(r, "descricao") || null,
          image_url: image || null,
          category: get(r, "categoria") || null,
          supplier_name: get(r, "fornecedor") || null,
          supplier_url: link || null,
          sku: get(r, "sku") || null,
          cost_price: cost ?? 0,
          sale_price: price ?? 0,
          stock,
          availability: availability ?? "desconhecido",
          notes: get(r, "observacoes") || null,
        },
      };
    }),
  };
}

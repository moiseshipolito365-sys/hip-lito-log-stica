CREATE UNIQUE INDEX products_user_sku_uniq ON public.products(user_id, lower(sku)) WHERE sku IS NOT NULL AND sku <> '';

CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','mercadolivre')),
  external_id text,
  sold_at timestamptz NOT NULL DEFAULT now(),
  description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  unit_cost numeric(12,2) CHECK (unit_cost IS NULL OR unit_cost >= 0),
  marketplace_fees numeric(12,2) NOT NULL DEFAULT 0 CHECK (marketplace_fees >= 0),
  shipping_cost numeric(12,2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  packaging_cost numeric(12,2) NOT NULL DEFAULT 0 CHECK (packaging_cost >= 0),
  advertising_cost numeric(12,2) NOT NULL DEFAULT 0 CHECK (advertising_cost >= 0),
  other_costs numeric(12,2) NOT NULL DEFAULT 0 CHECK (other_costs >= 0),
  refunded_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (refunded_amount >= 0),
  payment_status text NOT NULL DEFAULT 'pendente' CHECK (payment_status IN ('pendente','liberado','cancelado','reembolsado')),
  released_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX sales_user_external_uniq ON public.sales(user_id, source, external_id) WHERE external_id IS NOT NULL;
CREATE INDEX sales_user_sold_idx ON public.sales(user_id, sold_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT ALL ON public.sales TO service_role;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sales" ON public.sales FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER sales_updated BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.bank_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  transferred_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'solicitada' CHECK (status IN ('solicitada','concluida','falhou')),
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','mercadopago')),
  external_id text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX transfers_user_external_uniq ON public.bank_transfers(user_id, source, external_id) WHERE external_id IS NOT NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_transfers TO authenticated;
GRANT ALL ON public.bank_transfers TO service_role;
ALTER TABLE public.bank_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own transfers" ON public.bank_transfers FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER transfers_updated BEFORE UPDATE ON public.bank_transfers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.log_activity() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; lbl text;
BEGIN
  IF TG_OP = 'DELETE' THEN r := OLD; ELSE r := NEW; END IF;
  lbl := CASE TG_TABLE_NAME
    WHEN 'listings' THEN r.title
    WHEN 'sales' THEN r.description
    WHEN 'bank_transfers' THEN 'R$ ' || r.amount::text
    ELSE r.name END;
  INSERT INTO public.activities(user_id, entity, action, label)
  VALUES (r.user_id, TG_TABLE_NAME, lower(TG_OP), lbl);
  RETURN r;
END; $$;
CREATE TRIGGER sales_log AFTER INSERT OR UPDATE OR DELETE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.log_activity();
CREATE TRIGGER transfers_log AFTER INSERT OR UPDATE OR DELETE ON public.bank_transfers FOR EACH ROW EXECUTE FUNCTION public.log_activity();
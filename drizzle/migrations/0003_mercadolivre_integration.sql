CREATE TABLE public.ml_connections (
  user_id uuid PRIMARY KEY,
  ml_user_id bigint NOT NULL,
  nickname text,
  email text,
  site_id text,
  status text NOT NULL DEFAULT 'conectada' CHECK (status IN ('conectada','erro','reconectar')),
  last_error text,
  last_sync_at timestamptz,
  items_count integer,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ml_connections TO authenticated;
GRANT ALL ON public.ml_connections TO service_role;
ALTER TABLE public.ml_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own ml connection" ON public.ml_connections FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER ml_connections_updated BEFORE UPDATE ON public.ml_connections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Tokens: somente o servidor acessa (sem grants para usuários).
CREATE TABLE public.ml_tokens (
  user_id uuid PRIMARY KEY REFERENCES public.ml_connections(user_id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ml_tokens TO service_role;
ALTER TABLE public.ml_tokens ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ml_oauth_states (
  state text PRIMARY KEY,
  user_id uuid NOT NULL,
  code_verifier text NOT NULL,
  redirect_uri text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ml_oauth_states TO service_role;
ALTER TABLE public.ml_oauth_states ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ml_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ml_item_id text NOT NULL,
  title text NOT NULL,
  price numeric(12,2),
  currency_id text,
  status text,
  available_quantity integer,
  sold_quantity integer,
  permalink text,
  thumbnail text,
  category_id text,
  listing_type_id text,
  synced_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, ml_item_id)
);
GRANT SELECT ON public.ml_items TO authenticated;
GRANT ALL ON public.ml_items TO service_role;
ALTER TABLE public.ml_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own ml items" ON public.ml_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
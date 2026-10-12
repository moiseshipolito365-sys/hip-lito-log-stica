CREATE OR REPLACE FUNCTION public.log_activity() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE j jsonb; lbl text;
BEGIN
  IF TG_OP = 'DELETE' THEN j := to_jsonb(OLD); ELSE j := to_jsonb(NEW); END IF;
  lbl := COALESCE(j->>'title', j->>'name', j->>'description', CASE WHEN j ? 'amount' THEN 'R$ ' || (j->>'amount') END);
  INSERT INTO public.activities(user_id, entity, action, label)
  VALUES ((j->>'user_id')::uuid, TG_TABLE_NAME, lower(TG_OP), lbl);
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.log_activity() FROM PUBLIC, anon, authenticated;
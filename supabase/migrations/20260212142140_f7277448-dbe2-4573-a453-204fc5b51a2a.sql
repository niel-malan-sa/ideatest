CREATE OR REPLACE FUNCTION public.is_idea_owner(p_idea_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.ideas WHERE id = p_idea_id AND user_id = auth.uid());
$$;
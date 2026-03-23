
-- Positioning strategies table
CREATE TABLE public.positioning_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  positioning_statement JSONB NOT NULL DEFAULT '{}'::jsonb,
  value_hierarchy JSONB NOT NULL DEFAULT '{}'::jsonb,
  competitive_positioning JSONB NOT NULL DEFAULT '{}'::jsonb,
  alternative_angles JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.positioning_strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own positioning" ON public.positioning_strategies FOR SELECT USING (is_idea_owner(idea_id));
CREATE POLICY "Users can create positioning" ON public.positioning_strategies FOR INSERT WITH CHECK (is_idea_owner(idea_id));
CREATE POLICY "Users can update own positioning" ON public.positioning_strategies FOR UPDATE USING (is_idea_owner(idea_id));
CREATE POLICY "Users can delete own positioning" ON public.positioning_strategies FOR DELETE USING (is_idea_owner(idea_id));

CREATE TRIGGER update_positioning_strategies_updated_at
  BEFORE UPDATE ON public.positioning_strategies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sales messages table
CREATE TABLE public.sales_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  elevator_pitch JSONB NOT NULL DEFAULT '{}'::jsonb,
  cold_email JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sales messages" ON public.sales_messages FOR SELECT USING (is_idea_owner(idea_id));
CREATE POLICY "Users can create sales messages" ON public.sales_messages FOR INSERT WITH CHECK (is_idea_owner(idea_id));
CREATE POLICY "Users can update own sales messages" ON public.sales_messages FOR UPDATE USING (is_idea_owner(idea_id));
CREATE POLICY "Users can delete own sales messages" ON public.sales_messages FOR DELETE USING (is_idea_owner(idea_id));

CREATE TRIGGER update_sales_messages_updated_at
  BEFORE UPDATE ON public.sales_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

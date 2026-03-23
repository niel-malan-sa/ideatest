
CREATE TABLE public.outcome_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  outcome_id UUID NOT NULL REFERENCES public.outcomes(id) ON DELETE CASCADE,
  respondent TEXT NOT NULL DEFAULT 'Unknown',
  importance NUMERIC NOT NULL,
  satisfaction NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.outcome_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create outcome scores" ON public.outcome_scores FOR INSERT TO authenticated WITH CHECK (public.is_idea_owner(idea_id));
CREATE POLICY "Users can view own outcome scores" ON public.outcome_scores FOR SELECT TO authenticated USING (public.is_idea_owner(idea_id));
CREATE POLICY "Users can update own outcome scores" ON public.outcome_scores FOR UPDATE TO authenticated USING (public.is_idea_owner(idea_id));
CREATE POLICY "Users can delete own outcome scores" ON public.outcome_scores FOR DELETE TO authenticated USING (public.is_idea_owner(idea_id));

-- Create interview_notes table for storing imported interview data
CREATE TABLE public.interview_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  respondent TEXT NOT NULL DEFAULT 'Unknown',
  source_file TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.interview_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies using is_idea_owner helper
CREATE POLICY "Users can view own interview notes"
  ON public.interview_notes FOR SELECT
  USING (is_idea_owner(idea_id));

CREATE POLICY "Users can create interview notes"
  ON public.interview_notes FOR INSERT
  WITH CHECK (is_idea_owner(idea_id));

CREATE POLICY "Users can update own interview notes"
  ON public.interview_notes FOR UPDATE
  USING (is_idea_owner(idea_id));

CREATE POLICY "Users can delete own interview notes"
  ON public.interview_notes FOR DELETE
  USING (is_idea_owner(idea_id));

-- Timestamp trigger
CREATE TRIGGER update_interview_notes_updated_at
  BEFORE UPDATE ON public.interview_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
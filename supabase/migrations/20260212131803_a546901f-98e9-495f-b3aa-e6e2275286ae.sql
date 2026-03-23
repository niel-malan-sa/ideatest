
-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  company TEXT,
  role TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ideas table
CREATE TABLE public.ideas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  target_audience TEXT,
  budget TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own ideas" ON public.ideas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create ideas" ON public.ideas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ideas" ON public.ideas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ideas" ON public.ideas FOR DELETE USING (auth.uid() = user_id);

-- Helper function (now ideas table exists)
CREATE OR REPLACE FUNCTION public.is_idea_owner(p_idea_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.ideas WHERE id = p_idea_id AND user_id = auth.uid());
$$;

-- Job frameworks table
CREATE TABLE public.job_frameworks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  job_executor TEXT,
  alternative_roles JSONB DEFAULT '[]'::jsonb,
  job_map_steps JSONB DEFAULT '[]'::jsonb,
  interview_questions JSONB DEFAULT '[]'::jsonb,
  survey_template JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.job_frameworks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own frameworks" ON public.job_frameworks FOR SELECT USING (public.is_idea_owner(idea_id));
CREATE POLICY "Users can create frameworks" ON public.job_frameworks FOR INSERT WITH CHECK (public.is_idea_owner(idea_id));
CREATE POLICY "Users can update own frameworks" ON public.job_frameworks FOR UPDATE USING (public.is_idea_owner(idea_id));
CREATE POLICY "Users can delete own frameworks" ON public.job_frameworks FOR DELETE USING (public.is_idea_owner(idea_id));

-- Outcomes table
CREATE TABLE public.outcomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  statement TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'functional',
  importance NUMERIC,
  satisfaction NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own outcomes" ON public.outcomes FOR SELECT USING (public.is_idea_owner(idea_id));
CREATE POLICY "Users can create outcomes" ON public.outcomes FOR INSERT WITH CHECK (public.is_idea_owner(idea_id));
CREATE POLICY "Users can update own outcomes" ON public.outcomes FOR UPDATE USING (public.is_idea_owner(idea_id));
CREATE POLICY "Users can delete own outcomes" ON public.outcomes FOR DELETE USING (public.is_idea_owner(idea_id));

-- Research data table
CREATE TABLE public.research_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  market_size TEXT,
  competitors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.research_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own research" ON public.research_data FOR SELECT USING (public.is_idea_owner(idea_id));
CREATE POLICY "Users can create research" ON public.research_data FOR INSERT WITH CHECK (public.is_idea_owner(idea_id));
CREATE POLICY "Users can update own research" ON public.research_data FOR UPDATE USING (public.is_idea_owner(idea_id));
CREATE POLICY "Users can delete own research" ON public.research_data FOR DELETE USING (public.is_idea_owner(idea_id));

-- Analyses table
CREATE TABLE public.analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  summary TEXT,
  recommendations JSONB DEFAULT '[]'::jsonb,
  go_no_go TEXT,
  market_potential TEXT,
  action_items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own analyses" ON public.analyses FOR SELECT USING (public.is_idea_owner(idea_id));
CREATE POLICY "Users can create analyses" ON public.analyses FOR INSERT WITH CHECK (public.is_idea_owner(idea_id));
CREATE POLICY "Users can update own analyses" ON public.analyses FOR UPDATE USING (public.is_idea_owner(idea_id));
CREATE POLICY "Users can delete own analyses" ON public.analyses FOR DELETE USING (public.is_idea_owner(idea_id));

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ideas_updated_at BEFORE UPDATE ON public.ideas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_job_frameworks_updated_at BEFORE UPDATE ON public.job_frameworks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_outcomes_updated_at BEFORE UPDATE ON public.outcomes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_research_data_updated_at BEFORE UPDATE ON public.research_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_analyses_updated_at BEFORE UPDATE ON public.analyses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

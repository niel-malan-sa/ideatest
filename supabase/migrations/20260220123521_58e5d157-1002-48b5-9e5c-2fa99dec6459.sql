-- Add industry and target_audience to profiles
ALTER TABLE public.profiles
ADD COLUMN industry text,
ADD COLUMN target_audience text;
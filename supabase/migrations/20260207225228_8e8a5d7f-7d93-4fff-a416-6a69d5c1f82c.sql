-- Create table to track user event interactions for personalization
CREATE TABLE public.user_event_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'like', 'claim')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id, interaction_type)
);

-- Create indexes for efficient querying
CREATE INDEX idx_user_event_interactions_user_id ON public.user_event_interactions(user_id);
CREATE INDEX idx_user_event_interactions_event_id ON public.user_event_interactions(event_id);
CREATE INDEX idx_user_event_interactions_type ON public.user_event_interactions(interaction_type);
CREATE INDEX idx_user_event_interactions_created_at ON public.user_event_interactions(created_at DESC);

-- Enable RLS
ALTER TABLE public.user_event_interactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own interactions
CREATE POLICY "Users can view own interactions"
ON public.user_event_interactions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own interactions
CREATE POLICY "Users can create own interactions"
ON public.user_event_interactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own interactions (e.g., unlike)
CREATE POLICY "Users can delete own interactions"
ON public.user_event_interactions
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all interactions for analytics
CREATE POLICY "Admins can view all interactions"
ON public.user_event_interactions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
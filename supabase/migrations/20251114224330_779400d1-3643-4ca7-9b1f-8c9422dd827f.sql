-- Create ticket_types table
CREATE TABLE public.ticket_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  tier_criteria JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ticket_types
CREATE POLICY "Anyone can view ticket types"
  ON public.ticket_types
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can create ticket types"
  ON public.ticket_types
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update ticket types"
  ON public.ticket_types
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ticket types"
  ON public.ticket_types
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_ticket_types_updated_at
  BEFORE UPDATE ON public.ticket_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
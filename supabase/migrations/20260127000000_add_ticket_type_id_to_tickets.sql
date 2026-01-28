-- Add ticket_type_id to tickets for admin assignments
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS ticket_type_id UUID REFERENCES public.ticket_types(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tickets_ticket_type_id
  ON public.tickets(ticket_type_id);

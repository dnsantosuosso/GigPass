-- Add savings tracking columns to ticket_claims
ALTER TABLE public.ticket_claims 
ADD COLUMN IF NOT EXISTS full_ticket_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS member_price_paid numeric DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.ticket_claims.full_ticket_price IS 'The full ticket price a non-member would pay at time of claim';
COMMENT ON COLUMN public.ticket_claims.member_price_paid IS 'The price the member actually paid (usually 0 for subscription members)';
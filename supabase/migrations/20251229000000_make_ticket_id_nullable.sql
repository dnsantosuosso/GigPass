-- Make ticket_id nullable in ticket_claims table
-- This allows claiming tickets based on event capacity without requiring PDF uploads
ALTER TABLE public.ticket_claims 
  ALTER COLUMN ticket_id DROP NOT NULL;

-- Update the policy to allow claims without ticket_id
DROP POLICY IF EXISTS "Members can create claims" ON public.ticket_claims;

CREATE POLICY "Members can create claims"
  ON public.ticket_claims FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND public.has_role(auth.uid(), 'member')
  );

-- Add policy to allow users to delete their own claims (for unclaiming)
CREATE POLICY "Users can delete own claims"
  ON public.ticket_claims FOR DELETE
  USING (auth.uid() = user_id);

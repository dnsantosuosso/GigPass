-- Create an RPC function to safely decrement claimed_count
CREATE OR REPLACE FUNCTION public.decrement_event_claimed_count(event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.events
  SET claimed_count = GREATEST(0, claimed_count - 1)
  WHERE id = event_id;
END;
$$;

-- Also add DELETE policy on ticket_claims for users to delete their own claims
CREATE POLICY "Users can delete their own claims"
ON public.ticket_claims
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
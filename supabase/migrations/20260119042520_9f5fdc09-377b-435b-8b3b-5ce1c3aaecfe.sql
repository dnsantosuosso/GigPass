-- Drop the overly permissive UPDATE policy on events
DROP POLICY IF EXISTS "Authenticated users can increment claimed count" ON public.events;

-- Create an RPC function to safely increment claimed_count
CREATE OR REPLACE FUNCTION public.increment_event_claimed_count(event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.events
  SET claimed_count = claimed_count + 1
  WHERE id = event_id;
END;
$$;
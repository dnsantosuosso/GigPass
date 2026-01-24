-- Update tickets SELECT policy to allow all authenticated users
DROP POLICY IF EXISTS "Members can view available tickets" ON public.tickets;

CREATE POLICY "Authenticated users can view available tickets"
ON public.tickets
FOR SELECT
TO authenticated
USING (true);
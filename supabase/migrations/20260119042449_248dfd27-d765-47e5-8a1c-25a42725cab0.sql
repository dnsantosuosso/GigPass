-- Fix ticket claiming RLS policies

-- Drop the overly restrictive INSERT policy on ticket_claims
DROP POLICY IF EXISTS "Members can create claims" ON public.ticket_claims;

-- Create a simpler policy that allows authenticated users to insert their own claims
CREATE POLICY "Users can create their own claims"
ON public.ticket_claims
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Drop the restrictive UPDATE policy on tickets
DROP POLICY IF EXISTS "Members can claim tickets" ON public.tickets;

-- Create a policy allowing authenticated users to claim unclaimed tickets
CREATE POLICY "Users can claim unclaimed tickets"
ON public.tickets
FOR UPDATE
TO authenticated
USING (is_claimed = false)
WITH CHECK (claimed_by = auth.uid());

-- Add policy for members to update claimed_count on events
CREATE POLICY "Authenticated users can increment claimed count"
ON public.events
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
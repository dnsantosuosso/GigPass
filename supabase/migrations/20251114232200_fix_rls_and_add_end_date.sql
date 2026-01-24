-- Add end_date to events table
ALTER TABLE events
ADD COLUMN end_date TIMESTAMPTZ;

-- Update existing events to have end_date = event_date + 1 day
UPDATE events
SET end_date = event_date + INTERVAL '1 day'
WHERE end_date IS NULL;

-- Add RLS policy for ticket_claims to allow authenticated users to insert their own claims
CREATE POLICY "Users can insert their own ticket claims"
ON ticket_claims
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add RLS policy for ticket_claims to allow users to view their own claims
CREATE POLICY "Users can view their own ticket claims"
ON ticket_claims
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Add comment
COMMENT ON COLUMN events.end_date IS 'End date/time of the event (when it finishes)';

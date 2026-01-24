-- Add event_image_url column to events table
ALTER TABLE events
ADD COLUMN event_image_url TEXT;

-- Add comment
COMMENT ON COLUMN events.event_image_url IS 'URL to the event cover image';

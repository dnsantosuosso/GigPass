-- Add city column to events table
ALTER TABLE public.events
ADD COLUMN city TEXT NOT NULL DEFAULT 'toronto';

-- Add index for city filtering
CREATE INDEX idx_events_city ON public.events(city);

-- Update existing events to have a default city
UPDATE public.events
SET city = 'toronto'
WHERE city IS NULL OR city = '';
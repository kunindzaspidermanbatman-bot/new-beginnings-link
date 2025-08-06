-- Fix the duration column - make it nullable with a sensible default
-- Gaming services typically are hourly, so default to "1 hour"
ALTER TABLE public.venue_services 
ALTER COLUMN duration SET DEFAULT '1 hour';
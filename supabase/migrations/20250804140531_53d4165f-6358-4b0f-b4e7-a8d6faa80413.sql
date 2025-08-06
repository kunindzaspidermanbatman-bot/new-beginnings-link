-- Add missing columns to venues table that the frontend expects
ALTER TABLE public.venues 
ADD COLUMN IF NOT EXISTS district text,
ADD COLUMN IF NOT EXISTS opening_time time,
ADD COLUMN IF NOT EXISTS closing_time time;

-- Also need to add missing columns to venue_services table for the services data
ALTER TABLE public.venue_services 
ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS service_games text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS guest_pricing_rules jsonb DEFAULT '[]';
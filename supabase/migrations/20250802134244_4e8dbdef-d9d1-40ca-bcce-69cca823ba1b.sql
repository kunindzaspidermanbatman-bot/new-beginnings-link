-- Add free_hour_discounts column to venue_services table to support new discount structure
ALTER TABLE public.venue_services 
ADD COLUMN IF NOT EXISTS free_hour_discounts jsonb DEFAULT '[]'::jsonb;
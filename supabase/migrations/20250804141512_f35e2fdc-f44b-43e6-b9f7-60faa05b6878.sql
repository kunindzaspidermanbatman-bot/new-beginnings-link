-- Add all missing discount columns to venue_services table
ALTER TABLE public.venue_services 
ADD COLUMN IF NOT EXISTS overall_discount_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS overall_discount_percent numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS free_hour_discounts jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS group_discounts jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS timeslot_discounts jsonb DEFAULT '[]'::jsonb;
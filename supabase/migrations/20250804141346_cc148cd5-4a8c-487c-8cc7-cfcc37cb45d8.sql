-- Add discount_config column to venues table to store discount configurations
ALTER TABLE public.venues 
ADD COLUMN IF NOT EXISTS discount_config jsonb DEFAULT '{}'::jsonb;
-- Fix the schema mismatch - make required fields have defaults or nullable
-- Price should default to 0 since venues have services with their own pricing
ALTER TABLE public.venues 
ALTER COLUMN price SET DEFAULT 0;

-- Category should have a default since this appears to be a gaming venue platform
ALTER TABLE public.venues 
ALTER COLUMN category SET DEFAULT 'Gaming';
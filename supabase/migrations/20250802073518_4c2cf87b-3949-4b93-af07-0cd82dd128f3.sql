-- Add guest pricing rules column to venue_services table
ALTER TABLE public.venue_services 
ADD COLUMN guest_pricing_rules JSONB DEFAULT '[]'::jsonb;

-- Add a comment to document the structure
COMMENT ON COLUMN public.venue_services.guest_pricing_rules IS 'Array of guest pricing rules: [{"maxGuests": 3, "price": 5}, {"maxGuests": 7, "price": 10}]';
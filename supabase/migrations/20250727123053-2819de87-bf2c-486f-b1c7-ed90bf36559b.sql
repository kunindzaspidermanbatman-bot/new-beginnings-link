-- Remove default discount functionality from venues
ALTER TABLE venues 
DROP COLUMN IF EXISTS default_discount_percentage;
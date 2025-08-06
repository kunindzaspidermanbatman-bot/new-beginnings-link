-- Remove venue-level discount_config column completely
ALTER TABLE venues DROP COLUMN IF EXISTS discount_config;
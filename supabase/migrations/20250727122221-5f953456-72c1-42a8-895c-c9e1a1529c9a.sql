-- Remove venue-level categorization and pricing columns
ALTER TABLE venues 
DROP COLUMN IF EXISTS category,
DROP COLUMN IF EXISTS amenities,
DROP COLUMN IF EXISTS description,
DROP COLUMN IF EXISTS price;

-- The venue_categories table can remain but won't be used
-- The amenities table can remain but won't be used
-- venue_services table and service prices remain intact
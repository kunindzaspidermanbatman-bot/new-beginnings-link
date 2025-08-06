-- Create enum for predefined service types
CREATE TYPE service_type AS ENUM ('PC Gaming', 'PlayStation 5', 'Billiards', 'Table Tennis');

-- Add service_type column to venue_services table and remove duration and description
ALTER TABLE venue_services 
ADD COLUMN service_type service_type,
DROP COLUMN duration,
DROP COLUMN description;

-- Create index for better performance
CREATE INDEX idx_venue_services_type ON venue_services(service_type);

-- Update existing services to use the new service_type field
-- This will set all existing services to 'PC Gaming' as a default
-- Partners will need to update these manually
UPDATE venue_services 
SET service_type = 'PC Gaming'::service_type 
WHERE service_type IS NULL;
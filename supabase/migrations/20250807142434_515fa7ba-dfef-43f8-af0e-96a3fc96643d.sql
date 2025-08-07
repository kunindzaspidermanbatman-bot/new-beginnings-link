-- Add max_tables field to venue_services table
ALTER TABLE venue_services 
ADD COLUMN max_tables integer DEFAULT 1 NOT NULL;

-- Add table configuration to booking_services
ALTER TABLE booking_services 
ADD COLUMN table_configurations jsonb DEFAULT '[]'::jsonb;

-- Update existing booking_services to have table configurations
UPDATE booking_services 
SET table_configurations = jsonb_build_array(
  jsonb_build_object(
    'table_number', 1,
    'guest_count', guest_count
  )
)
WHERE table_configurations = '[]'::jsonb;
-- Add latitude and longitude columns to venues table
ALTER TABLE venues 
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8);

-- Add index for location-based queries
CREATE INDEX idx_venues_location ON venues (latitude, longitude);

-- Add comment for clarity
COMMENT ON COLUMN venues.latitude IS 'Venue latitude for map positioning';
COMMENT ON COLUMN venues.longitude IS 'Venue longitude for map positioning';
-- Function to update venue rating and review count
CREATE OR REPLACE FUNCTION update_venue_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update venue rating and review count for the affected venue
  UPDATE venues 
  SET 
    rating = COALESCE((
      SELECT AVG(rating)::numeric(3,2)
      FROM reviews 
      WHERE venue_id = COALESCE(NEW.venue_id, OLD.venue_id)
    ), 0),
    review_count = COALESCE((
      SELECT COUNT(*)::integer
      FROM reviews 
      WHERE venue_id = COALESCE(NEW.venue_id, OLD.venue_id)
    ), 0),
    updated_at = now()
  WHERE id = COALESCE(NEW.venue_id, OLD.venue_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for review operations
DROP TRIGGER IF EXISTS trigger_update_venue_rating_on_insert ON reviews;
DROP TRIGGER IF EXISTS trigger_update_venue_rating_on_update ON reviews;
DROP TRIGGER IF EXISTS trigger_update_venue_rating_on_delete ON reviews;

CREATE TRIGGER trigger_update_venue_rating_on_insert
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_venue_rating();

CREATE TRIGGER trigger_update_venue_rating_on_update
  AFTER UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_venue_rating();

CREATE TRIGGER trigger_update_venue_rating_on_delete
  AFTER DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_venue_rating();

-- Update all existing venue ratings to ensure they're correct
UPDATE venues 
SET 
  rating = COALESCE((
    SELECT AVG(rating)::numeric(3,2)
    FROM reviews 
    WHERE venue_id = venues.id
  ), 0),
  review_count = COALESCE((
    SELECT COUNT(*)::integer
    FROM reviews 
    WHERE venue_id = venues.id
  ), 0),
  updated_at = now();
-- Fix security warning by setting search_path for the function
CREATE OR REPLACE FUNCTION public.update_venue_rating()
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';
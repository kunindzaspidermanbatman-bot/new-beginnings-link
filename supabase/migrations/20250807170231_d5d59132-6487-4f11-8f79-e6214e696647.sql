-- Add RLS policy to allow partners to view booking services for their venues
CREATE POLICY "Partners can view booking services for their venues" 
ON booking_services 
FOR SELECT 
USING (EXISTS (
  SELECT 1 
  FROM bookings b
  JOIN venues v ON b.venue_id = v.id
  WHERE b.id = booking_services.booking_id 
  AND v.partner_id = auth.uid()
));
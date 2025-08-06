-- Add RLS policy for partners to view bookings for their venues
CREATE POLICY "Partners can view bookings for their venues" 
ON public.bookings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM venues 
    WHERE venues.id = bookings.venue_id 
    AND venues.partner_id = auth.uid()
  )
);
-- Add RLS policy for partners to view bookings for their venues
CREATE POLICY "Partners can view bookings for their venues" 
ON public.bookings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.venues v
    JOIN public.profiles p ON v.partner_id = p.id
    WHERE v.id = bookings.venue_id 
    AND p.id = auth.uid() 
    AND p.role = 'partner'
  )
);
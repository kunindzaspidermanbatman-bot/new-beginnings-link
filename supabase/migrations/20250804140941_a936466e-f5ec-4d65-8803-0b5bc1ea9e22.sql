-- Add RLS policies for venue_services to allow partners to manage their venue services

-- Allow partners to create services for their own venues
CREATE POLICY "Partners can create services for their venues" ON public.venue_services
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.venues 
    WHERE venues.id = venue_services.venue_id 
    AND venues.partner_id = auth.uid()
  )
);

-- Allow partners to update services for their own venues  
CREATE POLICY "Partners can update services for their venues" ON public.venue_services
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.venues 
    WHERE venues.id = venue_services.venue_id 
    AND venues.partner_id = auth.uid()
  )
);

-- Allow partners to delete services for their own venues
CREATE POLICY "Partners can delete services for their venues" ON public.venue_services  
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.venues 
    WHERE venues.id = venue_services.venue_id 
    AND venues.partner_id = auth.uid()
  )
);
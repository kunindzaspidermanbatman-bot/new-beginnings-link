-- Add DELETE policies for venues table

-- Allow admins to delete any venue
CREATE POLICY "Admins can delete venues" 
ON public.venues 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Allow partners to delete their own venues
CREATE POLICY "Partners can delete their own venues" 
ON public.venues 
FOR DELETE 
USING (auth.uid() = partner_id);
-- Create proper RLS policies for admins to view all venues
DROP POLICY IF EXISTS "Admins can view all venues regardless of approval status" ON public.venues;

CREATE POLICY "Admins can view all venues" 
ON public.venues 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Create admin policy for updating venues  
DROP POLICY IF EXISTS "Admins can update venue approval and visibility" ON public.venues;

CREATE POLICY "Admins can update venues"
ON public.venues
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Ensure public venues are visible to everyone when approved
DROP POLICY IF EXISTS "Anyone can view approved venues" ON public.venues;

CREATE POLICY "Public can view approved venues"
ON public.venues
FOR SELECT
TO anon, authenticated
USING (approval_status = 'approved' AND is_visible = true);
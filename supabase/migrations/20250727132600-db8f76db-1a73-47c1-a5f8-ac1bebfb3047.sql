-- Drop the existing policy that might be causing issues
DROP POLICY IF EXISTS "Partners can insert their own venues" ON public.venues;

-- Create a new, more explicit policy for venue insertion
CREATE POLICY "Partners can insert their own venues" 
ON public.venues 
FOR INSERT 
WITH CHECK (
  auth.uid() = partner_id 
  AND EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'partner'::user_role
  )
);

-- Also check and update the update policy to be consistent
DROP POLICY IF EXISTS "Partners can update their own venues" ON public.venues;

CREATE POLICY "Partners can update their own venues" 
ON public.venues 
FOR UPDATE 
USING (
  auth.uid() = partner_id 
  AND EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'partner'::user_role
  )
);
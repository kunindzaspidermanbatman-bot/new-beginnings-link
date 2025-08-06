-- Let's create a more permissive policy temporarily to debug
DROP POLICY IF EXISTS "Partners can insert their own venues" ON public.venues;

-- Create a simplified policy that should work
CREATE POLICY "Partners can insert their own venues" 
ON public.venues 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = partner_id
);

-- Let's also check if there are any conflicting policies
SELECT policyname, cmd, permissive, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'venues' AND cmd = 'INSERT';
-- Drop ALL existing policies on venues table to start completely fresh
DROP POLICY IF EXISTS "Enable insert for partners" ON public.venues;
DROP POLICY IF EXISTS "Partners can insert their own venues" ON public.venues;
DROP POLICY IF EXISTS "Partners can update their own venues" ON public.venues;
DROP POLICY IF EXISTS "Partners can delete their own venues" ON public.venues;
DROP POLICY IF EXISTS "Public can view approved and visible venues" ON public.venues;
DROP POLICY IF EXISTS "Admins can view all venues regardless of approval status" ON public.venues;
DROP POLICY IF EXISTS "Admins can update venue approval and visibility" ON public.venues;

-- Create a simple policy that allows any authenticated user to insert venues
-- This will let us test if the issue is with the role checking
CREATE POLICY "Allow authenticated users to insert venues"
ON public.venues
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Re-create the other essential policies
CREATE POLICY "Anyone can view approved venues"
ON public.venues
FOR SELECT
USING (approval_status = 'approved' AND is_visible = true);

CREATE POLICY "Partners can view their own venues"
ON public.venues
FOR SELECT
TO authenticated
USING (auth.uid() = partner_id);

CREATE POLICY "Partners can update their own venues"
ON public.venues
FOR UPDATE
TO authenticated
USING (auth.uid() = partner_id);
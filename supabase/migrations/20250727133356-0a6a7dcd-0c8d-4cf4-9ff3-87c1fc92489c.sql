-- Re-enable RLS and create a working policy
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- Drop all existing INSERT policies to start fresh
DROP POLICY IF EXISTS "Partners can insert their own venues" ON public.venues;

-- Create a simple, working policy for partners to insert venues
CREATE POLICY "Enable insert for partners"
ON public.venues
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = partner_id
);
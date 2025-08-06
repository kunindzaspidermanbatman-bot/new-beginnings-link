-- Add venue approval and visibility fields
ALTER TABLE public.venues 
ADD COLUMN approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN is_visible BOOLEAN DEFAULT false,
ADD COLUMN priority INTEGER DEFAULT 0,
ADD COLUMN rejected_reason TEXT;

-- Create index for better performance on approval status queries
CREATE INDEX idx_venues_approval_status ON public.venues(approval_status);
CREATE INDEX idx_venues_visibility ON public.venues(is_visible);

-- Update existing venues to be approved and visible (for backward compatibility)
UPDATE public.venues SET approval_status = 'approved', is_visible = true WHERE approval_status = 'pending';

-- Create admin-specific RLS policies for venues
CREATE POLICY "Admins can view all venues regardless of approval status" 
ON public.venues 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Update existing venue visibility policy to only show approved and visible venues to non-admins
DROP POLICY IF EXISTS "Anyone can read venues" ON public.venues;
CREATE POLICY "Public can view approved and visible venues" 
ON public.venues 
FOR SELECT 
TO authenticated, anon
USING (
  approval_status = 'approved' AND is_visible = true
  OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Add policy for admins to update venue approval status
CREATE POLICY "Admins can update venue approval and visibility" 
ON public.venues 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
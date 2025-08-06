-- First, let's see what values are currently in the user_role enum
SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role');

-- Add 'partner' to the user_role enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'partner' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
        ALTER TYPE user_role ADD VALUE 'partner';
    END IF;
END $$;

-- Update the RLS policy to be more explicit about the role check
DROP POLICY IF EXISTS "Partners can insert their own venues" ON public.venues;

CREATE POLICY "Partners can insert their own venues" 
ON public.venues 
FOR INSERT 
WITH CHECK (
  auth.uid() = partner_id 
  AND EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role::text = 'partner'
  )
);
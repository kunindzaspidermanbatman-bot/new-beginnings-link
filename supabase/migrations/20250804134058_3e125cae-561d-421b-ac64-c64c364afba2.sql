-- Add role column back to profiles table (it was missing after database cleanup)
ALTER TABLE public.profiles 
ADD COLUMN role text NOT NULL DEFAULT 'customer';

-- Create a check constraint to ensure valid roles
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('customer', 'partner', 'admin'));
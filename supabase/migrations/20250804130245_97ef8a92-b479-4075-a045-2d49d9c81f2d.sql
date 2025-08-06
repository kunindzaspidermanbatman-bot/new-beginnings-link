-- Add role column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN role text NOT NULL DEFAULT 'customer';

-- Create a check constraint to ensure valid roles
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('customer', 'partner', 'admin'));

-- Update beji.matiashvili@gmail.com to admin role
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'beji.matiashvili@gmail.com';
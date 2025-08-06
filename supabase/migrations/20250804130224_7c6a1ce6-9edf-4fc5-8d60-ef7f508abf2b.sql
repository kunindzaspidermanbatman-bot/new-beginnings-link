-- Update beji.matiashvili@gmail.com to admin role
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'beji.matiashvili@gmail.com';
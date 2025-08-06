-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('customer', 'partner', 'admin');

-- Add role column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN role public.user_role DEFAULT 'customer' NOT NULL;

-- Add partner_id to venues table to link venues to partners
ALTER TABLE public.venues
ADD COLUMN partner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Create index for faster partner venue lookups
CREATE INDEX idx_venues_partner_id ON public.venues(partner_id);

-- Update RLS policies for venues to allow partners to manage their own venues
DROP POLICY IF EXISTS "Anyone can read venues" ON public.venues;

CREATE POLICY "Anyone can read venues" 
ON public.venues 
FOR SELECT 
USING (true);

CREATE POLICY "Partners can insert their own venues" 
ON public.venues 
FOR INSERT 
WITH CHECK (auth.uid() = partner_id AND EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'partner'
));

CREATE POLICY "Partners can update their own venues" 
ON public.venues 
FOR UPDATE 
USING (auth.uid() = partner_id AND EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'partner'
));

CREATE POLICY "Partners can delete their own venues" 
ON public.venues 
FOR DELETE 
USING (auth.uid() = partner_id AND EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'partner'
));

-- Update RLS policies for venue_services
DROP POLICY IF EXISTS "Anyone can read venue services" ON public.venue_services;

CREATE POLICY "Anyone can read venue services" 
ON public.venue_services 
FOR SELECT 
USING (true);

CREATE POLICY "Partners can manage services for their venues" 
ON public.venue_services 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.venues v 
  JOIN public.profiles p ON v.partner_id = p.id
  WHERE v.id = venue_services.venue_id 
  AND p.id = auth.uid() 
  AND p.role = 'partner'
));

-- Update the handle_new_user function to support partner registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'customer')
  );
  RETURN NEW;
END;
$$;
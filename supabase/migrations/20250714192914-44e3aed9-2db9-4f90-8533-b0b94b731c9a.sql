-- Add foreign key constraints to ensure proper relationships and data integrity

-- Add foreign key constraint from bookings to venues
ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_venue_id_fkey 
FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE CASCADE;

-- Add foreign key constraint from bookings to venue_services  
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_service_id_fkey
FOREIGN KEY (service_id) REFERENCES public.venue_services(id) ON DELETE SET NULL;

-- Add foreign key constraint from bookings to profiles (user profiles)
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_user_id_fkey  
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
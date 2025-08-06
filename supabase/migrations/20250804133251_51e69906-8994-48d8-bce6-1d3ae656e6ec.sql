-- Clean database - remove all data but keep table structure

-- Clear all data from tables (order matters due to foreign key constraints)
TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.user_favorites CASCADE;
TRUNCATE TABLE public.reviews CASCADE;
TRUNCATE TABLE public.bookings CASCADE;
TRUNCATE TABLE public.venue_services CASCADE;
TRUNCATE TABLE public.venues CASCADE;
TRUNCATE TABLE public.profiles CASCADE;
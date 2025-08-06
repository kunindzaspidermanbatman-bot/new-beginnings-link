-- Clean database - remove all data but keep table structure

-- Disable triggers temporarily to avoid issues during cleanup
SET session_replication_role = replica;

-- Clear all data from tables (order matters due to foreign key constraints)
TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.user_favorites CASCADE;
TRUNCATE TABLE public.reviews CASCADE;
TRUNCATE TABLE public.bookings CASCADE;
TRUNCATE TABLE public.venue_services CASCADE;
TRUNCATE TABLE public.venues CASCADE;
TRUNCATE TABLE public.profiles CASCADE;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Reset sequences if any exist
-- This ensures new records start with ID 1
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'SELECT setval(pg_get_serial_sequence(''' || r.schemaname || '.' || r.tablename || ''', ''id''), 1, false)' 
        WHERE pg_get_serial_sequence(r.schemaname || '.' || r.tablename, 'id') IS NOT NULL;
    END LOOP;
END $$;
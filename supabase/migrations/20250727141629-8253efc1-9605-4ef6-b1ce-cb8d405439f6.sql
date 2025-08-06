-- Enable real-time updates for notifications table
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Enable real-time updates for bookings table (for partner notifications)
ALTER TABLE public.bookings REPLICA IDENTITY FULL;

-- Add the bookings table to the realtime publication if not already added
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'bookings'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
    END IF;
END $$;
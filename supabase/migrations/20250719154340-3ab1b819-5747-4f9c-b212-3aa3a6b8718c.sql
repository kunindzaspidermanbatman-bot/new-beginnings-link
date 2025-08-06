-- Add completed status to bookings if not exists
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create function to update status_updated_at
CREATE OR REPLACE FUNCTION public.update_booking_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for booking status updates
DROP TRIGGER IF EXISTS update_booking_status_timestamp ON public.bookings;
CREATE TRIGGER update_booking_status_timestamp
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_booking_status_timestamp();

-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the check-completed-bookings function to run every hour
SELECT cron.schedule(
  'check-completed-bookings',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://vpyrrctzuudgokhkucli.supabase.co/functions/v1/check-completed-bookings',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZweXJyY3R6dXVkZ29raGt1Y2xpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNTgxMTUsImV4cCI6MjA2NzkzNDExNX0.3vJsiGw7TFFlY-aAec7pgh34lhtzMFbOfi-vBJUrawI"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);
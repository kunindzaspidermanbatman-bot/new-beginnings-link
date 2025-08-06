-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create cron job to check for 1-hour booking reminders every minute
SELECT cron.schedule(
  'booking-reminder-notifications',
  '* * * * *', -- every minute
  $$
  SELECT
    net.http_post(
        url:='https://vpyrrctzuudgokhkucli.supabase.co/functions/v1/booking-reminder-notifications',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZweXJyY3R6dXVkZ29raGt1Y2xpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNTgxMTUsImV4cCI6MjA2NzkzNDExNX0.3vJsiGw7TFFlY-aAec7pgh34lhtzMFbOfi-vBJUrawI"}'::jsonb,
        body:='{"trigger": "cron"}'::jsonb
    ) as request_id;
  $$
);
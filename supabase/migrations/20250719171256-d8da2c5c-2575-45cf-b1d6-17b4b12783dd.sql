-- Fix the notifications table check constraint to allow booking confirmation types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add updated constraint that includes all notification types
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('booking_confirmed', 'booking_rejected', '1_hour_before', '2_hours_before', '10_minutes_before'));

-- Update existing notifications that might have invalid types to proper ones
UPDATE public.notifications 
SET type = 'booking_confirmed' 
WHERE type = 'booking_confirmation';
-- Delete existing 2-hour and 10-minute reminder notifications
DELETE FROM public.notifications 
WHERE type IN ('2_hours_before', '10_minutes_before');

-- Update the booking confirmation notification type
UPDATE public.notifications 
SET type = 'booking_confirmed' 
WHERE type = 'booking_confirmation';
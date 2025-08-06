-- Delete existing 2-hour and 10-minute reminder notifications
DELETE FROM public.notifications 
WHERE type IN ('2_hours_before', '10_minutes_before');

-- Delete existing booking_confirmation notifications (they'll be recreated with proper type)
DELETE FROM public.notifications 
WHERE type = 'booking_confirmation';
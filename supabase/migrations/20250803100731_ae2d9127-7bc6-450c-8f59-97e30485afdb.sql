-- Fix the specific service that's still applying legacy free hour discount
UPDATE public.venue_services 
SET is_time_based_free_hour_enabled = false,
    free_hours = 0,
    threshold_hours = 0
WHERE id = '4fd30a37-9d68-4878-9a8a-a33680def7e6';
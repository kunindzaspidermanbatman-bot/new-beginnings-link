-- Disable legacy free hour discounts for all services in this venue
UPDATE public.venue_services 
SET is_time_based_free_hour_enabled = false,
    free_hours = 0,
    threshold_hours = 0
WHERE venue_id = '35aa696d-edad-4eb0-b050-a965aca16f89';
-- Update all venues to disable legacy free hour discounts to ensure X + Y bundle logic works correctly
UPDATE public.venues 
SET is_time_based_free_hour_enabled = false,
    free_hours = 0,
    threshold_hours = 0
WHERE discount_config->>'isTimeBundleDiscountEnabled' = 'true';

-- Update all venue services to disable legacy free hour discounts to ensure X + Y bundle logic works correctly  
UPDATE public.venue_services 
SET is_time_based_free_hour_enabled = false,
    free_hours = 0,
    threshold_hours = 0
WHERE venue_id IN (
  SELECT id FROM public.venues 
  WHERE discount_config->>'isTimeBundleDiscountEnabled' = 'true'
);
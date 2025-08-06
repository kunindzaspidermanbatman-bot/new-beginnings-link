-- Add discount configuration fields to venues table
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS discount_config jsonb DEFAULT '{
  "overall_discount_percent": 0,
  "overall_discount_enabled": false,
  "overall_discount_service_ids": [],
  "is_time_based_free_hour_enabled": false,
  "free_hour_discount_enabled": false,
  "free_hour_service_ids": [],
  "threshold_hours": 2,
  "free_hours": 1,
  "group_discounts": [],
  "group_discount_enabled": false,
  "timeslot_discounts": [],
  "timeslot_discount_enabled": false
}'::jsonb;

-- Add comment to explain the structure
COMMENT ON COLUMN public.venues.discount_config IS 'Global discount configuration for the venue, stores which services have which discounts applied';
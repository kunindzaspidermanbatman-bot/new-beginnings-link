-- Update Billiards Club venue to use new bundle discount system instead of legacy
UPDATE public.venues 
SET discount_config = jsonb_set(
  jsonb_set(
    jsonb_set(
      discount_config,
      '{isTimeBundleDiscountEnabled}',
      'true'
    ),
    '{bundleDiscount}',
    '{"paidHours": 2, "freeHours": 1}'
  ),
  '{is_time_based_free_hour_enabled}',
  'false'
)
WHERE id = '35aa696d-edad-4eb0-b050-a965aca16f89';

-- Also disable service-level legacy discounts for Table Tennis and Billiards services
UPDATE public.venue_services 
SET is_time_based_free_hour_enabled = false
WHERE venue_id = '35aa696d-edad-4eb0-b050-a965aca16f89' 
AND id IN ('4fd30a37-9d68-4878-9a8a-a33680def7e6', '76816784-8f6b-4b9b-8600-2c97e7f321a2');
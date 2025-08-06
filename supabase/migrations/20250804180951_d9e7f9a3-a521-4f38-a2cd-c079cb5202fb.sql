-- Revert the test discount data back to empty/zero values
UPDATE venue_services 
SET 
  overall_discount_percent = 0,
  group_discounts = '[]'::jsonb,
  timeslot_discounts = '[]'::jsonb,
  free_hour_discounts = '[]'::jsonb
WHERE venue_id = '20e61b05-edec-4aaa-ac9d-d0743a64f3ca';
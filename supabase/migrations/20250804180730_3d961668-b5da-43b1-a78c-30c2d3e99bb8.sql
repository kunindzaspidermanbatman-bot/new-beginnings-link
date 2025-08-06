-- Update the correct services for venue 20e61b05-edec-4aaa-ac9d-d0743a64f3ca
-- PC Gaming service
UPDATE venue_services 
SET 
  overall_discount_percent = 15,
  group_discounts = '[{"minGuests": 3, "discountPercent": 10}, {"minGuests": 5, "discountPercent": 20}]'::jsonb,
  timeslot_discounts = '[{"start": "11:00", "end": "16:00", "discountPercent": 25}]'::jsonb
WHERE id = 'e6dfa0f9-fb89-4e4a-a5dc-4ad713897078';

-- Table Tennis service
UPDATE venue_services 
SET 
  free_hour_discounts = '[{"thresholdHours": 3, "freeHours": 1}, {"thresholdHours": 6, "freeHours": 2}]'::jsonb,
  group_discounts = '[{"minGuests": 4, "discountPercent": 15}]'::jsonb
WHERE id = 'c21327da-4ccb-4017-9ef7-4102a5b62d6b';
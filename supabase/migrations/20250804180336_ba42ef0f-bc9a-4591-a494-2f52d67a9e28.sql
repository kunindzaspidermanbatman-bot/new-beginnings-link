-- Add some test discount configurations to venue services for testing
UPDATE venue_services 
SET 
  overall_discount_percent = 15,
  group_discounts = '[{"minGuests": 3, "discountPercent": 10}, {"minGuests": 5, "discountPercent": 20}]'::jsonb,
  timeslot_discounts = '[{"start": "11:00", "end": "16:00", "discountPercent": 25}]'::jsonb
WHERE id = 'e6dfa0f9-fb89-4e4a-a5dc-4ad713897078' AND name = 'PC Gaming';

UPDATE venue_services 
SET 
  free_hour_discounts = '[{"thresholdHours": 3, "freeHours": 1}, {"thresholdHours": 6, "freeHours": 2}]'::jsonb,
  group_discounts = '[{"minGuests": 4, "discountPercent": 15}]'::jsonb
WHERE id = 'c21327da-4ccb-4017-9ef7-4102a5b62d6b' AND name = 'Table Tennis';
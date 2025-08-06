-- Add test discount to ONLY the PC Gaming service to test the indicator
UPDATE venue_services 
SET overall_discount_percent = 20
WHERE id = 'e6dfa0f9-fb89-4e4a-a5dc-4ad713897078' AND name = 'PC Gaming';
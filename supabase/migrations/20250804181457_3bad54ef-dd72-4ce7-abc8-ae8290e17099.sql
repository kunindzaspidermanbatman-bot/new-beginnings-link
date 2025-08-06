-- Remove test discount data to make it work with actual system
UPDATE venue_services 
SET overall_discount_percent = 0
WHERE id = 'e6dfa0f9-fb89-4e4a-a5dc-4ad713897078';
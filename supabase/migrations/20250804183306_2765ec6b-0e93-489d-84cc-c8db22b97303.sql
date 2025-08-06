-- Remove test discount to clean up
UPDATE venue_services 
SET overall_discount_percent = 0
WHERE id = '8d667806-8e5f-4812-ac13-3802ea1c833d';
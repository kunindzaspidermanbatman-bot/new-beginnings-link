-- Add test discount to verify the system works
UPDATE venue_services 
SET overall_discount_percent = 25
WHERE id = '8d667806-8e5f-4812-ac13-3802ea1c833d' AND name = 'Billiards';
-- Update all venues to have consistent discount configuration with bundle discount enabled
UPDATE venues 
SET discount_config = jsonb_set(
  jsonb_set(
    COALESCE(discount_config, '{}'::jsonb),
    '{isTimeBundleDiscountEnabled}',
    'true'::jsonb
  ),
  '{bundleDiscount}',
  '{"paidHours": 2, "freeHours": 1}'::jsonb
)
WHERE approval_status = 'approved' 
AND (
  discount_config->'isTimeBundleDiscountEnabled' IS NULL 
  OR discount_config->'isTimeBundleDiscountEnabled' = 'null'::jsonb
  OR discount_config->'bundleDiscount' IS NULL
  OR discount_config->'bundleDiscount' = 'null'::jsonb
);
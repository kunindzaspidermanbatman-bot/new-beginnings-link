-- Add discount fields to venues table
ALTER TABLE public.venues 
ADD COLUMN overall_discount_percent numeric DEFAULT 0 CHECK (overall_discount_percent >= 0 AND overall_discount_percent <= 100),
ADD COLUMN is_time_based_free_hour_enabled boolean DEFAULT false,
ADD COLUMN threshold_hours numeric DEFAULT 2 CHECK (threshold_hours > 0),
ADD COLUMN free_hours numeric DEFAULT 1 CHECK (free_hours > 0),
ADD COLUMN group_discounts jsonb DEFAULT '[]'::jsonb,
ADD COLUMN timeslot_discounts jsonb DEFAULT '[]'::jsonb;

-- Add comment to explain the JSON structure
COMMENT ON COLUMN public.venues.group_discounts IS 'Array of objects: [{"minGuests": 3, "discountPercent": 10}]';
COMMENT ON COLUMN public.venues.timeslot_discounts IS 'Array of objects: [{"start": "11:00", "end": "16:00", "discountPercent": 10}]';

-- Add discount fields to booking_services table for tracking applied discounts
ALTER TABLE public.booking_services
ADD COLUMN original_price numeric,
ADD COLUMN applied_discounts jsonb DEFAULT '[]'::jsonb,
ADD COLUMN discount_breakdown jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.booking_services.applied_discounts IS 'Array of applied discount names/types';
COMMENT ON COLUMN public.booking_services.discount_breakdown IS 'Object with discount details: {"overallDiscount": 10, "groupDiscount": 5, etc.}';

-- Create function to calculate discounted price
CREATE OR REPLACE FUNCTION public.calculate_venue_discounted_price(
  venue_id_param uuid,
  base_price numeric,
  duration_hours numeric,
  guest_count integer,
  booking_start_time time,
  booking_end_time time
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  venue_record public.venues%ROWTYPE;
  final_price numeric := base_price;
  original_price numeric := base_price;
  paid_hours numeric := duration_hours;
  applied_discounts text[] := '{}';
  discount_breakdown jsonb := '{}';
  group_discount_percent numeric := 0;
  timeslot_discount_percent numeric := 0;
  overlap_hours numeric;
  timeslot_record jsonb;
BEGIN
  -- Get venue data
  SELECT * INTO venue_record FROM public.venues WHERE id = venue_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Venue not found';
  END IF;
  
  -- 1. Apply overall discount first
  IF venue_record.overall_discount_percent > 0 THEN
    final_price := final_price * (1 - venue_record.overall_discount_percent / 100);
    applied_discounts := array_append(applied_discounts, 'Overall Discount');
    discount_breakdown := jsonb_set(discount_breakdown, '{overallDiscount}', to_jsonb(venue_record.overall_discount_percent));
  END IF;
  
  -- 2. Apply free hours (2+1 logic)
  IF venue_record.is_time_based_free_hour_enabled AND duration_hours >= venue_record.threshold_hours THEN
    paid_hours := GREATEST(0, duration_hours - venue_record.free_hours);
    final_price := final_price * (paid_hours / duration_hours);
    applied_discounts := array_append(applied_discounts, 'Free Hours');
    discount_breakdown := jsonb_set(discount_breakdown, '{freeHours}', to_jsonb(venue_record.free_hours));
  END IF;
  
  -- 3. Apply group discount
  IF jsonb_array_length(venue_record.group_discounts) > 0 THEN
    FOR i IN 0..jsonb_array_length(venue_record.group_discounts) - 1 LOOP
      IF (venue_record.group_discounts->i->>'minGuests')::integer <= guest_count THEN
        group_discount_percent := (venue_record.group_discounts->i->>'discountPercent')::numeric;
      END IF;
    END LOOP;
    
    IF group_discount_percent > 0 THEN
      final_price := final_price * (1 - group_discount_percent / 100);
      applied_discounts := array_append(applied_discounts, 'Group Discount');
      discount_breakdown := jsonb_set(discount_breakdown, '{groupDiscount}', to_jsonb(group_discount_percent));
    END IF;
  END IF;
  
  -- 4. Apply timeslot discount (simplified - assumes full overlap for now)
  IF jsonb_array_length(venue_record.timeslot_discounts) > 0 THEN
    FOR i IN 0..jsonb_array_length(venue_record.timeslot_discounts) - 1 LOOP
      timeslot_record := venue_record.timeslot_discounts->i;
      -- Simple overlap check - can be enhanced for partial overlaps
      IF booking_start_time >= (timeslot_record->>'start')::time 
         AND booking_end_time <= (timeslot_record->>'end')::time THEN
        timeslot_discount_percent := (timeslot_record->>'discountPercent')::numeric;
        EXIT; -- Use first matching timeslot
      END IF;
    END LOOP;
    
    IF timeslot_discount_percent > 0 THEN
      final_price := final_price * (1 - timeslot_discount_percent / 100);
      applied_discounts := array_append(applied_discounts, 'Timeslot Discount');
      discount_breakdown := jsonb_set(discount_breakdown, '{timeslotDiscount}', to_jsonb(timeslot_discount_percent));
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'originalPrice', original_price,
    'finalPrice', ROUND(final_price, 2),
    'totalSavings', ROUND(original_price - final_price, 2),
    'appliedDiscounts', to_jsonb(applied_discounts),
    'discountBreakdown', discount_breakdown,
    'paidHours', paid_hours
  );
END;
$$;
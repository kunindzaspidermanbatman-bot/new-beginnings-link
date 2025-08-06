-- Update bundle discount logic to only apply on exact multiples
CREATE OR REPLACE FUNCTION public.calculate_venue_discounted_price(venue_id_param uuid, base_price numeric, duration_hours numeric, guest_count integer, booking_start_time time without time zone, booking_end_time time without time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  venue_record public.venues%ROWTYPE;
  final_price numeric := base_price;
  original_price numeric := base_price;
  paid_hours numeric := duration_hours;
  applied_discounts text[] := '{}';
  discount_breakdown jsonb := '{}';
  group_discount_percent numeric := 0;
  timeslot_discount_percent numeric := 0;
  bundle_config jsonb;
  bundle_paid_hours numeric;
  bundle_free_hours numeric;
  group_size numeric;
  bundle_count numeric;
  free_hours_total numeric;
  charged_hours numeric;
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
  
  -- 2. Apply bundle discount or legacy free hours
  IF venue_record.discount_config->>'isTimeBundleDiscountEnabled' = 'true' 
     AND venue_record.discount_config->'bundleDiscount' IS NOT NULL THEN
    -- X + Y bundle discount logic - only apply if booking is exactly multiples of group size
    bundle_config := venue_record.discount_config->'bundleDiscount';
    bundle_paid_hours := (bundle_config->>'paidHours')::numeric;
    bundle_free_hours := (bundle_config->>'freeHours')::numeric;
    group_size := bundle_paid_hours + bundle_free_hours;
    
    -- Only apply discount if duration is exactly divisible by group size
    IF duration_hours % group_size = 0 THEN
      bundle_count := FLOOR(duration_hours / group_size);
      free_hours_total := bundle_count * bundle_free_hours;
      charged_hours := duration_hours - free_hours_total;
      
      paid_hours := charged_hours;
      final_price := final_price * (charged_hours / duration_hours);
      applied_discounts := array_append(applied_discounts, 'Bundle Discount');
      discount_breakdown := jsonb_set(discount_breakdown, '{freeHours}', to_jsonb(free_hours_total));
    END IF;
  ELSIF venue_record.is_time_based_free_hour_enabled AND duration_hours >= venue_record.threshold_hours THEN
    -- Legacy 2+1 logic
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
  
  -- 4. Apply timeslot discount
  IF jsonb_array_length(venue_record.timeslot_discounts) > 0 THEN
    FOR i IN 0..jsonb_array_length(venue_record.timeslot_discounts) - 1 LOOP
      timeslot_record := venue_record.timeslot_discounts->i;
      IF booking_start_time >= (timeslot_record->>'start')::time 
         AND booking_end_time <= (timeslot_record->>'end')::time THEN
        timeslot_discount_percent := (timeslot_record->>'discountPercent')::numeric;
        EXIT;
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
$function$;

-- Update service calculation function as well
CREATE OR REPLACE FUNCTION public.calculate_service_discounted_price(service_id_param uuid, base_price numeric, duration_hours numeric, guest_count integer, booking_start_time time without time zone, booking_end_time time without time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  service_record public.venue_services%ROWTYPE;
  venue_record public.venues%ROWTYPE;
  final_price numeric := base_price;
  original_price numeric := base_price;
  paid_hours numeric := duration_hours;
  applied_discounts text[] := '{}';
  discount_breakdown jsonb := '{}';
  group_discount_percent numeric := 0;
  timeslot_discount_percent numeric := 0;
  bundle_config jsonb;
  bundle_paid_hours numeric;
  bundle_free_hours numeric;
  group_size numeric;
  bundle_count numeric;
  free_hours_total numeric;
  charged_hours numeric;
  timeslot_record jsonb;
BEGIN
  -- Get service data
  SELECT * INTO service_record FROM public.venue_services WHERE id = service_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found';
  END IF;
  
  -- Get venue data for bundle discount config
  SELECT * INTO venue_record FROM public.venues WHERE id = service_record.venue_id;
  
  -- 1. Apply overall discount first
  IF service_record.overall_discount_percent > 0 THEN
    final_price := final_price * (1 - service_record.overall_discount_percent / 100);
    applied_discounts := array_append(applied_discounts, 'Overall Discount');
    discount_breakdown := jsonb_set(discount_breakdown, '{overallDiscount}', to_jsonb(service_record.overall_discount_percent));
  END IF;
  
  -- 2. Apply bundle discount or legacy free hours
  IF venue_record.discount_config->>'isTimeBundleDiscountEnabled' = 'true' 
     AND venue_record.discount_config->'bundleDiscount' IS NOT NULL THEN
    -- X + Y bundle discount logic - only apply if booking is exactly multiples of group size
    bundle_config := venue_record.discount_config->'bundleDiscount';
    bundle_paid_hours := (bundle_config->>'paidHours')::numeric;
    bundle_free_hours := (bundle_config->>'freeHours')::numeric;
    group_size := bundle_paid_hours + bundle_free_hours;
    
    -- Only apply discount if duration is exactly divisible by group size
    IF duration_hours % group_size = 0 THEN
      bundle_count := FLOOR(duration_hours / group_size);
      free_hours_total := bundle_count * bundle_free_hours;
      charged_hours := duration_hours - free_hours_total;
      
      paid_hours := charged_hours;
      final_price := final_price * (charged_hours / duration_hours);
      applied_discounts := array_append(applied_discounts, 'Bundle Discount');
      discount_breakdown := jsonb_set(discount_breakdown, '{freeHours}', to_jsonb(free_hours_total));
    END IF;
  ELSIF service_record.is_time_based_free_hour_enabled AND duration_hours >= service_record.threshold_hours THEN
    -- Legacy service-level free hours
    paid_hours := GREATEST(0, duration_hours - service_record.free_hours);
    final_price := final_price * (paid_hours / duration_hours);
    applied_discounts := array_append(applied_discounts, 'Free Hours');
    discount_breakdown := jsonb_set(discount_breakdown, '{freeHours}', to_jsonb(service_record.free_hours));
  END IF;
  
  -- 3. Apply group discount
  IF jsonb_array_length(service_record.group_discounts) > 0 THEN
    FOR i IN 0..jsonb_array_length(service_record.group_discounts) - 1 LOOP
      IF (service_record.group_discounts->i->>'minGuests')::integer <= guest_count THEN
        group_discount_percent := (service_record.group_discounts->i->>'discountPercent')::numeric;
      END IF;
    END LOOP;
    
    IF group_discount_percent > 0 THEN
      final_price := final_price * (1 - group_discount_percent / 100);
      applied_discounts := array_append(applied_discounts, 'Group Discount');
      discount_breakdown := jsonb_set(discount_breakdown, '{groupDiscount}', to_jsonb(group_discount_percent));
    END IF;
  END IF;
  
  -- 4. Apply timeslot discount
  IF jsonb_array_length(service_record.timeslot_discounts) > 0 THEN
    FOR i IN 0..jsonb_array_length(service_record.timeslot_discounts) - 1 LOOP
      timeslot_record := service_record.timeslot_discounts->i;
      IF booking_start_time >= (timeslot_record->>'start')::time 
         AND booking_end_time <= (timeslot_record->>'end')::time THEN
        timeslot_discount_percent := (timeslot_record->>'discountPercent')::numeric;
        EXIT;
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
$function$;
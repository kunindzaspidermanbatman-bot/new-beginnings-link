-- Fix service discount calculation to properly handle venue-level discounts
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
  venue_has_bundle_discount boolean := false;
  venue_overall_discount numeric := 0;
BEGIN
  -- Get service data
  SELECT * INTO service_record FROM public.venue_services WHERE id = service_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found';
  END IF;
  
  -- Get venue data for all venue-level discount configs
  SELECT * INTO venue_record FROM public.venues WHERE id = service_record.venue_id;
  
  -- Check if venue has bundle discount enabled
  venue_has_bundle_discount := (venue_record.discount_config->>'isTimeBundleDiscountEnabled' = 'true' 
                                AND venue_record.discount_config->'bundleDiscount' IS NOT NULL);
  
  -- 1. Apply overall discount - check both service-level and venue-level
  -- Service-level overall discount
  IF service_record.overall_discount_percent > 0 THEN
    final_price := final_price * (1 - service_record.overall_discount_percent / 100);
    applied_discounts := array_append(applied_discounts, 'Service Overall Discount');
    discount_breakdown := jsonb_set(discount_breakdown, '{serviceOverallDiscount}', to_jsonb(service_record.overall_discount_percent));
  END IF;
  
  -- Venue-level overall discount - check if this service is in the venue's overall discount service IDs
  IF venue_record.discount_config->>'overall_discount_enabled' = 'true' AND 
     venue_record.discount_config->'overall_discount_percent' IS NOT NULL AND
     (venue_record.discount_config->'overall_discount_percent')::numeric > 0 THEN
    venue_overall_discount := (venue_record.discount_config->'overall_discount_percent')::numeric;
    final_price := final_price * (1 - venue_overall_discount / 100);
    applied_discounts := array_append(applied_discounts, 'Venue Overall Discount');
    discount_breakdown := jsonb_set(discount_breakdown, '{venueOverallDiscount}', to_jsonb(venue_overall_discount));
  ELSIF venue_record.discount_config->'overall_discount_service_ids' IS NOT NULL AND
        jsonb_array_length(venue_record.discount_config->'overall_discount_service_ids') > 0 AND
        venue_record.discount_config->'overall_discount_percent' IS NOT NULL AND
        (venue_record.discount_config->'overall_discount_percent')::numeric > 0 THEN
    -- Check if current service is in the overall discount service IDs list
    IF venue_record.discount_config->'overall_discount_service_ids' @> to_jsonb(service_id_param::text) THEN
      venue_overall_discount := (venue_record.discount_config->'overall_discount_percent')::numeric;
      final_price := final_price * (1 - venue_overall_discount / 100);
      applied_discounts := array_append(applied_discounts, 'Venue Overall Discount');
      discount_breakdown := jsonb_set(discount_breakdown, '{venueOverallDiscount}', to_jsonb(venue_overall_discount));
    END IF;
  END IF;
  
  -- 2. Apply time-based discounts (prioritize venue-level bundle discount)
  IF venue_has_bundle_discount THEN
    -- Use venue-level X + Y bundle discount logic - calculate complete bundles and remaining hours
    bundle_config := venue_record.discount_config->'bundleDiscount';
    bundle_paid_hours := (bundle_config->>'paidHours')::numeric;
    bundle_free_hours := (bundle_config->>'freeHours')::numeric;
    group_size := bundle_paid_hours + bundle_free_hours;
    
    -- Calculate how many complete bundles fit in the duration
    bundle_count := FLOOR(duration_hours / group_size);
    free_hours_total := bundle_count * bundle_free_hours;
    charged_hours := duration_hours - free_hours_total;
    
    -- Apply the discount if we have at least one complete bundle
    IF bundle_count > 0 THEN
      paid_hours := charged_hours;
      final_price := final_price * (charged_hours / duration_hours);
      applied_discounts := array_append(applied_discounts, 'Bundle Discount');
      discount_breakdown := jsonb_set(discount_breakdown, '{freeHours}', to_jsonb(free_hours_total));
    END IF;
  ELSIF service_record.is_time_based_free_hour_enabled AND duration_hours >= service_record.threshold_hours THEN
    -- Fallback to legacy service-level free hours only if venue doesn't have bundle discount
    paid_hours := GREATEST(0, duration_hours - service_record.free_hours);
    final_price := final_price * (paid_hours / duration_hours);
    applied_discounts := array_append(applied_discounts, 'Free Hours');
    discount_breakdown := jsonb_set(discount_breakdown, '{freeHours}', to_jsonb(service_record.free_hours));
  END IF;
  
  -- 3. Apply group discount - check both service-level and venue-level
  -- Service-level group discount
  IF jsonb_array_length(service_record.group_discounts) > 0 THEN
    FOR i IN 0..jsonb_array_length(service_record.group_discounts) - 1 LOOP
      IF (service_record.group_discounts->i->>'minGuests')::integer <= guest_count THEN
        group_discount_percent := (service_record.group_discounts->i->>'discountPercent')::numeric;
      END IF;
    END LOOP;
    
    IF group_discount_percent > 0 THEN
      final_price := final_price * (1 - group_discount_percent / 100);
      applied_discounts := array_append(applied_discounts, 'Service Group Discount');
      discount_breakdown := jsonb_set(discount_breakdown, '{serviceGroupDiscount}', to_jsonb(group_discount_percent));
    END IF;
  END IF;
  
  -- Venue-level group discount (if enabled and no service-level group discount was applied)
  IF group_discount_percent = 0 AND 
     venue_record.discount_config->>'group_discount_enabled' = 'true' AND
     venue_record.discount_config->'group_discounts' IS NOT NULL AND
     jsonb_array_length(venue_record.discount_config->'group_discounts') > 0 THEN
    FOR i IN 0..jsonb_array_length(venue_record.discount_config->'group_discounts') - 1 LOOP
      IF (venue_record.discount_config->'group_discounts'->i->>'minGuests')::integer <= guest_count THEN
        group_discount_percent := (venue_record.discount_config->'group_discounts'->i->>'discountPercent')::numeric;
      END IF;
    END LOOP;
    
    IF group_discount_percent > 0 THEN
      final_price := final_price * (1 - group_discount_percent / 100);
      applied_discounts := array_append(applied_discounts, 'Venue Group Discount');
      discount_breakdown := jsonb_set(discount_breakdown, '{venueGroupDiscount}', to_jsonb(group_discount_percent));
    END IF;
  END IF;
  
  -- 4. Apply timeslot discount - check both service-level and venue-level
  -- Service-level timeslot discount
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
      applied_discounts := array_append(applied_discounts, 'Service Timeslot Discount');
      discount_breakdown := jsonb_set(discount_breakdown, '{serviceTimeslotDiscount}', to_jsonb(timeslot_discount_percent));
    END IF;
  END IF;
  
  -- Venue-level timeslot discount (if enabled and no service-level timeslot discount was applied)
  IF timeslot_discount_percent = 0 AND
     venue_record.discount_config->>'timeslot_discount_enabled' = 'true' AND
     venue_record.discount_config->'timeslot_discounts' IS NOT NULL AND
     jsonb_array_length(venue_record.discount_config->'timeslot_discounts') > 0 THEN
    FOR i IN 0..jsonb_array_length(venue_record.discount_config->'timeslot_discounts') - 1 LOOP
      timeslot_record := venue_record.discount_config->'timeslot_discounts'->i;
      IF booking_start_time >= (timeslot_record->>'start')::time 
         AND booking_end_time <= (timeslot_record->>'end')::time THEN
        timeslot_discount_percent := (timeslot_record->>'discountPercent')::numeric;
        EXIT;
      END IF;
    END LOOP;
    
    IF timeslot_discount_percent > 0 THEN
      final_price := final_price * (1 - timeslot_discount_percent / 100);
      applied_discounts := array_append(applied_discounts, 'Venue Timeslot Discount');
      discount_breakdown := jsonb_set(discount_breakdown, '{venueTimeslotDiscount}', to_jsonb(timeslot_discount_percent));
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
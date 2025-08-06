import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DiscountCalculationResult {
  originalPrice: number;
  finalPrice: number;
  totalSavings: number;
  appliedDiscounts: string[];
  discountBreakdown: {
    overallDiscount?: number;
    freeHours?: number;
    groupDiscount?: number;
    timeslotDiscount?: number;
  };
  paidHours: number;
}

export interface DiscountConfig {
  overallDiscountPercent?: number;
  groupDiscounts?: Array<{ minGuests: number; discountPercent: number }>;
  timeslotDiscounts?: Array<{ start: string; end: string; discountPercent: number }>;
  freeHourDiscounts?: Array<{ thresholdHours: number; freeHours: number; serviceIds?: string[] }>;
}

export const useVenueDiscountCalculation = (
  venueId: string,
  basePrice: number,
  durationHours: number,
  guestCount: number,
  bookingStartTime: string,
  bookingEndTime: string,
  enabled = true
) => {
  return useQuery({
    queryKey: [
      'venue-discount-calculation',
      venueId,
      basePrice,
      durationHours,
      guestCount,
      bookingStartTime,
      bookingEndTime,
    ],
    queryFn: async (): Promise<DiscountCalculationResult> => {
      // For now, use offline calculation since the RPC function doesn't exist yet
      const data = calculateDiscountOffline(basePrice, durationHours, guestCount, {});
      const error = null;

      if (error) {
        console.error('Error calculating venue discount:', error);
        // Return fallback calculation
        return calculateDiscountOffline(basePrice, durationHours, guestCount, {});
      }

      const result = data as any;
      return {
        originalPrice: result.originalPrice || basePrice,
        finalPrice: result.finalPrice || basePrice,
        totalSavings: result.totalSavings || 0,
        appliedDiscounts: result.appliedDiscounts || [],
        discountBreakdown: result.discountBreakdown || {},
        paidHours: result.paidHours || durationHours,
      };
    },
    enabled: enabled && !!venueId && basePrice > 0 && durationHours > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useServiceDiscountCalculation = (
  serviceId: string | undefined,
  basePrice: number,
  durationHours: number,
  guestCount: number,
  bookingStartTime: string,
  bookingEndTime: string,
  enabled = true
) => {
  return useQuery({
    queryKey: [
      'service-discount-calculation',
      serviceId,
      basePrice,
      durationHours,
      guestCount,
      bookingStartTime,
      bookingEndTime,
    ],
    queryFn: async (): Promise<DiscountCalculationResult> => {
      if (!serviceId) {
        return calculateDiscountOffline(basePrice, durationHours, guestCount, {});
      }

      // Fetch service data to get discount configuration
      const { data: serviceData } = await supabase
        .from('venue_services')
        .select('overall_discount_percent, group_discounts, timeslot_discounts, free_hour_discounts')
        .eq('id', serviceId)
        .maybeSingle();

      // Build discount config from service data only
      const discountConfig: DiscountConfig = {
        overallDiscountPercent: 0,
        groupDiscounts: [],
        timeslotDiscounts: [],
        freeHourDiscounts: []
      };

      console.log('Raw service data:', serviceData);

      // Apply service-level discounts
      if (serviceData) {
        if (serviceData.overall_discount_percent !== null && serviceData.overall_discount_percent !== undefined && serviceData.overall_discount_percent > 0) {
          discountConfig.overallDiscountPercent = Number(serviceData.overall_discount_percent);
          console.log('Applied service overall discount:', discountConfig.overallDiscountPercent);
        }
        
        if (serviceData.group_discounts && Array.isArray(serviceData.group_discounts) && serviceData.group_discounts.length > 0) {
          discountConfig.groupDiscounts = serviceData.group_discounts as any;
        }
        
        if (serviceData.timeslot_discounts && Array.isArray(serviceData.timeslot_discounts) && serviceData.timeslot_discounts.length > 0) {
          discountConfig.timeslotDiscounts = serviceData.timeslot_discounts as any;
        }
        
        if (serviceData.free_hour_discounts && Array.isArray(serviceData.free_hour_discounts) && serviceData.free_hour_discounts.length > 0) {
          discountConfig.freeHourDiscounts = serviceData.free_hour_discounts as any;
        }
      }

      console.log('Final discount config before calculation:', discountConfig);

      return calculateDiscountOffline(basePrice, durationHours, guestCount, discountConfig, bookingStartTime, bookingEndTime, serviceId);
    },
    enabled: enabled && !!serviceId && basePrice > 0 && durationHours > 0,
    staleTime: 0,
    gcTime: 0,
  });
};

export const calculateDiscountOffline = (
  basePrice: number,
  durationHours: number,
  guestCount: number,
  discountConfig: DiscountConfig,
  bookingStartTime?: string,
  bookingEndTime?: string,
  serviceId?: string
): DiscountCalculationResult => {
  let finalPrice = basePrice;
  const originalPrice = basePrice;
  let paidHours = durationHours;
  const appliedDiscounts: string[] = [];
  const discountBreakdown: any = {};

  // 1. Apply overall discount
  if (discountConfig.overallDiscountPercent && discountConfig.overallDiscountPercent > 0) {
    finalPrice = finalPrice * (1 - discountConfig.overallDiscountPercent / 100);
    appliedDiscounts.push('Overall Discount');
    discountBreakdown.overallDiscount = discountConfig.overallDiscountPercent;
  }

  // 2. Apply free hour discounts
  if (discountConfig.freeHourDiscounts && discountConfig.freeHourDiscounts.length > 0) {
    console.log('Applying free hour discounts:', discountConfig.freeHourDiscounts);
    console.log('Duration hours:', durationHours);
    
    for (const freeHourRule of discountConfig.freeHourDiscounts) {
      console.log('Checking free hour rule:', freeHourRule);
      
      // Check if this service is eligible for this free hour rule (if serviceIds is specified)
      const isServiceEligible = !freeHourRule.serviceIds || 
        freeHourRule.serviceIds.length === 0 || 
        (serviceId && freeHourRule.serviceIds.includes(serviceId));
      
      console.log('Service eligible for free hour rule:', isServiceEligible);
      
      if (isServiceEligible && durationHours >= (freeHourRule.thresholdHours + freeHourRule.freeHours)) {
        const blockSize = freeHourRule.thresholdHours + freeHourRule.freeHours;
        const completeBlocks = Math.floor(durationHours / blockSize);
        const remainingHours = durationHours % blockSize;
        
        console.log('Block size:', blockSize, 'Complete blocks:', completeBlocks, 'Remaining hours:', remainingHours);
        
        // Calculate paid hours: complete blocks pay only threshold hours + remaining hours
        const paidFromCompleteBlocks = completeBlocks * freeHourRule.thresholdHours;
        const chargedHours = paidFromCompleteBlocks + remainingHours;
        
        console.log('Paid from complete blocks:', paidFromCompleteBlocks, 'Total charged hours:', chargedHours);
        
        if (chargedHours < durationHours) {
          paidHours = chargedHours;
          finalPrice = finalPrice * (chargedHours / durationHours);
          appliedDiscounts.push('Free Hours');
          discountBreakdown.freeHours = durationHours - chargedHours;
          console.log('Applied free hours discount. Charged hours:', chargedHours, 'Free hours:', durationHours - chargedHours);
          break; // Only apply one free hour rule
        }
      }
    }
  }

  // 3. Apply group discount
  if (discountConfig.groupDiscounts && discountConfig.groupDiscounts.length > 0) {
    let groupDiscountPercent = 0;
    for (const groupRule of discountConfig.groupDiscounts) {
      if (guestCount >= groupRule.minGuests) {
        groupDiscountPercent = Math.max(groupDiscountPercent, groupRule.discountPercent);
      }
    }

    if (groupDiscountPercent > 0) {
      finalPrice = finalPrice * (1 - groupDiscountPercent / 100);
      appliedDiscounts.push('Group Discount');
      discountBreakdown.groupDiscount = groupDiscountPercent;
    }
  }

  // 4. Apply timeslot discount proportionally
  if (
    discountConfig.timeslotDiscounts &&
    discountConfig.timeslotDiscounts.length > 0 &&
    bookingStartTime &&
    bookingEndTime
  ) {
    for (const timeslotRule of discountConfig.timeslotDiscounts) {
      // Calculate overlap between booking time and discount time
      const discountStart = timeslotRule.start;
      const discountEnd = timeslotRule.end;
      
      // Find the overlap period
      const overlapStart = bookingStartTime >= discountStart ? bookingStartTime : discountStart;
      const overlapEnd = bookingEndTime <= discountEnd ? bookingEndTime : discountEnd;
      
      if (overlapStart < overlapEnd) {
        // Calculate overlap hours
        const [overlapStartHour, overlapStartMin] = overlapStart.split(':').map(Number);
        const [overlapEndHour, overlapEndMin] = overlapEnd.split(':').map(Number);
        const overlapHours = (overlapEndHour + overlapEndMin/60) - (overlapStartHour + overlapStartMin/60);
        
        if (overlapHours > 0) {
          // Apply discount proportionally to overlapping hours
          const discountAmount = (finalPrice * (overlapHours / durationHours)) * (timeslotRule.discountPercent / 100);
          finalPrice = finalPrice - discountAmount;
          
          appliedDiscounts.push('Timeslot Discount');
          discountBreakdown.timeslotDiscount = timeslotRule.discountPercent;
          console.log(`Applied timeslot discount: ${overlapHours} hours at ${timeslotRule.discountPercent}% discount`);
          break; // Only apply the first matching timeslot discount
        }
      }
    }
  }

  return {
    originalPrice,
    finalPrice: Math.round(finalPrice * 100) / 100,
    totalSavings: Math.round((originalPrice - finalPrice) * 100) / 100,
    appliedDiscounts,
    discountBreakdown,
    paidHours,
  };
};
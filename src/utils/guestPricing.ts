import { isPerTableService } from "@/constants/services";

export interface GuestPricingRule {
  maxGuests: number;
  price: number;
}

export interface ServiceWithGuestPricing {
  id: string;
  name?: string;
  service_type?: string;
  price: number; // Legacy field - base price (per table for certain services)
  guest_pricing_rules?: GuestPricingRule[];
  images?: string[];
  service_games?: string[];
}

/**
 * Calculate price for a service based on guest count using pricing rules
 * For per-table services (PC Gaming, Billiards), pricing is per table and does not depend on guests
 */
export const calculateGuestPrice = (
  service: ServiceWithGuestPricing,
  guestCount: number
): number | null => {
  // Per-table services: ignore guestCount and rules, use flat per-table price
  if (isPerTableService(service.service_type)) {
    return service.price;
  }

  // If no guest pricing rules are defined, fall back to legacy per-guest price
  if (!service.guest_pricing_rules || service.guest_pricing_rules.length === 0) {
    return service.price * guestCount;
  }

  // Sort rules by maxGuests to find the best match
  const sortedRules = [...service.guest_pricing_rules].sort((a, b) => a.maxGuests - b.maxGuests);
  
  // Find the lowest rule where guestCount <= maxGuests
  const matchingRule = sortedRules.find(rule => guestCount <= rule.maxGuests);
  
  return matchingRule ? matchingRule.price : null;
};

/**
 * Get the maximum guest count supported by a service
 */
export const getMaxGuestCount = (service: ServiceWithGuestPricing): number | null => {
  if (isPerTableService(service.service_type)) return null; // Not applicable

  if (!service.guest_pricing_rules || service.guest_pricing_rules.length === 0) {
    return null; // No limit with legacy pricing
  }

  const maxRule = service.guest_pricing_rules.reduce((max, rule) =>
    rule.maxGuests > max.maxGuests ? rule : max
  );
  
  return maxRule.maxGuests;
};

/**
 * Check if a guest count is valid for a service
 */
export const isValidGuestCount = (
  service: ServiceWithGuestPricing,
  guestCount: number
): boolean => {
  if (isPerTableService(service.service_type)) return true; // Always valid
  const price = calculateGuestPrice(service, guestCount);
  return price !== null;
};

/**
 * Get the display price for a service (lowest available price)
 */
export const getServiceDisplayPrice = (service: ServiceWithGuestPricing): string => {
  if (isPerTableService(service.service_type)) {
    return `${service.price} GEL/table`;
  }

  if (!service.guest_pricing_rules || service.guest_pricing_rules.length === 0) {
    return `${service.price} GEL/guest`;
  }

  if (service.guest_pricing_rules.length === 0) {
    return 'Custom pricing';
  }

  const lowestPrice = Math.min(...service.guest_pricing_rules.map(rule => rule.price));
  return `From ${lowestPrice} GEL`;
};

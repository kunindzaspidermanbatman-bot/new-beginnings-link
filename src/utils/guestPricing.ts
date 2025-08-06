export interface GuestPricingRule {
  maxGuests: number;
  price: number;
}

export interface ServiceWithGuestPricing {
  id: string;
  name?: string;
  service_type?: string;
  price: number; // Legacy field - will be deprecated
  guest_pricing_rules?: GuestPricingRule[];
  images?: string[];
  service_games?: string[];
}

/**
 * Calculate price for a service based on guest count using pricing rules
 * @param service - Service with guest pricing rules
 * @param guestCount - Number of guests
 * @returns Total price for the guest count, or null if no valid rule found
 */
export const calculateGuestPrice = (
  service: ServiceWithGuestPricing, 
  guestCount: number
): number | null => {
  // If no guest pricing rules are defined, fall back to legacy price calculation
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
 * @param service - Service with guest pricing rules
 * @returns Maximum guest count or null if unlimited
 */
export const getMaxGuestCount = (service: ServiceWithGuestPricing): number | null => {
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
 * @param service - Service with guest pricing rules
 * @param guestCount - Number of guests
 * @returns True if guest count is supported
 */
export const isValidGuestCount = (
  service: ServiceWithGuestPricing, 
  guestCount: number
): boolean => {
  const price = calculateGuestPrice(service, guestCount);
  return price !== null;
};

/**
 * Get the display price for a service (lowest available price)
 * @param service - Service with guest pricing rules
 * @returns Display price string
 */
export const getServiceDisplayPrice = (service: ServiceWithGuestPricing): string => {
  if (!service.guest_pricing_rules || service.guest_pricing_rules.length === 0) {
    return `${service.price} GEL/guest`;
  }

  if (service.guest_pricing_rules.length === 0) {
    return 'Custom pricing';
  }

  const lowestPrice = Math.min(...service.guest_pricing_rules.map(rule => rule.price));
      return `From ${lowestPrice} GEL`;
};
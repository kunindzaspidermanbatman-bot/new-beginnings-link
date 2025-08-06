
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Venue {
  id: string;
  name: string;
  location: string;
  district: string;
  rating: number;
  review_count: number;
  price: number;
  category: string;
  images: string[];
  amenities: string[];
  opening_time?: string;
  closing_time?: string;
  partner_id: string;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  description?: string;
  latitude?: number;
  longitude?: number;
}

export interface VenueService {
  id: string;
  venue_id: string;
  name: string;
  price: number;
  service_type: 'PC Gaming' | 'PlayStation 5' | 'Billiards' | 'Table Tennis';
  images: string[];
  service_games?: string[];
  guest_pricing_rules?: Array<{ maxGuests: number; price: number }>;
  overall_discount_percent?: number;
  group_discounts?: Array<{ minGuests: number; discountPercent: number }>;
  timeslot_discounts?: Array<{ start: string; end: string; discountPercent: number }>;
  free_hour_discounts?: Array<{ thresholdHours: number; freeHours: number; serviceIds?: string[] }>;
}

export const useVenues = (showHidden = true) => {
  return useQuery({
    queryKey: ['venues', showHidden],
    queryFn: async () => {
      let query = supabase
        .from('venues')
        .select(`
          id,
          name,
          location,
          district,
          rating,
          review_count,
          price,
          category,
          images,
          amenities,
          opening_time,
          closing_time,
          partner_id,
          is_visible,
          created_at,
          updated_at,
          description,
          latitude,
          longitude
        `)
        .order('created_at', { ascending: false });

      if (!showHidden) {
        query = query.eq('is_visible', true);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data as Venue[];
    },
  });
};

export const useVenue = (id: string) => {
  return useQuery({
    queryKey: ['venue', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venues')
        .select(`
          id,
          name,
          location,
          district,
          rating,
          review_count,
          price,
          category,
          images,
          amenities,
          opening_time,
          closing_time,
          partner_id,
          is_visible,
          created_at,
          updated_at,
          description,
          latitude,
          longitude
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data as Venue;
    },
    enabled: !!id,
  });
};

export const useVenueServices = (venueId: string) => {
  return useQuery({
    queryKey: ['venue-services', venueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venue_services')
        .select('*')
        .eq('venue_id', venueId)
        .order('price', { ascending: true });

      if (error) {
        throw error;
      }

      return data?.map(service => ({
        ...service,
        guest_pricing_rules: Array.isArray(service.guest_pricing_rules) 
          ? service.guest_pricing_rules as Array<{ maxGuests: number; price: number }>
          : [],
        group_discounts: Array.isArray(service.group_discounts) 
          ? service.group_discounts as Array<{ minGuests: number; discountPercent: number }>
          : [],
        timeslot_discounts: Array.isArray(service.timeslot_discounts) 
          ? service.timeslot_discounts as Array<{ start: string; end: string; discountPercent: number }>
          : [],
        free_hour_discounts: Array.isArray(service.free_hour_discounts) 
          ? service.free_hour_discounts as Array<{ thresholdHours: number; freeHours: number; serviceIds?: string[] }>
          : []
      })) as VenueService[];
    },
    enabled: !!venueId,
  });
};

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Booking {
  id: string;
  venue_id: string;
  service_id: string | null;
  booking_date: string;
  booking_time: string;
  guest_count: number;
  total_price: number;
  status: string;
  special_requests: string | null;
  created_at: string;
  updated_at: string;
  venues?: {
    name: string;
    location: string;
    images: string[];
  };
  venue_services?: {
    name: string;
    service_type: string;
  };
  booking_services?: Array<{
    id: string;
    service_id: string;
    arrival_time: string;
    departure_time: string;
    guest_count: number;
    table_configurations: any;
    venue_services: {
      name: string;
      service_type: string;
    };
  }>;
}

export const useUserBookings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-bookings', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      console.log('Fetching bookings for user:', user.id);
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          venues (
            name,
            location,
            images
          ),
          venue_services (
            name,
            service_type
          ),
          booking_services(
            id,
            service_id,
            arrival_time,
            departure_time,
            guest_count,
            table_configurations,
            venue_services(name, service_type)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log('Bookings query result:', { data, error });

      if (error) {
        console.error('Booking fetch error:', error);
        throw error;
      }

      return data?.map(booking => ({
        ...booking,
        booking_services: (booking.booking_services || []).map(service => ({
          ...service,
          table_configurations: typeof service.table_configurations === 'string' 
            ? JSON.parse(service.table_configurations) 
            : service.table_configurations
        }))
      })) as Booking[];
    },
    enabled: !!user,
  });
};
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
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log('Bookings query result:', { data, error });

      if (error) {
        console.error('Booking fetch error:', error);
        throw error;
      }

      return data as Booking[];
    },
    enabled: !!user,
  });
};
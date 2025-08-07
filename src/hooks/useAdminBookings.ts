import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AdminBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  guest_count: number;
  total_price: number;
  status: string;
  special_requests: string | null;
  selected_games: string[] | null;
  user_email: string | null;
  created_at: string;
  venue_id: string;
  user_id: string;
  venue_name?: string;
  venue_location?: string;
  user_full_name?: string;
  user_email_profile?: string;
  booking_services?: Array<{
    id: string;
    table_configurations: any;
  }>;
}

export const useAdminBookings = (status?: string) => {
  return useQuery({
    queryKey: ['admin-bookings', status],
    queryFn: async () => {
      // First, get bookings
      let bookingsQuery = supabase
        .from('bookings')
        .select(`
          *,
          booking_services (
            id,
            table_configurations
          )
        `)
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        bookingsQuery = bookingsQuery.eq('status', status);
      }

      const { data: bookings, error: bookingsError } = await bookingsQuery;

      if (bookingsError) throw bookingsError;

      if (!bookings || bookings.length === 0) {
        return [];
      }

      // Get unique venue IDs and user IDs
      const venueIds = [...new Set(bookings.map(b => b.venue_id))];
      const userIds = [...new Set(bookings.map(b => b.user_id))];

      // Fetch venues
      const { data: venues } = await supabase
        .from('venues')
        .select('id, name, location')
        .in('id', venueIds);

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      // Combine the data
      const enrichedBookings: AdminBooking[] = bookings.map(booking => {
        const venue = venues?.find(v => v.id === booking.venue_id);
        const profile = profiles?.find(p => p.id === booking.user_id);

        return {
          ...booking,
          venue_name: venue?.name || 'Unknown Venue',
          venue_location: venue?.location || 'Unknown Location',
          user_full_name: profile?.full_name || 'Guest',
          user_email_profile: profile?.email || booking.user_email || 'No email',
          selected_games: (booking as any).selected_games || [],
        };
      });

      return enrichedBookings;
    },
  });
};

export const useBookingStats = () => {
  return useQuery({
    queryKey: ['booking-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('status, total_price, created_at');

      if (error) throw error;

      const stats = {
        total: data.length,
        pending: data.filter(b => b.status === 'pending').length,
        confirmed: data.filter(b => b.status === 'confirmed').length,
        completed: data.filter(b => b.status === 'completed').length,
        cancelled: data.filter(b => b.status === 'cancelled').length,
        totalRevenue: data
          .filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + Number(b.total_price), 0),
        thisMonth: data.filter(b => {
          const bookingDate = new Date(b.created_at);
          const now = new Date();
          return bookingDate.getMonth() === now.getMonth() && 
                 bookingDate.getFullYear() === now.getFullYear();
        }).length,
      };

      return stats;
    },
  });
};

export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking-stats'] });
      toast({
        title: "Success",
        description: "Booking status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive",
      });
    },
  });
};
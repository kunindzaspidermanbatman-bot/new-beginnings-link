import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Review {
  id: string;
  venue_id: string;
  user_id: string;
  booking_id?: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
}

export interface CreateReviewData {
  venue_id: string;
  booking_id?: string;
  rating: number;
  comment?: string;
}

export const useVenueReviews = (venueId: string) => {
  return useQuery({
    queryKey: ['venue-reviews', venueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('venue_id', venueId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Get user names for reviews
      const reviewsWithUserNames = await Promise.all(
        (data || []).map(async (review) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', review.user_id)
            .single();
          
          return {
            ...review,
            user_name: profile?.full_name || 'Anonymous'
          };
        })
      );
      
      return reviewsWithUserNames as Review[];
    },
  });
};

export const useUserReviewForVenue = (venueId: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-review', venueId, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('venue_id', venueId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Review | null;
    },
    enabled: !!user?.id,
  });
};

export const useUserReviewForBooking = (bookingId: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-review-for-booking', bookingId, user?.id],
    queryFn: async () => {
      if (!user?.id || !bookingId) return null;
      
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('booking_id', bookingId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Review | null;
    },
    enabled: !!user?.id && !!bookingId,
  });
};

// Check if user has completed bookings for this venue (departed)
export const useUserCompletedBookings = (venueId: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-completed-bookings', venueId, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const now = new Date();
      
      // Get bookings with their services to check departure times
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          booking_services (
            departure_time,
            arrival_time
          )
        `)
        .eq('venue_id', venueId)
        .eq('user_id', user.id)
        .eq('status', 'confirmed');

      if (error) throw error;
      
      // Filter bookings where departure time has passed
      const completedBookings = (data || []).filter(booking => {
        const bookingDate = new Date(booking.booking_date);
        
        // If booking has services with departure times, use those
        if (booking.booking_services && booking.booking_services.length > 0) {
          return booking.booking_services.some((service: any) => {
            const departureDateTime = new Date(`${booking.booking_date}T${service.departure_time}`);
            return departureDateTime < now;
          });
        }
        
        // Fallback: check if booking date has passed
        return bookingDate < now;
      });
      
      return completedBookings;
    },
    enabled: !!user?.id,
  });
};

// Get all user completed bookings across all venues for review reminders
export const useAllUserCompletedBookings = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['all-completed-bookings', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const now = new Date();
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          venues (
            id,
            name,
            images
          ),
          booking_services (
            departure_time,
            arrival_time
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'confirmed');

      if (error) throw error;
      
      // Filter bookings where departure time has passed
      const completedBookings = (data || []).filter(booking => {
        const bookingDate = new Date(booking.booking_date);
        
        if (booking.booking_services && booking.booking_services.length > 0) {
          return booking.booking_services.some((service: any) => {
            const departureDateTime = new Date(`${booking.booking_date}T${service.departure_time}`);
            return departureDateTime < now;
          });
        }
        
        return bookingDate < now;
      });
      
      return completedBookings;
    },
    enabled: !!user?.id,
  });
};

export const useCreateReview = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewData: CreateReviewData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('reviews')
        .insert([{
          ...reviewData,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['venue-reviews', data.venue_id] });
      queryClient.invalidateQueries({ queryKey: ['user-review', data.venue_id] });
      queryClient.invalidateQueries({ queryKey: ['user-review-for-booking', data.booking_id] });
      queryClient.invalidateQueries({ queryKey: ['venues'] });
    },
  });
};

export const useUpdateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Review> & { id: string }) => {
      const { data, error } = await supabase
        .from('reviews')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['venue-reviews', data.venue_id] });
      queryClient.invalidateQueries({ queryKey: ['user-review', data.venue_id] });
      queryClient.invalidateQueries({ queryKey: ['venues'] });
    },
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['venue-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['user-review'] });
      queryClient.invalidateQueries({ queryKey: ['venues'] });
    },
  });
};
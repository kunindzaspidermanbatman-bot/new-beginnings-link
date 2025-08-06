import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUserBookings } from '@/hooks/useBookings';
import { useUserReviewForBooking } from '@/hooks/useReviews';
import { useAuth } from '@/hooks/useAuth';
import ReviewForm from '@/components/ReviewForm';
import { isAfter, parse } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export const PostVisitReviewDialog = () => {
  const { user } = useAuth();
  const { data: bookings } = useUserBookings();
  const [currentBookingForReview, setCurrentBookingForReview] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reviewedBookings, setReviewedBookings] = useState<Set<string>>(new Set());
  const [ignoredBookings, setIgnoredBookings] = useState<Set<string>>(() => {
    // Load ignored bookings from localStorage
    const stored = localStorage.getItem('ignoredReviewBookings');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  // Check if user has existing review for the current booking
  const { data: existingReview } = useUserReviewForBooking(
    currentBookingForReview?.id || ''
  );

  useEffect(() => {
    if (!user || !bookings || bookings.length === 0) return;

    const checkBookingsForReview = async () => {
      const now = new Date();
      console.log('PostVisitReviewDialog: Current time:', now.toISOString());
      console.log('PostVisitReviewDialog: Available bookings:', bookings.length);
      
      // Find completed bookings that haven't been reviewed
      const completedBookingsNeedingReview = [];
      
      for (const booking of bookings) {
        console.log('PostVisitReviewDialog: Checking booking:', booking.id, 'Status:', booking.status, 'Date:', booking.booking_date, 'Time:', booking.booking_time);
        
        // Skip if we already showed review dialog for this booking
        if (reviewedBookings.has(booking.id)) {
          console.log('PostVisitReviewDialog: Already reviewed:', booking.id);
          continue;
        }
        
        // Skip if user permanently ignored this booking
        if (ignoredBookings.has(booking.id)) {
          console.log('PostVisitReviewDialog: Permanently ignored:', booking.id);
          continue;
        }
        
        // Skip if booking isn't confirmed
        if (booking.status !== 'confirmed') {
          console.log('PostVisitReviewDialog: Not confirmed:', booking.id, booking.status);
          continue;
        }
        
        // Check if booking time has passed
        try {
          const bookingDateTime = parse(
            `${booking.booking_date} ${booking.booking_time}`,
            'yyyy-MM-dd HH:mm:ss',
            new Date()
          );
          
          // Add duration based on booking data (default to 1 hour)
          const durationMs = 1 * 60 * 60 * 1000; // 1 hour in milliseconds
          const bookingEndTime = new Date(bookingDateTime.getTime() + durationMs);
          
          console.log('PostVisitReviewDialog: Booking', booking.id, 'ends at:', bookingEndTime.toISOString(), 'Current time:', now.toISOString());
          
          const hasEnded = isAfter(now, bookingEndTime);
          console.log('PostVisitReviewDialog: Booking has ended:', hasEnded);
          
          if (!hasEnded) continue;
          
          // Check if user already has a review for this booking
          const { data: existingReviewForBooking } = await supabase
            .from('reviews')
            .select('id')
            .eq('booking_id', booking.id)
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (existingReviewForBooking) {
            console.log('PostVisitReviewDialog: Found existing review for booking:', booking.id);
            // Mark as reviewed so it doesn't show again
            setReviewedBookings(prev => new Set(prev).add(booking.id));
            continue;
          }
          
          completedBookingsNeedingReview.push(booking);
        } catch (error) {
          console.error('PostVisitReviewDialog: Error parsing booking time:', error);
          continue;
        }
      }

      console.log('PostVisitReviewDialog: Completed bookings needing review:', completedBookingsNeedingReview.length);
      
      // Show dialog for the first completed booking that needs review
      if (completedBookingsNeedingReview.length > 0 && !dialogOpen) {
        const bookingToReview = completedBookingsNeedingReview[0];
        console.log('PostVisitReviewDialog: Setting booking for review:', bookingToReview.id);
        setCurrentBookingForReview(bookingToReview);
        setDialogOpen(true);
      }
    };

    checkBookingsForReview();
  }, [bookings, user, dialogOpen, reviewedBookings, ignoredBookings]);

  const handleCloseDialog = () => {
    if (currentBookingForReview) {
      // Mark this booking as having been shown the review dialog
      setReviewedBookings(prev => new Set(prev).add(currentBookingForReview.id));
    }
    setDialogOpen(false);
    setCurrentBookingForReview(null);
  };

  const handleIgnoreDialog = () => {
    if (currentBookingForReview) {
      // Permanently ignore this booking
      const newIgnoredBookings = new Set(ignoredBookings).add(currentBookingForReview.id);
      setIgnoredBookings(newIgnoredBookings);
      
      // Save to localStorage
      localStorage.setItem('ignoredReviewBookings', JSON.stringify([...newIgnoredBookings]));
      
      console.log('PostVisitReviewDialog: Permanently ignored booking:', currentBookingForReview.id);
    }
    setDialogOpen(false);
    setCurrentBookingForReview(null);
  };

  const handleReviewSuccess = () => {
    handleCloseDialog();
  };

  if (!currentBookingForReview || !dialogOpen) return null;

  return (
    <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
      <DialogContent className="sm:max-w-md max-w-[95vw] mx-4">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">How was your visit?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="font-semibold text-base sm:text-lg">
              {currentBookingForReview.venues?.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {currentBookingForReview.venues?.location}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Visited on {new Date(currentBookingForReview.booking_date).toLocaleDateString()}
            </p>
          </div>
          
          <ReviewForm
            venueId={currentBookingForReview.venue_id}
            bookingId={currentBookingForReview.id}
            existingReview={existingReview}
            onSuccess={handleReviewSuccess}
          />
          
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleIgnoreDialog}
              className="flex-1 text-sm"
            >
              Don't ask again
            </Button>
            <Button
              variant="ghost"
              onClick={handleCloseDialog}
              className="flex-1 text-sm"
            >
              Maybe later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
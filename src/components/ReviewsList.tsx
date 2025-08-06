import { useState } from 'react';
import { format } from 'date-fns';
import { Star, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useVenueReviews, useDeleteReview, useUserReviewForVenue, useUserCompletedBookings, type Review } from '@/hooks/useReviews';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import ReviewForm from './ReviewForm';

interface ReviewsListProps {
  venueId: string;
}

const ReviewsList = ({ venueId }: ReviewsListProps) => {
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  const { user } = useAuth();
  const { data: reviews, isLoading } = useVenueReviews(venueId);
  const { data: userReview } = useUserReviewForVenue(venueId);
  const { data: completedBookings, isLoading: bookingsLoading } = useUserCompletedBookings(venueId);
  const deleteReview = useDeleteReview();
  const { toast } = useToast();

  const hasCompletedBookings = completedBookings && completedBookings.length > 0;
  const canWriteReview = user && hasCompletedBookings && !userReview;

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete your review?')) return;
    
    try {
      await deleteReview.mutateAsync(reviewId);
      toast({
        title: "Review deleted",
        description: "Your review has been successfully deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete review. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Reviews</h3>
        <p className="text-muted-foreground">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Reviews ({reviews?.length || 0})</h3>
        
        {canWriteReview && (
          <Button onClick={() => setShowReviewForm(true)}>
            Write a Review
          </Button>
        )}
        
        {user && !hasCompletedBookings && !bookingsLoading && (
          <p className="text-sm text-muted-foreground">
            Complete a booking to write a review
          </p>
        )}
      </div>

      {/* Review Form */}
      {(showReviewForm || editingReview) && (
        <ReviewForm
          venueId={venueId}
          existingReview={editingReview}
          onSuccess={() => {
            setShowReviewForm(false);
            setEditingReview(null);
          }}
        />
      )}

      {/* User's existing review with edit option */}
      {userReview && !editingReview && !showReviewForm && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {renderStars(userReview.rating)}
                  <span className="text-sm text-muted-foreground">Your review</span>
                </div>
                {userReview.comment && (
                  <p className="text-sm mb-2">{userReview.comment}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {format(new Date(userReview.created_at), 'MMM d, yyyy')}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingReview(userReview)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteReview(userReview.id)}
                  disabled={deleteReview.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other reviews */}
      <div className="space-y-4">
        {reviews?.filter(review => review.user_id !== user?.id).map((review) => (
          <Card key={review.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {renderStars(review.rating)}
                  <span className="font-medium text-sm">
                    {review.user_name || 'Anonymous'}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(review.created_at), 'MMM d, yyyy')}
                </span>
              </div>
              {review.comment && (
                <p className="text-sm text-muted-foreground mt-2">
                  {review.comment}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {(!reviews || reviews.length === 0) && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              No reviews yet. Be the first to share your experience!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReviewsList;

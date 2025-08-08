import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, MapPin, Users, Calendar, CreditCard, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useVenue, useVenueServices } from "@/hooks/useVenues";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import AuthDialog from "@/components/AuthDialog";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import SavedPaymentMethods from "@/components/SavedPaymentMethods";
import { SavedPaymentMethod } from "@/hooks/useSavedPaymentMethods";

// Stripe publishable key
const stripePromise = loadStripe("pk_test_51Rab7tAcy0JncB9qlWWNkyQxCYjs4RqFlY5OYSkBLfSVBqxv5q7d38jkbXVDmyE7jLxoCKxheJ95hc0f9atUVjBp00OmeyVbjo");

// Enhanced Payment Form Component with One-time Payment Option
const PaymentForm = ({ bookingData, onSuccess, onError, disabled, useOneTimeFlow = false }: any) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<SavedPaymentMethod | null>(null);
  const [useOneTimePayment, setUseOneTimePayment] = useState(useOneTimeFlow);

  useEffect(() => {
    if (bookingData && user) {
      createPaymentIntent();
    }
  }, [bookingData, user]);

  const createPaymentIntent = async (paymentMethodId?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: bookingData.discountedTotal || bookingData.totalPrice,
          currency: 'usd',
          paymentMethodId,
          bookingData: {
            venueId: bookingData.venueId,
            venueName: bookingData.venueName,
            date: bookingData.date,
            time: bookingData.arrivalTime,
            guests: bookingData.guests,
          },
        },
      });

      if (error) throw error;
      setClientSecret(data.clientSecret);
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      onError(error.message || 'Failed to initialize payment');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !clientSecret || disabled) {
      return;
    }

    setIsProcessing(true);

    try {
      let paymentIntent;

      if (selectedPaymentMethod && !useOneTimePayment) {
        // Use saved payment method
        const { error: confirmError, paymentIntent: intent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: selectedPaymentMethod.stripe_payment_method_id,
          return_url: window.location.origin + window.location.pathname,
        });

        if (confirmError) {
          throw new Error(confirmError.message);
        }
        paymentIntent = intent;
      } else if (useOneTimePayment) {
        // Use one-time payment without saving
        if (!elements) {
          throw new Error('Payment form not loaded');
        }

        const card = elements.getElement(CardElement);
        if (!card) {
          throw new Error('Payment form not loaded');
        }

        const { error: confirmError, paymentIntent: intent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: card,
            billing_details: {
              name: user?.email || '',
              email: user?.email || '',
            },
          },
          return_url: window.location.origin + window.location.pathname,
        });

        if (confirmError) {
          throw new Error(confirmError.message);
        }
        paymentIntent = intent;
      } else {
        throw new Error('Please select a payment method or choose one-time payment');
      }

      if (paymentIntent.status === 'succeeded') {
        // Confirm payment with backend
        const { data, error } = await supabase.functions.invoke('confirm-payment', {
          body: {
            paymentIntentId: paymentIntent.id,
            bookingData: {
              venueId: bookingData.venueId,
              venueName: bookingData.venueName,
              serviceIds: bookingData.serviceIds,
              serviceBookings: bookingData.serviceBookings,
              date: bookingData.date,
              time: bookingData.arrivalTime,
              guests: bookingData.guests,
              total: bookingData.discountedTotal || bookingData.totalPrice,
              specialRequests: bookingData.specialRequests,
            },
          },
        });

        if (error) throw error;
        onSuccess(data);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      onError(error.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentMethodSelect = (paymentMethod: SavedPaymentMethod | null) => {
    setSelectedPaymentMethod(paymentMethod);
    setUseOneTimePayment(false);
    // Create new payment intent with the selected payment method
    if (paymentMethod) {
      createPaymentIntent(paymentMethod.stripe_payment_method_id);
    }
  };

  const handleUseOneTimePayment = () => {
    setUseOneTimePayment(true);
    setSelectedPaymentMethod(null);
    // Create new payment intent without a payment method for one-time payment
    createPaymentIntent();
  };

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-sm text-muted-foreground">Initializing payment...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Saved Payment Methods - only show if not in one-time flow */}
      {!useOneTimePayment && (
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Choose Payment Method</h4>
          
          <SavedPaymentMethods
            onPaymentMethodSelect={handlePaymentMethodSelect}
            selectedPaymentMethodId={selectedPaymentMethod?.stripe_payment_method_id}
            showAddNew={false}
          />
          
          {/* One-time Payment Option */}
          <div className="space-y-4">
            <Button
              type="button"
              variant={useOneTimePayment ? "default" : "outline"}
              onClick={handleUseOneTimePayment}
              className="w-full"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Pay with New Card (One-time)
            </Button>
          </div>
        </div>
      )}

      {/* One-time Payment Form - show when useOneTimePayment is true */}
      {useOneTimePayment && (
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Choose Payment Method</h4>
          <div className="p-4 border border-border/50 rounded-xl bg-background/50">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: 'hsl(var(--foreground))',
                    '::placeholder': {
                      color: 'hsl(var(--muted-foreground))',
                    },
                  },
                },
              }}
            />
          </div>
          
          <div className="text-sm text-muted-foreground">
            This card will not be saved for future payments
          </div>
        </div>
      )}
      
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="w-3 h-3" />
        <span>Your payment information is secure and encrypted</span>
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing || disabled || (!selectedPaymentMethod && !useOneTimePayment)}
        className="w-full pulse-glow bg-gradient-to-r from-primary to-secondary"
      >
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Processing payment...
          </div>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Pay {bookingData.discountedTotal ? bookingData.discountedTotal.toFixed(2) : bookingData.totalPrice} GEL
          </>
        )}
      </Button>
    </form>
  );
};

interface BookingData {
  venueId: string;
  venueName: string;
  serviceIds: string[];
  date: string;
  arrivalTime: string;
  departureTime: string;
  serviceBookings: Array<{
    serviceId: string;
    arrivalTime: string;
    departureTime: string;
    numberOfTables?: number;
    tableConfigurations?: Array<{
      table_number: number;
      guest_count: number;
    }>;
    selectedGames?: string[];
    originalPrice?: number;
    finalPrice?: number;
    savings?: number;
    appliedDiscounts?: string[];
    discountBreakdown?: any;
  }>;
  guests: number;
  specialRequests?: string;
  totalPrice: number;
  discountedTotal?: number;
  totalSavings?: number;
}

interface LocationState {
  bookingData: BookingData;
  requiresAuth?: boolean;
}

const ConfirmAndPay = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const locationState = location.state as LocationState;
  const bookingData = locationState?.bookingData;
  
  const { data: venue } = useVenue(bookingData?.venueId);
  const { data: services } = useVenueServices(bookingData?.venueId || '');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentMethodAdded, setPaymentMethodAdded] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [useOneTimePaymentFlow, setUseOneTimePaymentFlow] = useState(false);

  useEffect(() => {
    if (!bookingData) {
      navigate('/');
      return;
    }
  }, [bookingData, navigate]);

  if (!bookingData || !venue) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Booking not found</h1>
          <Button onClick={() => navigate('/')}>Return to Home</Button>
        </div>
      </div>
    );
  }

  const handleContinue = async () => {
    if (!user && currentStep === 1) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to continue with your booking.",
      });
      return;
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePaymentSuccess = (data: any) => {
    setBookingComplete(true);
    toast({
      title: "Booking Request Submitted!",
      description: "Your booking request has been submitted and payment processed. The venue partner will review and confirm your booking shortly.",
    });
    
    setTimeout(() => {
      navigate('/booking-history');
    }, 2000);
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive",
    });
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => Math.max(1, prev - 1));
      return;
    }
    navigate(-1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "EEEE, MMM d, yyyy");
  };

  const formatTime = (timeString: string) => {
    if (!timeString || timeString === '') {
      return 'Not selected';
    }
    const [hours, minutes] = timeString.split(':');
    if (!hours || !minutes) {
      return 'Invalid time';
    }
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  };

  const getServiceName = (serviceId: string) => {
    const service = services?.find(s => s.id === serviceId);
    return service?.name || 'Unknown Service';
  };

  const getTotalTables = () => {
    if (!bookingData.serviceBookings || bookingData.serviceBookings.length === 0) {
      return 0;
    }
    
    return bookingData.serviceBookings.reduce((total, booking) => {
      if (booking.tableConfigurations && booking.tableConfigurations.length > 0) {
        return total + booking.tableConfigurations.length;
      }
      return total + (booking.numberOfTables || 1); // Fallback to numberOfTables or 1
    }, 0);
  };

  const getTotalGuests = () => {
    if (!bookingData.serviceBookings || bookingData.serviceBookings.length === 0) {
      return bookingData.guests; // Fallback to main guest count
    }
    
    return bookingData.serviceBookings.reduce((total, booking) => {
      if (booking.tableConfigurations && booking.tableConfigurations.length > 0) {
        // Sum up guests from all table configurations
        return total + booking.tableConfigurations.reduce((tableTotal, config) => {
          return tableTotal + config.guest_count;
        }, 0);
      }
      return total + bookingData.guests; // Fallback to main guest count
    }, 0);
  };

  const getServiceGuests = (serviceBooking: any) => {
    if (serviceBooking.tableConfigurations && serviceBooking.tableConfigurations.length > 0) {
      return serviceBooking.tableConfigurations.reduce((total: number, config: any) => {
        return total + config.guest_count;
      }, 0);
    }
    return bookingData.guests; // Fallback to main guest count
  };

  // Use the discounted total from booking data if available, otherwise calculate it
  const discountedTotal = bookingData.discountedTotal || bookingData.totalPrice;
  const totalSavings = bookingData.totalSavings || 0;

  return (
    <Elements stripe={stripePromise}>
      <div className="min-h-screen bg-background">
        {/* Floating back-to-venue arrow (non-animated, high contrast) */}
        <div className="fixed left-4 top-24 z-50" aria-hidden="false">
          <Button
            variant="default"
            size="icon-lg"
            onClick={() => navigate(`/venue/${bookingData.venueId}` , { state: { bookingData } })}
            className="rounded-full shadow-xl ring-1 ring-primary/30 hover:bg-primary/80 hover:shadow-primary/30 hover:scale-100 active:scale-100"
            aria-label="Back to venue"
            title="Back to venue"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
        {/* Header */}
        <div className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold gradient-text">Confirm and pay</h1>
            </div>
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Side - Steps */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Step 1 - Login */}
            <Card className={`glass-effect transition-all duration-200 ${currentStep === 1 ? 'border-primary/50' : 'border-border/50'}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      user ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Log in or sign up</h3>
                      {user && (
                        <p className="text-sm text-muted-foreground">Logged in as {user.email}</p>
                      )}
                    </div>
                  </div>
                   {currentStep === 1 && (
                     <>
                       {user ? (
                         <Button 
                           onClick={handleContinue}
                           className="pulse-glow"
                         >
                           Continue
                         </Button>
                       ) : (
                         <div className="flex gap-2">
                           <AuthDialog defaultMode="signin">
                             <Button className="pulse-glow">
                               Log in
                             </Button>
                           </AuthDialog>
                           <AuthDialog defaultMode="signup">
                             <Button variant="outline">
                               Sign up
                             </Button>
                           </AuthDialog>
                         </div>
                       )}
                     </>
                   )}
                </div>
              </CardContent>
            </Card>

            {/* Step 2 - Payment Method */}
            <Card className={`glass-effect transition-all duration-200 ${
              currentStep === 2 ? 'border-primary/50' : currentStep > 2 ? 'border-primary/30' : 'border-border/30 opacity-60'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Add a payment method</h3>
                      {currentStep > 2 && (
                        <p className="text-sm text-muted-foreground">Payment methods ready</p>
                      )}
                    </div>
                  </div>
                  {currentStep === 2 && (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        size="icon"
                        onClick={handleBack}
                        aria-label="Previous step"
                        title="Previous step"
                        className="rounded-full"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <Button 
                        onClick={handleContinue}
                        className="pulse-glow"
                      >
                        Continue
                      </Button>
                    </div>
                  )}
                </div>
                 {currentStep === 2 && (
                   <div className="mt-4 space-y-4">
                     <SavedPaymentMethods showAddNew={true} />
                     <div className="border-t border-border/50 pt-4">
                       <Button 
                         variant="outline"
                         onClick={() => {
                           setUseOneTimePaymentFlow(true);
                           handleContinue();
                         }}
                         className="w-full"
                       >
                         <CreditCard className="w-4 h-4 mr-2" />
                         Pay One-Time (No card saved)
                       </Button>
                       <p className="text-xs text-muted-foreground mt-2 text-center">
                         Enter payment details in the next step without saving your card
                       </p>
                     </div>
                   </div>
                 )}
              </CardContent>
            </Card>

            {/* Step 3 - Review & Pay */}
            <Card className={`glass-effect transition-all duration-200 ${
              currentStep === 3 ? 'border-primary/50' : 'border-border/30 opacity-60'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4 justify-between">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">Complete Payment</h3>
                    <p className="text-sm text-muted-foreground">Choose your payment method and complete booking</p>
                  </div>
                  {currentStep === 3 && !bookingComplete && (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        size="icon"
                        onClick={handleBack}
                        aria-label="Previous step"
                        title="Previous step"
                        className="rounded-full"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                 {currentStep === 3 && !bookingComplete && (
                   <PaymentForm
                     bookingData={bookingData}
                     onSuccess={handlePaymentSuccess}
                     onError={handlePaymentError}
                     disabled={!user}
                     useOneTimeFlow={useOneTimePaymentFlow}
                   />
                 )}

                {bookingComplete && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-lg">✓</span>
                      </div>
                    </div>
                    <h4 className="font-semibold text-lg text-foreground mb-2">Booking Confirmed!</h4>
                    <p className="text-sm text-muted-foreground">
                      Payment processed successfully. Redirecting to your bookings...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Booking Summary */}
          <div className="lg:col-span-5">
            <Card className="glass-effect border-primary/20 sticky top-24">
              <CardContent className="p-6 space-y-6">
                {/* Removed extra back button to keep only the floating arrow */}
                
                {/* Venue Info */}
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-muted rounded-xl flex items-center justify-center">
                    {venue.images && venue.images[0] ? (
                      <img 
                        src={venue.images[0]} 
                        alt={venue.name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <span className="text-muted-foreground text-sm">Gaming</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{venue.name}</h3>
                    <p className="text-sm text-muted-foreground">Premium gaming experience</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 fill-primary text-primary" />
                      <span className="text-sm font-medium">{venue.rating}</span>
                      <span className="text-sm text-muted-foreground">({venue.review_count})</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/50 pt-4 space-y-4">
                  <p className="text-sm text-muted-foreground">This reservation is non-refundable.</p>
                  
                  {/* Booking Summary */}
                  <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{getTotalGuests()} guest{getTotalGuests() > 1 ? 's' : ''}</span>
                      </div>
                      {getTotalTables() > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">{getTotalTables()} table{getTotalTables() !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Date and Time */}
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Date</h4>
                    <p className="text-sm text-muted-foreground">{formatDate(bookingData.date)}</p>
                  </div>

                  {/* Services and Times */}
                  {bookingData.serviceBookings && bookingData.serviceBookings.length > 0 && (
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Selected Services</h4>
                      <div className="space-y-3">
                        {bookingData.serviceBookings.map((booking, index) => (
                          <div key={index} className="p-3 bg-muted/30 rounded-lg border border-border/30">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="text-sm font-medium text-foreground">{getServiceName(booking.serviceId)}</h5>
                              <Badge variant="secondary" className="text-xs">
                                {formatTime(booking.arrivalTime)} - {formatTime(booking.departureTime)}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              Duration: {calculateDuration(booking.arrivalTime, booking.departureTime)} • {getServiceGuests(booking)} guest{getServiceGuests(booking) > 1 ? 's' : ''} • {booking.tableConfigurations?.length || booking.numberOfTables || 1} table{(booking.tableConfigurations?.length || booking.numberOfTables || 1) !== 1 ? 's' : ''}
                            </p>
                            {booking.selectedGames && booking.selectedGames.length > 0 && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Selected Games:</p>
                                <div className="flex flex-wrap gap-1">
                                  {booking.selectedGames.map((game, gameIndex) => (
                                    <Badge key={gameIndex} variant="outline" className="text-xs">
                                      {game}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Overall Time Range (if services are selected) */}
                  {(!bookingData.serviceBookings || bookingData.serviceBookings.length === 0) && (
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Booking Time</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {formatTime(bookingData.arrivalTime)} - {formatTime(bookingData.departureTime)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Duration: {calculateDuration(bookingData.arrivalTime, bookingData.departureTime)}
                      </p>
                    </div>
                  )}

                  {/* Location */}
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Location</h4>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{venue.location}</p>
                    </div>
                  </div>

                  {/* Special Requests */}
                  {bookingData.specialRequests && (
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Special Requests</h4>
                      <p className="text-sm text-muted-foreground">{bookingData.specialRequests}</p>
                    </div>
                  )}
                </div>

                {/* Price Details */}
                <div className="border-t border-border/50 pt-4 space-y-3">
                  <h4 className="font-medium text-foreground">Price details</h4>
                  
                  {bookingData.serviceBookings && bookingData.serviceBookings.length > 0 ? (
                    <div className="space-y-2">
                      {bookingData.serviceBookings.map((booking, index) => (
                        <div key={index}>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">
                              {getServiceName(booking.serviceId)} × {getServiceGuests(booking)} guest{getServiceGuests(booking) > 1 ? 's' : ''} × {calculateDuration(booking.arrivalTime, booking.departureTime).replace('h', ' hours').replace('m', ' mins')}
                            </span>
                            <span className="text-sm text-foreground">
                              {booking.finalPrice ? booking.finalPrice.toFixed(2) : Math.round((bookingData.totalPrice / bookingData.serviceBookings.length))}₾
                            </span>
                          </div>
                          {/* Show discount info for this service */}
                          {booking.savings && booking.savings > 0 && (
                            <div className="flex justify-between text-xs text-green-600 mt-1">
                              <span>Discount ({booking.appliedDiscounts?.join(', ')})</span>
                              <span>-{booking.savings.toFixed(2)} GEL</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Service booking × {bookingData.guests} guest{bookingData.guests > 1 ? 's' : ''}
                      </span>
                      <span className="text-sm text-foreground">{discountedTotal.toFixed(2)} GEL</span>
                    </div>
                  )}
                  
                  {/* Show total savings if any */}
                  {totalSavings > 0 && (
                    <div className="border-t border-border/50 pt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Original Price</span>
                        <span className="line-through text-muted-foreground">{bookingData.totalPrice.toFixed(2)} GEL</span>
                      </div>
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Total Savings</span>
                        <span>-{totalSavings.toFixed(2)} GEL</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t border-border/50 pt-3 flex justify-between font-semibold">
                    <span className="text-foreground">Total USD</span>
                    <span className={`text-foreground gradient-text text-lg ${totalSavings > 0 ? 'text-green-600' : ''}`}>
                                              {discountedTotal.toFixed(2)} GEL
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
    </Elements>
  );
};

export default ConfirmAndPay;

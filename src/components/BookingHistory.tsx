import { useUserBookings } from "@/hooks/useBookings";
import { useRealtimeBookings } from "@/hooks/useRealtimeBookings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, Users, MapPin, Star } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const BookingHistory = () => {
  const { data: bookings, isLoading, error } = useUserBookings();
  const navigate = useNavigate();
  
  // Enable real-time booking status updates
  useRealtimeBookings();

  console.log('BookingHistory render:', { bookings, isLoading, error });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Your Bookings</h3>
        <div className="venue-grid-new">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-muted h-64 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load booking history</p>
      </div>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">No bookings found</p>
        <Button onClick={() => navigate('/')}>
          Browse Venues
        </Button>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  const formatTime = (timeString: string) => {
    // Remove seconds from time format (e.g., "14:30:00" -> "14:30")
    return timeString.split(':').slice(0, 2).join(':');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTotalTables = (booking: any) => {
    if (!booking.booking_services || booking.booking_services.length === 0) {
      return 0;
    }
    
    return booking.booking_services.reduce((total: number, service: any) => {
      if (service.table_configurations && service.table_configurations.length > 0) {
        return total + service.table_configurations.length;
      }
      return total + 1; // Fallback to 1 table if no configurations
    }, 0);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Your Bookings</h3>
      <div className="venue-grid-new">
        {bookings.map((booking) => (
          <Card key={booking.id} className="hover:shadow-lg transition-all duration-300 hover-scale overflow-hidden">
            <div className="relative">
              {/* Venue Image */}
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={booking.venues?.images?.[0] || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800'}
                  alt={booking.venues?.name || 'Venue'}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              
              {/* Status Badge */}
              <Badge className={`absolute top-3 right-3 ${getStatusColor(booking.status)} shadow-md`}>
                {booking.status}
              </Badge>
            </div>

            <CardContent className="p-2 space-y-1">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-base mb-1">
                    {booking.venues?.name || 'Venue'}
                  </h4>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                    <MapPin className="w-3 h-3" />
                    {booking.venues?.location}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary text-lg">{booking.total_price} GEL</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                <div className="flex items-center gap-1">
                  <CalendarDays className="w-3 h-3 text-gray-500" />
                  <span className="font-medium">{formatDate(booking.booking_date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span className="font-medium">{formatTime(booking.booking_time)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-gray-500" />
                  <span className="font-medium">
                    {booking.guest_count} guest{booking.guest_count > 1 ? 's' : ''}
                    {getTotalTables(booking) > 0 && (
                      <span className="text-gray-400"> • {getTotalTables(booking)} table{getTotalTables(booking) !== 1 ? 's' : ''}</span>
                    )}
                  </span>
                </div>
              </div>

              {booking.venue_services && (
                <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                  <div className="text-xs font-medium text-gray-900">
                    Service: {booking.venue_services.name}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    Type: {booking.venue_services.service_type}
                  </div>
                </div>
              )}

              {booking.special_requests && (
                <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-xs font-medium text-yellow-800 mb-1">
                    Special Requests:
                  </div>
                  <div className="text-[10px] text-yellow-700">
                    {booking.special_requests}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => navigate(`/venue/${booking.venue_id}`)}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  Book Again
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BookingHistory;
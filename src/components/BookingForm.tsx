import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CalendarIcon, X, Gamepad2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import ServiceBookingDialog from "@/components/ServiceBookingDialog";
import { VenueService } from "@/hooks/useVenues";
import { calculateGuestPrice, getServiceDisplayPrice } from "@/utils/guestPricing";
import { useServiceDiscountCalculation } from "@/hooks/useVenueDiscountCalculation";
import ServiceDiscountIndicator from "@/components/ServiceDiscountIndicator";

interface BookingFormProps {
  venueId: string;
  venueName: string;
  venuePrice: number;
  openingTime?: string;
  closingTime?: string;
  defaultDiscount?: number;
  services?: VenueService[];
  selectedServiceId?: string;
}

const BookingForm = ({ venueId, venueName, venuePrice, openingTime, closingTime, defaultDiscount = 0, services = [], selectedServiceId }: BookingFormProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    date: undefined as Date | undefined,
    arrivalTime: '',
    departureTime: '',
    serviceBookings: [] as Array<{
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
    }>,
    guests: 1,
    serviceIds: selectedServiceId ? [selectedServiceId] : [] as string[],
    specialRequests: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogService, setDialogService] = useState<VenueService | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  

  // Update serviceIds when selectedServiceId prop changes
  useEffect(() => {
    if (selectedServiceId && !formData.serviceIds.includes(selectedServiceId)) {
      setFormData(prev => ({ ...prev, serviceIds: [selectedServiceId] }));
    }
  }, [selectedServiceId, formData.serviceIds]);

  const selectedServices = services.filter(s => formData.serviceIds.includes(s.id));
  
  // Calculate original price (before discounts)
  const calculateOriginalTotalPrice = () => {
    if (services.length === 0) {
      // For basic venue booking
      if (!formData.arrivalTime || !formData.departureTime) return 0;
      const start = new Date(`2000-01-01T${formData.arrivalTime}:00`);
      const end = new Date(`2000-01-01T${formData.departureTime}:00`);
      const diffMs = end.getTime() - start.getTime();
      const durationHours = diffMs / (1000 * 60 * 60);
      return venuePrice * durationHours;
    }

    // For service bookings, calculate the original price (before discounts)
    let totalPrice = 0;
    formData.serviceBookings.forEach(serviceBooking => {
      // Use the original price if available, otherwise calculate manually
      if (serviceBooking.originalPrice !== undefined) {
        totalPrice += serviceBooking.originalPrice;
      } else {
        // Fallback to calculating manually (for backward compatibility)
        const service = services.find(s => s.id === serviceBooking.serviceId);
        if (service && serviceBooking.arrivalTime && serviceBooking.departureTime) {
          const start = new Date(`2000-01-01T${serviceBooking.arrivalTime}:00`);
          const end = new Date(`2000-01-01T${serviceBooking.departureTime}:00`);
          const diffMs = end.getTime() - start.getTime();
          const durationHours = diffMs / (1000 * 60 * 60);
          
          // Calculate price per table if table configurations exist
          if (serviceBooking.tableConfigurations && serviceBooking.tableConfigurations.length > 0) {
            serviceBooking.tableConfigurations.forEach(config => {
              const guestPrice = calculateGuestPrice(service, config.guest_count);
              if (guestPrice !== null) {
                totalPrice += guestPrice * durationHours;
              }
            });
          } else {
            // Fallback to old guest pricing logic
            const guestPrice = calculateGuestPrice(service, formData.guests);
            if (guestPrice !== null) {
              totalPrice += guestPrice * durationHours;
            }
          }
        }
      }
    });
    return totalPrice;
  };

  // Calculate discounted total price
  const calculateDiscountedTotalPrice = () => {
    if (services.length === 0) {
      // For basic venue booking, no special discounts apply
      return calculateOriginalTotalPrice();
    }

    // For service bookings, use the final price from discount calculation if available
    let totalPrice = 0;
    formData.serviceBookings.forEach(serviceBooking => {
      // Use the pre-calculated final price if available (from discount calculation)
      if (serviceBooking.finalPrice !== undefined) {
        totalPrice += serviceBooking.finalPrice;
      } else {
        // Fallback to original price if no discount calculation available
        totalPrice += serviceBooking.originalPrice || 0;
      }
    });
    return totalPrice;
  };

  // Calculate total savings
  const calculateTotalSavings = () => {
    if (services.length === 0) return 0;
    
    return formData.serviceBookings.reduce((total, booking) => {
      return total + (booking.savings || 0);
    }, 0);
  };
  
  const originalTotalPrice = calculateOriginalTotalPrice();
  const discountedTotalPrice = calculateDiscountedTotalPrice();
  const totalSavings = calculateTotalSavings();
  
  // Use discounted price as the final total
  const totalPrice = discountedTotalPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.date) {
      toast({
        title: "Missing date",
        description: "Please select a booking date",
        variant: "destructive",
      });
      return;
    }

    // For service bookings, ensure date is selected
    if (services.length > 0 && !formData.date) {
      toast({
        title: "Missing date",
        description: "Please select a date before booking services",
        variant: "destructive",
      });
      return;
    }

    // Validate times based on booking type
    if (services.length === 0) {
      // For basic venue booking
      if (!formData.arrivalTime || !formData.departureTime) {
        toast({
          title: "Missing times",
          description: "Please select arrival and departure times",
          variant: "destructive",
        });
        return;
      }
    } else {
      // For service bookings
      if (formData.serviceIds.length === 0) {
        toast({
          title: "No services selected",
          description: "Please select at least one service",
          variant: "destructive",
        });
        return;
      }

      // Check that all selected services have complete time bookings
      const incompleteServices = formData.serviceIds.filter(serviceId => {
        const booking = formData.serviceBookings.find(sb => sb.serviceId === serviceId);
        return !booking || !booking.arrivalTime || !booking.departureTime;
      });

      if (incompleteServices.length > 0) {
        toast({
          title: "Incomplete service times",
          description: "Please set arrival and departure times for all selected services",
          variant: "destructive",
        });
        return;
      }
    }
    
    // For service bookings, use the first service booking times as main times
    let mainArrivalTime = formData.arrivalTime;
    let mainDepartureTime = formData.departureTime;
    
    if (services.length > 0 && formData.serviceBookings.length > 0) {
      const firstServiceBooking = formData.serviceBookings[0];
      mainArrivalTime = firstServiceBooking.arrivalTime;
      mainDepartureTime = firstServiceBooking.departureTime;
    }
    
    const bookingData = {
      venueId,
      venueName,
      date: formData.date ? format(formData.date, 'yyyy-MM-dd') : "",
      arrivalTime: mainArrivalTime,
      departureTime: mainDepartureTime,
      serviceBookings: formData.serviceBookings,
      guests: formData.guests,
      serviceIds: formData.serviceIds,
      totalPrice: originalTotalPrice, // Original price before discounts
      discountedTotal: discountedTotalPrice, // Final price after discounts
      totalSavings: totalSavings, // Total amount saved
      specialRequests: formData.specialRequests,
    };

    navigate('/confirm-and-pay', { 
      state: { 
        bookingData,
        requiresAuth: !user
      } 
    });
  };

  // Generate 30-minute time slots based on venue hours
  const generateTimeSlots = () => {
    const slots = [];
    const start = openingTime || '00:00';
    const end = closingTime || '23:59';
    
    // Validate time format and fallback to defaults if invalid
    if (!start.includes(':') || !end.includes(':')) {
      console.warn('Invalid time format detected, using defaults');
      return ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'];
    }
    
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    
    // Validate parsed numbers
    if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
      console.warn('Invalid time values detected, using defaults');
      return ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'];
    }
    
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    // Round start time to nearest 30-minute slot
    if (currentMinute < 30) {
      currentMinute = 0;
    } else {
      currentMinute = 30;
    }
    
    // Get current time with 2 minutes buffer for today's bookings
    const now = new Date();
    const bufferTime = new Date(now.getTime() + 2 * 60 * 1000);
    const currentTimeString = `${bufferTime.getHours().toString().padStart(2, '0')}:${bufferTime.getMinutes().toString().padStart(2, '0')}`;
    
    while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      // Only add times that are not in the past (for today's bookings)
      const today = new Date();
      const todayString = format(today, 'yyyy-MM-dd');
      const selectedDateString = formData.date ? format(formData.date, 'yyyy-MM-dd') : '';
      
      if (selectedDateString === todayString) {
        if (timeString >= currentTimeString) {
          slots.push(timeString);
        }
      } else {
        slots.push(timeString);
      }
      
      // Move to next 30-minute slot
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour++;
      }
    }
    
    return slots;
  };

  // Handle main arrival/departure time updates
  const updateMainTime = (field: 'arrivalTime' | 'departureTime', value: string) => {
    // Validate against current time for today's bookings
    const now = new Date();
    const today = new Date();
    const todayString = format(today, 'yyyy-MM-dd');
    const selectedDateString = formData.date ? format(formData.date, 'yyyy-MM-dd') : '';
    
    if (selectedDateString === todayString && field === 'arrivalTime') {
      const bufferTime = new Date(now.getTime() + 2 * 60 * 1000);
      const currentTimeString = `${bufferTime.getHours().toString().padStart(2, '0')}:${bufferTime.getMinutes().toString().padStart(2, '0')}`;
      
      if (value < currentTimeString) {
        toast({
          title: "Invalid time",
          description: "Cannot select arrival time less than 2 minutes from now",
          variant: "destructive",
        });
        return;
      }
    }

    // Validate against venue working hours
    if (openingTime && closingTime && value) {
      if (value < openingTime || value > closingTime) {
        toast({
          title: "Invalid time",
          description: `Please select a time between ${formatTime(openingTime)} and ${formatTime(closingTime)}`,
          variant: "destructive",
        });
        return;
      }
    }

    // Validate that departure time is after arrival time
    if (field === 'departureTime' && formData.arrivalTime && value <= formData.arrivalTime) {
      toast({
        title: "Invalid time",
        description: "Departure time must be after arrival time",
        variant: "destructive",
      });
      return;
    }
    
    if (field === 'arrivalTime' && formData.departureTime && value >= formData.departureTime) {
      toast({
        title: "Invalid time",
        description: "Arrival time must be before departure time",
        variant: "destructive",
      });
      return;
    }

    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle service time updates with validation
  const updateServiceTime = (serviceId: string, field: 'arrivalTime' | 'departureTime', value: string) => {
    // Validate against current time for today's bookings
    const now = new Date();
    const today = new Date();
    const todayString = format(today, 'yyyy-MM-dd');
    const selectedDateString = formData.date ? format(formData.date, 'yyyy-MM-dd') : '';
    
    if (selectedDateString === todayString && field === 'arrivalTime') {
      const bufferTime = new Date(now.getTime() + 2 * 60 * 1000);
      const currentTimeString = `${bufferTime.getHours().toString().padStart(2, '0')}:${bufferTime.getMinutes().toString().padStart(2, '0')}`;
      
      if (value < currentTimeString) {
        toast({
          title: "Invalid time",
          description: "Cannot select arrival time less than 2 minutes from now",
          variant: "destructive",
        });
        return;
      }
    }

    // Validate against venue working hours
    if (openingTime && closingTime && value) {
      if (value < openingTime || value > closingTime) {
        toast({
          title: "Invalid time",
          description: `Please select a time between ${formatTime(openingTime)} and ${formatTime(closingTime)}`,
          variant: "destructive",
        });
        return;
      }
    }

    setFormData(prev => {
      const existingBooking = prev.serviceBookings.find(sb => sb.serviceId === serviceId);
      if (existingBooking) {
        const updatedBooking = { ...existingBooking, [field]: value };
        
        // Validate that departure time is after arrival time
        if (field === 'departureTime' && updatedBooking.arrivalTime && value <= updatedBooking.arrivalTime) {
          toast({
            title: "Invalid time",
            description: "Departure time must be after arrival time",
            variant: "destructive",
          });
          return prev;
        }
        
        if (field === 'arrivalTime' && updatedBooking.departureTime && value >= updatedBooking.departureTime) {
          toast({
            title: "Invalid time",
            description: "Arrival time must be before departure time",
            variant: "destructive",
          });
          return prev;
        }

        return {
          ...prev,
          serviceBookings: prev.serviceBookings.map(sb =>
            sb.serviceId === serviceId ? updatedBooking : sb
          )
        };
      } else {
        return {
          ...prev,
          serviceBookings: [
            ...prev.serviceBookings,
            {
              serviceId,
              arrivalTime: field === 'arrivalTime' ? value : '',
              departureTime: field === 'departureTime' ? value : '',
            }
          ]
        };
      }
    });
  };

  // Helper function to format time for display (24-hour format)
  const formatTime = (time: string) => {
    return time; // Return time as-is in 24-hour format (HH:MM)
  };

  const getTotalTables = (serviceBooking: any) => {
    if (serviceBooking.tableConfigurations && serviceBooking.tableConfigurations.length > 0) {
      return serviceBooking.tableConfigurations.length;
    }
    return serviceBooking.numberOfTables || 1;
  };

  const handleServiceSelect = (service: VenueService) => {
    if (!formData.date) {
      toast({
        title: "Select Date First",
        description: "Please select a date before choosing services",
        variant: "destructive",
      });
      return;
    }
    setDialogService(service);
    setIsDialogOpen(true);
  };

  const handleRemoveService = (serviceId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering service select
    setFormData(prev => ({
      ...prev,
      serviceIds: prev.serviceIds.filter(id => id !== serviceId),
      serviceBookings: prev.serviceBookings.filter(sb => sb.serviceId !== serviceId)
    }));
  };

  const handleServiceConfirm = (data: {
    service: VenueService;
    numberOfTables: number;
    tableConfigurations: Array<{
      table_number: number;
      guest_count: number;
    }>;
    arrivalTime: string;
    departureTime: string;
    selectedGames: string[];
    originalPrice: number;
    finalPrice: number;
    savings: number;
    appliedDiscounts: string[];
    discountBreakdown: any;
  }) => {
    // Calculate total guests across all tables for this service
    const totalGuestsForService = data.tableConfigurations.reduce((sum, config) => sum + config.guest_count, 0);
    
    setFormData(prev => ({
      ...prev,
      serviceIds: [...prev.serviceIds, data.service.id],
      guests: totalGuestsForService, // Set to total guests across all tables
      serviceBookings: [
        ...prev.serviceBookings,
        {
          serviceId: data.service.id,
          arrivalTime: data.arrivalTime,
          departureTime: data.departureTime,
          numberOfTables: data.numberOfTables,
          tableConfigurations: data.tableConfigurations,
          selectedGames: data.selectedGames,
          // Store the pricing information from discount calculation
          originalPrice: data.originalPrice,
          finalPrice: data.finalPrice,
          savings: data.savings,
          appliedDiscounts: data.appliedDiscounts,
          discountBreakdown: data.discountBreakdown
        }
      ]
    }));
  };

  return (
    <div className="relative">
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-2xl font-bold text-foreground">Book Services</CardTitle>
        </CardHeader>
        <CardContent className="px-0 space-y-8 pb-24">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Date Selection - Now venue-specific and appears above services */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Select Date</h3>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => {
                      console.log('Calendar onSelect called with:', date);
                      setFormData(prev => ({ ...prev, date }));
                    }}
                    disabled={(date) => {
                      const now = new Date();
                      const todayStart = new Date(now);
                      todayStart.setHours(0, 0, 0, 0);
                      const isDisabled = date < todayStart;
                      console.log('Calendar disabled check - Date:', date.toISOString(), 'Today start:', todayStart.toISOString(), 'Disabled:', isDisabled);
                      return isDisabled;
                    }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Main Booking Times - Only show if no services */}
            {services.length === 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Session Times</h3>
                  {openingTime && closingTime && (
                    <p className="text-sm text-muted-foreground">
                      Open: {formatTime(openingTime)} - {formatTime(closingTime)}
                    </p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="main-arrival">Arrival Time *</Label>
                    <Select 
                      value={formData.arrivalTime} 
                      onValueChange={(value) => updateMainTime('arrivalTime', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select arrival time" />
                      </SelectTrigger>
                      <SelectContent>
                        {generateTimeSlots().map((time) => (
                          <SelectItem key={time} value={time}>
                            {formatTime(time)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="main-departure">Departure Time *</Label>
                    <Select 
                      value={formData.departureTime} 
                      onValueChange={(value) => updateMainTime('departureTime', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select departure time" />
                      </SelectTrigger>
                      <SelectContent>
                        {generateTimeSlots().map((time) => {
                          const isDisabled = formData.arrivalTime && time <= formData.arrivalTime;
                          return (
                            <SelectItem 
                              key={time} 
                              value={time}
                              disabled={isDisabled}
                              className={isDisabled ? "text-muted-foreground/50 cursor-not-allowed" : ""}
                            >
                              {formatTime(time)}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Services Selection */}
            {services.length > 0 && (
              <div className="space-y-4">
                {services.map((service) => {
                  const isSelected = formData.serviceIds.includes(service.id);
                  const serviceBooking = formData.serviceBookings.find(sb => sb.serviceId === service.id);
                  
                  return (
                    <div 
                      key={service.id}
                      className={cn(
                        "p-4 rounded-xl border-2 cursor-pointer transition-all relative",
                        isSelected 
                          ? "border-primary bg-primary/5" 
                          : !formData.date
                          ? "border-border opacity-50 cursor-not-allowed"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => handleServiceSelect(service)}
                    >
                      {/* Remove button for selected services */}
                      {isSelected && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleRemoveService(service.id, e)}
                                className="absolute top-2 right-2 h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 z-10"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Discard Service</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}

                      {/* Date required indicator */}
                      {!formData.date && !isSelected && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
                          <div className="text-center p-4">
                            <CalendarIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Select a date first</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-start gap-4">
                        {service.images && service.images.length > 0 ? (
                          <img
                            src={service.images[0]}
                            alt={service.name}
                            className="w-16 h-16 object-cover rounded-xl flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded-xl flex-shrink-0"></div>
                        )}
                         <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="font-semibold text-lg">{service.name}</h4>
                              <ServiceDiscountIndicator service={service} />
                            </div>
                           <p className="text-muted-foreground">
                             {getServiceDisplayPrice(service)} · {service.service_type}
                           </p>
                         </div>
                      </div>
                      
                      {/* Selected booking information */}
                      {isSelected && serviceBooking && formData.date && (
                        <div className="mt-4 pt-4 border-t border-border space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Guests:</span>
                            <span className="font-medium">{formData.guests}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Tables:</span>
                            <span className="font-medium">{getTotalTables(serviceBooking)} table{getTotalTables(serviceBooking) !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Date:</span>
                            <span className="font-medium">{format(formData.date, "MMM dd, yyyy")}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Time:</span>
                            <span className="font-medium">
                              {formatTime(serviceBooking.arrivalTime)} - {formatTime(serviceBooking.departureTime)}
                            </span>
                          </div>
                          {serviceBooking.selectedGames && serviceBooking.selectedGames.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-muted-foreground text-sm">Selected Games:</span>
                              <div className="flex flex-wrap gap-1">
                                {serviceBooking.selectedGames.map((game) => (
                                  <Badge key={game} variant="secondary" className="text-xs flex items-center gap-1">
                                    <Gamepad2 className="h-3 w-3" />
                                    {game}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-sm pt-2 border-t">
                            <span className="text-muted-foreground font-medium">Total:</span>
                            <span className="font-bold text-primary">
                              {/* Use the final price if available, otherwise calculate */}
                              {serviceBooking.finalPrice !== undefined 
                                ? `${serviceBooking.finalPrice.toFixed(2)} GEL` 
                                : (() => {
                                    if (!serviceBooking.arrivalTime || !serviceBooking.departureTime) return '0 GEL';
                                    const start = new Date(`2000-01-01T${serviceBooking.arrivalTime}:00`);
                                    const end = new Date(`2000-01-01T${serviceBooking.departureTime}:00`);
                                    const diffMs = end.getTime() - start.getTime();
                                    const hours = diffMs / (1000 * 60 * 60);
                                    const guestPrice = calculateGuestPrice(service, formData.guests);
                                    return guestPrice ? `${(guestPrice * hours).toFixed(2)} GEL` : '0 GEL';
                                  })()
                              }
                            </span>
                          </div>
                          {/* Show discount information if available */}
                          {serviceBooking.savings && serviceBooking.savings > 0 && (
                            <div className="text-xs text-green-600 pt-1">
                              {serviceBooking.originalPrice && (
                                <span className="line-through text-muted-foreground mr-2">
                                  {serviceBooking.originalPrice.toFixed(2)} GEL
                                </span>
                              )}
                              <span>Save {serviceBooking.savings.toFixed(2)} GEL</span>
                              {serviceBooking.appliedDiscounts && serviceBooking.appliedDiscounts.length > 0 && (
                                <div className="text-xs text-green-600 mt-1">
                                  Applied: {serviceBooking.appliedDiscounts.join(', ')}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Service Booking Dialog */}
            <ServiceBookingDialog
              service={dialogService}
              venueId={venueId}
              isOpen={isDialogOpen}
              onClose={() => {
                setIsDialogOpen(false);
                setDialogService(null);
              }}
              onConfirm={handleServiceConfirm}
              openingTime={openingTime}
              closingTime={closingTime}
              venueDate={formData.date}
              initialData={
                dialogService && formData.serviceIds.includes(dialogService.id)
                  ? {
                      guests: formData.guests,
                      arrivalTime: formData.serviceBookings.find(sb => sb.serviceId === dialogService.id)?.arrivalTime || "",
                      departureTime: formData.serviceBookings.find(sb => sb.serviceId === dialogService.id)?.departureTime || ""
                    }
                  : undefined
              }
            />


            {/* Special Requests */}
            <div className="space-y-4">
              <Label htmlFor="requests" className="text-lg font-medium">
                Special Requests (Optional)
              </Label>
              <Textarea
                id="requests"
                value={formData.specialRequests}
                onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                placeholder="Any special requirements or requests..."
                className="resize-none min-h-[100px]"
                rows={4}
              />
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Sticky Reserve Section */}
      <div className="fixed bottom-0 right-0 lg:absolute lg:bottom-0 lg:right-0 w-full lg:w-auto bg-gradient-to-r from-primary/10 to-blue-600/10 backdrop-blur-sm border-t-2 border-primary/20 lg:border-0 p-6 lg:p-0 rounded-t-2xl lg:rounded-none">
        <div className="max-w-sm lg:max-w-none mx-auto lg:mx-0">
          <div className="flex items-center gap-4">
             <div className="flex-1">
               <span className="text-4xl font-bold text-primary bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">{totalPrice.toFixed(2)} GEL</span>
             </div>
            <Button 
              onClick={handleSubmit}
              className="h-16 px-10 text-xl font-bold bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105" 
              disabled={
                isSubmitting || 
                !formData.date || 
                originalTotalPrice <= 0 ||
                (services.length > 0 && formData.serviceIds.length === 0) ||
                (services.length === 0 && (!formData.arrivalTime || !formData.departureTime)) ||
                (formData.serviceIds.length > 0 && formData.serviceBookings.some(sb => !sb.arrivalTime || !sb.departureTime))
              }
            >
              {isSubmitting ? "Creating Booking..." : "Reserve"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;

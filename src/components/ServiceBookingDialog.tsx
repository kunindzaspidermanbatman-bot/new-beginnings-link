import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, Minus, Plus, Users, Clock, Gamepad2, Check, ChevronsUpDown, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { VenueService } from "@/hooks/useVenues";
import { useToast } from "@/hooks/use-toast";
import { calculateGuestPrice, isValidGuestCount, getMaxGuestCount } from "@/utils/guestPricing";
import { useServiceDiscountCalculation } from "@/hooks/useVenueDiscountCalculation";

interface ServiceBookingDialogProps {
  service: VenueService | null;
  venueId?: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
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
  }) => void;
  openingTime?: string;
  closingTime?: string;
  venueDate?: Date; // Add venue date prop
  initialData?: {
    guests: number;
    arrivalTime: string;
    departureTime: string;
  };
}

const ServiceBookingDialog = ({ 
  service, 
  venueId,
  isOpen, 
  onClose, 
  onConfirm,
  openingTime,
  closingTime,
  venueDate,
  initialData
}: ServiceBookingDialogProps) => {
  const { toast } = useToast();
  const [numberOfTables, setNumberOfTables] = useState(1);
  const [tableConfigurations, setTableConfigurations] = useState<Array<{
    table_number: number;
    guest_count: number;
  }>>([{ table_number: 1, guest_count: 1 }]);
  const [arrivalTime, setArrivalTime] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [isGameComboboxOpen, setIsGameComboboxOpen] = useState(false);

  // Use service-specific games instead of all venue games
  const availableGames = (service as any)?.service_games || [];

  // Set initial values when dialog opens with existing data
  useEffect(() => {
    if (isOpen && initialData) {
      setTableConfigurations([{ table_number: 1, guest_count: initialData.guests }]);
      setArrivalTime(initialData.arrivalTime);
      setDepartureTime(initialData.departureTime);
    } else if (isOpen && !initialData) {
      // Reset to defaults when opening without initial data
      setNumberOfTables(1);
      setTableConfigurations([{ table_number: 1, guest_count: 1 }]);
      setArrivalTime("");
      setDepartureTime("");
      setSelectedGames([]);
    }
  }, [isOpen, initialData]);

  // Update table configurations when number of tables changes
  useEffect(() => {
    setTableConfigurations(prev => {
      const newConfigs = [];
      for (let i = 1; i <= numberOfTables; i++) {
        const existingConfig = prev.find(config => config.table_number === i);
        newConfigs.push({
          table_number: i,
          guest_count: existingConfig?.guest_count || 1
        });
      }
      return newConfigs;
    });
  }, [numberOfTables]);

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
    console.log('Current browser time:', now.toISOString());
    console.log('Current local time:', now.toString());
    
    // Add 2 minutes buffer to current time
    const bufferTime = new Date(now.getTime() + 2 * 60 * 1000);
    console.log('Buffer time (30min after current):', bufferTime.toString());
    const currentTimeString = `${bufferTime.getHours().toString().padStart(2, '0')}:${bufferTime.getMinutes().toString().padStart(2, '0')}`;
    console.log('Current time string for filtering:', currentTimeString);
    
    while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      // Only add times that are not in the past (for today's bookings)
      const today = new Date();
      const todayString = format(today, 'yyyy-MM-dd');
      const venueDateString = venueDate ? format(venueDate, 'yyyy-MM-dd') : '';
      
      if (venueDateString === todayString) {
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

  const handleArrivalTimeChange = (value: string) => {
    // Validate against current time for today's bookings
    const now = new Date();
    const today = new Date();
    const todayString = format(today, 'yyyy-MM-dd');
    const venueDateString = venueDate ? format(venueDate, 'yyyy-MM-dd') : '';
    
    if (venueDateString === todayString) {
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

    // Clear departure time if it's before the new arrival time
    if (departureTime && value >= departureTime) {
      setDepartureTime("");
    }
    
    setArrivalTime(value);
  };

  const handleDepartureTimeChange = (value: string) => {
    // Validate that departure time is after arrival time
    if (arrivalTime && value <= arrivalTime) {
      toast({
        title: "Invalid time",
        description: "Departure time must be after arrival time",
        variant: "destructive",
      });
      return;
    }
    
    setDepartureTime(value);
  };

  const handleConfirm = () => {
    if (service && venueDate && arrivalTime && departureTime) {
      onConfirm({
        service,
        numberOfTables,
        tableConfigurations,
        arrivalTime,
        departureTime,
        selectedGames,
        // Include pricing and discount information
        originalPrice: totalPrice,
        finalPrice: finalPrice,
        savings: savings,
        appliedDiscounts: discountData?.appliedDiscounts || [],
        discountBreakdown: discountData?.discountBreakdown || {}
      });
      // Reset form
      setNumberOfTables(1);
      setTableConfigurations([{ table_number: 1, guest_count: 1 }]);
      setArrivalTime("");
      setDepartureTime("");
      setSelectedGames([]);
      onClose();
    }
  };

  // Calculate total price based on duration and guests per table using new pricing logic
  const calculateTotalPrice = () => {
    if (!service || !arrivalTime || !departureTime) {
      return tableConfigurations.reduce((total, config) => {
        const guestPrice = service ? calculateGuestPrice(service, config.guest_count) : 0;
        return total + (guestPrice || 0);
      }, 0);
    }
    
    const start = new Date(`2000-01-01T${arrivalTime}:00`);
    const end = new Date(`2000-01-01T${departureTime}:00`);
    const diffMs = end.getTime() - start.getTime();
    const hours = diffMs / (1000 * 60 * 60);
    
    // Calculate price per table, then sum all tables
    return tableConfigurations.reduce((total, config) => {
      const guestPrice = calculateGuestPrice(service, config.guest_count);
      return total + (guestPrice ? guestPrice * hours : 0);
    }, 0);
  };

  // Always calculate pricing and discounts - hooks must be called in same order every render
  const totalPrice = calculateTotalPrice();
  const durationHours = arrivalTime && departureTime ? (() => {
    const start = new Date(`2000-01-01T${arrivalTime}:00`);
    const end = new Date(`2000-01-01T${departureTime}:00`);
    const diffMs = end.getTime() - start.getTime();
    return diffMs / (1000 * 60 * 60);
  })() : 1;

  // Get total guests across all tables for discount calculation
  const totalGuests = tableConfigurations.reduce((sum, config) => sum + config.guest_count, 0);

  // Use discount calculation hook - must be called before early return
  const { data: discountData, isLoading: discountLoading } = useServiceDiscountCalculation(
    service?.id, 
    totalPrice, 
    durationHours, 
    totalGuests,
    arrivalTime || "09:00",
    departureTime || "10:00",
    !!service // Only enable when service exists
  );

  // Debug logging for discount calculation
  console.log('Service booking discount data:', {
    serviceId: service?.id,
    totalPrice,
    durationHours,
    totalGuests,
    discountData,
    isLoading: discountLoading
  });

  const finalPrice = discountData?.finalPrice || totalPrice;
  const savings = discountData?.totalSavings || 0;

  // Early return after all hooks are called
  if (!service) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Book {service.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">

          {/* Number of Tables */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Number of Tables</label>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Tables</span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNumberOfTables(Math.max(1, numberOfTables - 1))}
                  disabled={numberOfTables <= 1}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center text-sm font-medium">{numberOfTables}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNumberOfTables(Math.min((service as any)?.max_tables || 10, numberOfTables + 1))}
                  disabled={numberOfTables >= ((service as any)?.max_tables || 10)}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Guest Count per Table */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Guests per Table</label>
            <div className="space-y-3">
              {tableConfigurations.map((config) => (
                <div key={config.table_number} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Table {config.table_number}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newGuestCount = Math.max(1, config.guest_count - 1);
                        if (isValidGuestCount(service, newGuestCount)) {
                          setTableConfigurations(prev =>
                            prev.map(c =>
                              c.table_number === config.table_number
                                ? { ...c, guest_count: newGuestCount }
                                : c
                            )
                          );
                        }
                      }}
                      disabled={config.guest_count <= 1}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{config.guest_count}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newGuestCount = Math.min(getMaxGuestCount(service) || 20, config.guest_count + 1);
                        if (isValidGuestCount(service, newGuestCount)) {
                          setTableConfigurations(prev =>
                            prev.map(c =>
                              c.table_number === config.table_number
                                ? { ...c, guest_count: newGuestCount }
                                : c
                            )
                          );
                        }
                      }}
                      disabled={
                        config.guest_count >= (getMaxGuestCount(service) || 20) ||
                        !isValidGuestCount(service, config.guest_count + 1)
                      }
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Game Selection - Only show if service has games */}
          {availableGames.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Select Games</label>
              <Popover open={isGameComboboxOpen} onOpenChange={setIsGameComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isGameComboboxOpen}
                    className="w-full justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Gamepad2 className="h-4 w-4" />
                      {selectedGames.length > 0 ? `${selectedGames.length} game${selectedGames.length > 1 ? 's' : ''} selected` : "Choose games"}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search games..." />
                    <CommandList className="max-h-[160px]">
                      <CommandEmpty>No game found.</CommandEmpty>
                      <CommandGroup>
                        {availableGames.map((game) => (
                          <CommandItem
                            key={game}
                            value={game}
                            onSelect={(currentValue) => {
                              setSelectedGames(prev => {
                                const isSelected = prev.includes(currentValue);
                                if (isSelected) {
                                  return prev.filter(g => g !== currentValue);
                                } else {
                                  return [...prev, currentValue];
                                }
                              });
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedGames.includes(game) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <Gamepad2 className="mr-2 h-4 w-4" />
                            {game}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedGames.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedGames.map((game) => (
                    <Badge key={game} variant="secondary" className="flex items-center gap-1">
                      {game}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => {
                          setSelectedGames(prev => prev.filter(g => g !== game));
                        }}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Venue Date Display */}
          {venueDate && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Booking Date</label>
              <div className="p-3 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{format(venueDate, "PPP")}</span>
                </div>
              </div>
            </div>
          )}

          {/* Time Selection */}
          {venueDate && (
            <div className="space-y-4">
              <label className="text-sm font-medium">Select Time</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Arrival</Label>
                  <Select value={arrivalTime} onValueChange={handleArrivalTimeChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateTimeSlots().map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Departure</Label>
                  <Select 
                    value={departureTime} 
                    onValueChange={handleDepartureTimeChange}
                    disabled={!arrivalTime}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateTimeSlots().map((time) => {
                        const isDisabled = arrivalTime && time <= arrivalTime;
                        return (
                          <SelectItem 
                            key={time} 
                            value={time}
                            disabled={isDisabled}
                          >
                            {time}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {openingTime && closingTime && (
                <p className="text-xs text-muted-foreground">
                  Available: {openingTime} - {closingTime}
                </p>
              )}
            </div>
          )}

          {/* Total Price */}
          {arrivalTime && departureTime && (
            <div className="border-t pt-4 space-y-2">
              {savings > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Original Price</span>
                  <span className="line-through text-muted-foreground">{totalPrice.toFixed(2)} GEL</span>
                </div>
              )}
              {savings > 0 && (
                <div className="flex items-center justify-between text-sm text-green-600">
                  <span>Discount Savings</span>
                  <span>-{savings.toFixed(2)} GEL</span>
                </div>
              )}
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total</span>
                <span className={savings > 0 ? "text-green-600" : ""}>{finalPrice.toFixed(2)} GEL</span>
              </div>
              {discountData?.appliedDiscounts && discountData.appliedDiscounts.length > 0 && (
                <div className="text-xs text-green-600">
                  Applied: {discountData.appliedDiscounts.join(', ')}
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {(() => {
                  if (!arrivalTime || !departureTime) {
                    return `Priced per table - ${tableConfigurations.length} table${tableConfigurations.length !== 1 ? 's' : ''}`;
                  }
                  
                  const start = new Date(`2000-01-01T${arrivalTime}:00`);
                  const end = new Date(`2000-01-01T${departureTime}:00`);
                  const diffMs = end.getTime() - start.getTime();
                  const hours = diffMs / (1000 * 60 * 60);
                  return `${tableConfigurations.length} table${tableConfigurations.length !== 1 ? 's' : ''} × ${hours} hour${hours !== 1 ? 's' : ''} ${savings > 0 ? '- discounts' : ''} = ${finalPrice.toFixed(2)} GEL`;
                })()}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!venueDate || !arrivalTime || !departureTime}
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceBookingDialog;

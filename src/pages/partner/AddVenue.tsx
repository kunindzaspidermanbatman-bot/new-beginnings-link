import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCreateVenue } from '@/hooks/usePartnerVenues';

import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, X, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import PartnerLayout from '@/components/PartnerLayout';
import VenueImageUpload from '@/components/VenueImageUpload';
import { ServiceImageUpload } from '@/components/ServiceImageUpload';
import GoogleLocationPicker from '@/components/GoogleLocationPicker';
import { GuestPricingManager } from '@/components/GuestPricingManager';


type ServiceType = 'PC Gaming' | 'PlayStation 5' | 'Billiards' | 'Table Tennis';

interface VenueService {
  service_type: ServiceType;
  price: number;
  images: string[];
  discount_percentage: number;
  service_games: string[];
  guest_pricing_rules: Array<{ maxGuests: number; price: number }>;
  max_tables: number;
}

interface VenueData {
  name: string;
  location: string;
  district: string;
  opening_time: string;
  closing_time: string;
  images: string[];
  latitude?: number;
  longitude?: number;
}

const AddVenue = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  // Static game options for different service types
  const getGameOptionsForService = (serviceType: string): string[] => {
    switch (serviceType) {
      case 'PC Gaming':
        return ['CS:GO', 'Dota 2', 'League of Legends', 'Valorant', 'Fortnite', 'Call of Duty', 'Apex Legends', 'Overwatch 2', 'Rocket League', 'Minecraft', 'Grand Theft Auto V', 'Among Us', 'Fall Guys', 'Rainbow Six Siege'];
      case 'PlayStation 5':
        return ['FIFA', 'Call of Duty', 'Fortnite', 'Valorant', 'Apex Legends', 'Rocket League', 'Grand Theft Auto V', 'Among Us', 'Fall Guys'];
      case 'Billiards':
        return ['8-Ball Pool', '9-Ball Pool'];
      case 'Table Tennis':
        return ['Table Tennis'];
      case 'Arcade':
        return ['Various Arcade Games'];
      case 'VR Gaming':
        return ['Beat Saber', 'Half-Life: Alyx', 'Superhot VR', 'Job Simulator'];
      default:
        return [];
    }
  };
  
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<VenueService[]>([{
    service_type: 'PC Gaming',
    price: 0,
    images: [],
    discount_percentage: 0,
    service_games: [],
    guest_pricing_rules: [],
    max_tables: 1
  }]);
  const [venue, setVenue] = useState<VenueData>({
    name: '',
    location: '',
    district: '',
    opening_time: '',
    closing_time: '',
    images: [],
    latitude: undefined,
    longitude: undefined
  });

  const createVenue = useCreateVenue();


  const handleSave = async () => {
    console.log('Current venue state during save:', venue);
    
    // More precise validation with detailed error messages
    const missingFields = [];
    if (!venue.name) missingFields.push('venue name');
    if (!venue.location) missingFields.push('venue location');
    if (!venue.district) missingFields.push('district');
    if (!venue.opening_time) missingFields.push('opening time');
    if (!venue.closing_time) missingFields.push('closing time');
    if (venue.latitude === undefined || venue.latitude === null) missingFields.push('location coordinates (latitude)');
    if (venue.longitude === undefined || venue.longitude === null) missingFields.push('location coordinates (longitude)');

    if (missingFields.length > 0) {
      console.log('Missing fields:', missingFields);
      toast({
        title: "Missing information",
        description: `Please fill in: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    // Validate services - at least one required with valid pricing
    const validServices = services.filter(service => {
      // Check if service has type and guest pricing rules
      const hasServiceType = service.service_type;
      const hasGuestPricing = service.guest_pricing_rules && 
                             service.guest_pricing_rules.length > 0 && 
                             service.guest_pricing_rules.every(rule => rule.price > 0 && rule.maxGuests > 0);
      
      return hasServiceType && hasGuestPricing;
    });

    if (validServices.length === 0) {
      toast({
        title: "Service required",
        description: "Please add at least one service with service type and Guest Count Pricing rules.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const venueData = await createVenue.mutateAsync({
        name: venue.name,
        location: venue.location,
        district: venue.district,
        images: venue.images,
        openingTime: venue.opening_time,
        closingTime: venue.closing_time,
        latitude: venue.latitude,
        longitude: venue.longitude
      });

      // Create services if any are provided
      if (validServices.length > 0) {
        for (const service of validServices) {
          const { data, error } = await supabase.from('venue_services').insert({
            venue_id: venueData.id,
            name: service.service_type,
            price: service.price,
            images: service.images,
            service_type: service.service_type,
            service_games: service.service_games || [],
            guest_pricing_rules: service.guest_pricing_rules || [],
            max_tables: service.max_tables || 1
          });
          
          if (error) {
            console.error('Error creating service:', error);
            throw new Error(`Failed to create service: ${error.message}`);
          }
        }
      }

      toast({
        title: "Success",
        description: "Venue created successfully",
      });
      
      navigate('/partner/dashboard');
    } catch (error: any) {
      toast({
        title: "Error", 
        description: error.message || "Failed to create venue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addService = () => {
    setServices([...services, {
      service_type: 'PC Gaming',
      price: 0,
      images: [],
      discount_percentage: 0,
      service_games: [],
      guest_pricing_rules: [],
      max_tables: 1
    }]);
  };

  const removeService = (index: number) => {
    const newServices = services.filter((_, i) => i !== index);
    setServices(newServices);
  };

  const updateService = (index: number, field: keyof VenueService, value: any) => {
    const newServices = [...services];
    newServices[index] = { 
      ...newServices[index], 
      [field]: value,
      // Reset service_games when service_type changes
      ...(field === 'service_type' ? { service_games: [] } : {})
    };
    setServices(newServices);
  };

  // Handle location selection from map
  const handleLocationSelect = (locationData: { address: string; latitude: number; longitude: number; district?: string }) => {
    console.log('handleLocationSelect called with:', locationData);
    
    setVenue(currentVenue => {
      console.log('Current venue state in functional update:', currentVenue);
      const updatedVenue = {
        ...currentVenue,
        location: locationData.address,
        district: locationData.district || currentVenue.district || '',
        latitude: locationData.latitude,
        longitude: locationData.longitude
      };
      console.log('Updated venue state:', updatedVenue);
      return updatedVenue;
    });
  };

  const toggleServiceGame = (serviceIndex: number, game: string) => {
    const newServices = [...services];
    const currentGames = newServices[serviceIndex].service_games || [];
    
    if (currentGames.includes(game)) {
      newServices[serviceIndex].service_games = currentGames.filter(g => g !== game);
    } else {
      newServices[serviceIndex].service_games = [...currentGames, game];
    }
    
    setServices(newServices);
  };

  // Get games for service type using static data
  const getGamesForServiceType = (serviceType: ServiceType) => {
    const gameOptions = getGameOptionsForService(serviceType);
    return gameOptions.map(game => ({ id: game, name: game, category: serviceType }));
  };

  // Generate 30-minute time slots
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  // Helper function to format time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <PartnerLayout>
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/partner/dashboard')}
                className="hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Venue</h1>
                <p className="text-gray-600 dark:text-gray-400">Create a new venue listing for your business</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? 'Creating...' : 'Create Venue'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto grid gap-6">
          {/* Basic Information */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Venue Name *</Label>
                <Input
                  id="name"
                  value={venue.name}
                  onChange={(e) => setVenue({...venue, name: e.target.value})}
                  placeholder="Enter venue name"
                />
              </div>

              {/* Location Picker */}
              <GoogleLocationPicker 
                onLocationSelect={handleLocationSelect}
                initialLocation={venue.latitude && venue.longitude ? {
                  address: venue.location,
                  latitude: venue.latitude,
                  longitude: venue.longitude,
                  district: venue.district
                } : undefined}
              />
            </CardContent>
          </Card>

          {/* Operating Hours */}
          <Card>
            <CardHeader>
              <CardTitle>Operating Hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="opening">Opening Time *</Label>
                  <Select 
                    value={venue.opening_time} 
                    onValueChange={(value) => setVenue({...venue, opening_time: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select opening time" />
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
                  <Label htmlFor="closing">Closing Time *</Label>
                  <Select 
                    value={venue.closing_time} 
                    onValueChange={(value) => setVenue({...venue, closing_time: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select closing time" />
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
              </div>
            </CardContent>
          </Card>

          {/* Venue Images */}
          <Card>
            <CardHeader>
              <CardTitle>Venue Images</CardTitle>
            </CardHeader>
            <CardContent>
              <VenueImageUpload
                images={venue.images}
                onImagesChange={(images) => setVenue({...venue, images})}
                venueId="new"
              />
            </CardContent>
          </Card>

          {/* Services Section */}
          <Card>
            <CardHeader>
              <CardTitle>Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {services.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No services added yet. Click "Add Service" to create your first service.</p>
                  <div className="mt-4">
                    <Button onClick={addService} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Service
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {services.map((service, index) => (
                    <div key={index}>
                      <Card className="border-dashed">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Service {index + 1}</h4>
                            <Button
                              onClick={() => removeService(index)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label>Service Type *</Label>
                            <Select 
                              value={service.service_type} 
                              onValueChange={(value: ServiceType) => updateService(index, 'service_type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select service type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PC Gaming">PC Gaming</SelectItem>
                                <SelectItem value="PlayStation 5">PlayStation 5</SelectItem>
                                <SelectItem value="Billiards">Billiards</SelectItem>
                                <SelectItem value="Table Tennis">Table Tennis</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Service Games - Show only for specific service types */}
                          {(service.service_type === 'PC Gaming' || 
                            service.service_type === 'PlayStation 5' || 
                            service.service_type === 'Billiards') && (
                            <div className="space-y-2">
                              <Label>Service Games</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between"
                                  >
                                    {service.service_games?.length ? 
                                      `${service.service_games.length} game(s) selected` : 
                                      "Select games"
                                    }
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0">
                                  <Command>
                                    <CommandInput placeholder="Search games..." />
                                    <CommandEmpty>No games found.</CommandEmpty>
                                    <CommandGroup>
                                      <CommandList>
                                        {getGamesForServiceType(service.service_type).map((game) => (
                                          <CommandItem
                                            key={game.id}
                                            onSelect={() => toggleServiceGame(index, game.name)}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                service.service_games?.includes(game.name)
                                                  ? "opacity-100"
                                                  : "opacity-0"
                                              )}
                                            />
                                            {game.name}
                                          </CommandItem>
                                        ))}
                                      </CommandList>
                                    </CommandGroup>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              
                              {/* Display selected games as badges */}
                              {service.service_games && service.service_games.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {service.service_games.map((game) => (
                                    <Badge
                                      key={game}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {game}
                                      <button
                                        onClick={() => toggleServiceGame(index, game)}
                                        className="ml-1 text-xs hover:text-red-500"
                                      >
                                        ×
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Service Images */}
                          <ServiceImageUpload
                            images={service.images}
                            onImagesChange={(images) => updateService(index, 'images', images)}
                            serviceIndex={index}
                          />
                          
                          {/* Maximum Tables */}
                          <div className="space-y-2">
                            <Label>Maximum Tables</Label>
                            <Input
                              type="number"
                              min="1"
                              max="20"
                              value={service.max_tables || 1}
                              onChange={(e) => updateService(index, 'max_tables', Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-32"
                            />
                            <p className="text-sm text-muted-foreground">
                              Maximum number of tables customers can book for this service
                            </p>
                          </div>

                          {/* Guest Pricing */}
                          <GuestPricingManager
                            rules={service.guest_pricing_rules}
                            onRulesChange={(rules) => updateService(index, 'guest_pricing_rules', rules)}
                          />
                        </CardContent>
                      </Card>
                      
                      {/* Add Service button after each service */}
                      <div className="flex justify-end mt-4">
                        <Button onClick={addService} variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Service
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PartnerLayout>
  );
};

export default AddVenue;
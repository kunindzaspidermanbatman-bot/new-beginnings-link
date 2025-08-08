import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';


import { ArrowLeft, Save, Trash2, Plus, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PartnerLayout from '@/components/PartnerLayout';

import VenueImageUpload from '@/components/VenueImageUpload';
import { ServiceImageUpload } from '@/components/ServiceImageUpload';

import ServiceDiscountConfig from '@/components/ServiceDiscountConfig';
import VenueDiscountConfig from '@/components/VenueDiscountConfig';
import LocationPicker from '@/components/LocationPicker';
import { GuestPricingManager } from '@/components/GuestPricingManager';


import { PageLoading } from '@/components/ui/loading';

import { SERVICE_CATALOG, ServiceType, isPerTableService } from '@/constants/services';

interface VenueService {
  id?: string;
  service_type: ServiceType;
  price: number;
  images: string[];
  service_games?: string[];
  guest_pricing_rules: Array<{ maxGuests: number; price: number }>;
  max_tables?: number;
  overall_discount_percent?: number;
  free_hour_discounts?: Array<{ thresholdHours: number; freeHours: number }>;
  group_discounts?: Array<{ minGuests: number; discountPercent: number }>;
  timeslot_discounts?: Array<{ start: string; end: string; discountPercent: number }>;
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

const EditVenue = () => {
  const { venueId } = useParams();
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
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<VenueService[]>([]);
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

  // Global discount state for applying to services
  const [globalDiscounts, setGlobalDiscounts] = useState({
    overall_discount_percent: 0,
    overall_discount_enabled: false,
    overall_discount_service_ids: [] as string[],
    free_hour_discount_enabled: false,
    free_hour_discounts: [] as Array<{ thresholdHours: number; freeHours: number; serviceIds: string[] }>,
    group_discounts: [] as Array<{ minGuests: number; discountPercent: number; serviceIds: string[] }>,
    group_discount_enabled: false,
    timeslot_discounts: [] as Array<{ start: string; end: string; discountPercent: number; serviceIds: string[] }>,
    timeslot_discount_enabled: false
  });

  useEffect(() => {
    fetchVenue();
  }, [venueId]);
  

  // Tbilisi districts list - synchronized with AddVenue
  const tbilisiDistricts = [
    "Old Tbilisi",
    "Vake", 
    "Saburtalo",
    "Didube",
    "Chugureti",
    "Mtatsminda",
    "Isani",
    "Samgori",
    "Gldani",
    "Nadzaladevi",
    "Didgori",
    "Krtsanisi"
  ];
  const fetchVenue = async () => {
    try {
      // Fetch venue data
      const { data: venueData, error: venueError } = await supabase
        .from('venues')
        .select('*')
        .eq('id', venueId)
        .single();

      if (venueError) throw venueError;

      if (venueData) {
        setVenue({
          name: venueData.name || '',
          location: venueData.location || '',
          district: (venueData as any).district || '',
          opening_time: venueData.opening_time ? venueData.opening_time.substring(0, 5) : '', // Convert HH:MM:SS to HH:MM
          closing_time: venueData.closing_time ? venueData.closing_time.substring(0, 5) : '', // Convert HH:MM:SS to HH:MM
          images: venueData.images || [],
          latitude: venueData.latitude ? Number(venueData.latitude) : undefined,
          longitude: venueData.longitude ? Number(venueData.longitude) : undefined
        });
        
      }

      // Fetch venue services
      const { data: servicesData, error: servicesError } = await supabase
        .from('venue_services')
        .select('*')
        .eq('venue_id', venueId);

      if (servicesError) throw servicesError;

       const mappedServices = servicesData?.map(service => ({
         id: service.id,
         service_type: (service as any).service_type || 'PC Gaming',
         price: service.price,
         images: service.images || [],
         service_games: (service as any).service_games || [],
         guest_pricing_rules: Array.isArray((service as any).guest_pricing_rules) 
           ? (service as any).guest_pricing_rules as Array<{ maxGuests: number; price: number }>
           : [],
         max_tables: (service as any).max_tables || 1,
         overall_discount_percent: (service as any).overall_discount_percent || 0,
         free_hour_discounts: (service as any).free_hour_discounts || [],
         group_discounts: (service as any).group_discounts || [],
         timeslot_discounts: (service as any).timeslot_discounts || []
       })) || [];

      setServices(mappedServices);

      // Extract global discount settings from services data
      if (mappedServices.length > 0) {
        const firstService = mappedServices[0];
        
        // Check if any services have overall discounts
        const servicesWithOverallDiscount = mappedServices.filter(s => s.overall_discount_percent > 0);
        const overallDiscountEnabled = servicesWithOverallDiscount.length > 0;
        
        // Extract unique free hour discounts
        const allFreeHourDiscounts: any[] = [];
        mappedServices.forEach(service => {
          if (service.free_hour_discounts) {
            service.free_hour_discounts.forEach((discount: any) => {
              const existing = allFreeHourDiscounts.find(d => 
                d.thresholdHours === discount.thresholdHours && d.freeHours === discount.freeHours
              );
              if (!existing) {
                allFreeHourDiscounts.push({
                  ...discount,
                  serviceIds: [service.id]
                });
              } else {
                existing.serviceIds.push(service.id);
              }
            });
          }
        });
        
        // Extract unique group discounts
        const allGroupDiscounts: any[] = [];
        mappedServices.forEach(service => {
          if (service.group_discounts) {
            service.group_discounts.forEach((discount: any) => {
              const existing = allGroupDiscounts.find(d => 
                d.minGuests === discount.minGuests && d.discountPercent === discount.discountPercent
              );
              if (!existing) {
                allGroupDiscounts.push({
                  ...discount,
                  serviceIds: [service.id]
                });
              } else {
                existing.serviceIds.push(service.id);
              }
            });
          }
        });

        // Extract unique timeslot discounts
        const allTimeslotDiscounts: any[] = [];
        mappedServices.forEach(service => {
          if (service.timeslot_discounts) {
            service.timeslot_discounts.forEach((discount: any) => {
              const existing = allTimeslotDiscounts.find(d => 
                d.start === discount.start && d.end === discount.end && d.discountPercent === discount.discountPercent
              );
              if (!existing) {
                allTimeslotDiscounts.push({
                  ...discount,
                  serviceIds: [service.id]
                });
              } else {
                existing.serviceIds.push(service.id);
              }
            });
          }
        });

        setGlobalDiscounts({
          overall_discount_enabled: overallDiscountEnabled,
          overall_discount_percent: overallDiscountEnabled ? firstService.overall_discount_percent : 0,
          overall_discount_service_ids: servicesWithOverallDiscount.map(s => s.id),
          free_hour_discount_enabled: allFreeHourDiscounts.length > 0,
          free_hour_discounts: allFreeHourDiscounts,
          group_discount_enabled: allGroupDiscounts.length > 0,
          group_discounts: allGroupDiscounts,
          timeslot_discount_enabled: allTimeslotDiscounts.length > 0,
          timeslot_discounts: allTimeslotDiscounts
        });
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch venue details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update venue basic information
      const { error: venueError } = await supabase
        .from('venues')
        .update({
          name: venue.name,
          location: venue.location,
          district: venue.district,
          opening_time: venue.opening_time,
          closing_time: venue.closing_time,
          images: venue.images,
          latitude: venue.latitude,
          longitude: venue.longitude,
          updated_at: new Date().toISOString()
        })
        .eq('id', venueId);

      if (venueError) throw venueError;

      // Apply global discounts to services before saving
      for (const service of services) {
        const serviceId = service.id || `temp-service-${services.indexOf(service)}`;
        
        // Apply overall discount
        let serviceOverallDiscount = 0;
        if (globalDiscounts.overall_discount_enabled && 
            globalDiscounts.overall_discount_service_ids.includes(serviceId)) {
          serviceOverallDiscount = globalDiscounts.overall_discount_percent;
        }
        
        // Apply free hour discounts
        const serviceFreeHourDiscounts = globalDiscounts.free_hour_discount_enabled 
          ? globalDiscounts.free_hour_discounts.filter(discount => discount.serviceIds.includes(serviceId))
              .map(discount => ({ thresholdHours: discount.thresholdHours, freeHours: discount.freeHours }))
          : [];
        
        // Apply group discounts
        const serviceGroupDiscounts = globalDiscounts.group_discount_enabled 
          ? globalDiscounts.group_discounts.filter(discount => discount.serviceIds.includes(serviceId))
              .map(discount => ({ minGuests: discount.minGuests, discountPercent: discount.discountPercent }))
          : [];
        
        // Apply timeslot discounts
        const serviceTimeslotDiscounts = globalDiscounts.timeslot_discount_enabled 
          ? globalDiscounts.timeslot_discounts.filter(discount => discount.serviceIds.includes(serviceId))
              .map(discount => ({ start: discount.start, end: discount.end, discountPercent: discount.discountPercent }))
          : [];

        if (service.id) {
          // Update existing service
          const { error: updateError } = await supabase
            .from('venue_services')
             .update({
               name: service.service_type,
               price: service.price,
               images: service.images,
               service_type: service.service_type,
               service_games: service.service_games || [],
               guest_pricing_rules: service.guest_pricing_rules || [],
               max_tables: service.max_tables || 1,
               overall_discount_percent: serviceOverallDiscount,
               free_hour_discounts: serviceFreeHourDiscounts,
               group_discounts: serviceGroupDiscounts,
               timeslot_discounts: serviceTimeslotDiscounts
             } as any)
            .eq('id', service.id);

          if (updateError) throw updateError;
        } else {
          // Create new service
          const { error: insertError } = await supabase
            .from('venue_services')
             .insert({
               venue_id: venueId,
               name: service.service_type,
               price: service.price,
               images: service.images,
               service_type: service.service_type,
               service_games: service.service_games || [],
               guest_pricing_rules: service.guest_pricing_rules || [],
               max_tables: service.max_tables || 1,
               overall_discount_percent: serviceOverallDiscount,
               free_hour_discounts: serviceFreeHourDiscounts,
               group_discounts: serviceGroupDiscounts,
               timeslot_discounts: serviceTimeslotDiscounts
             } as any);

          if (insertError) throw insertError;
        }
      }

      toast({
        title: "Success",
        description: "Venue updated successfully",
      });
      
      navigate('/partner/dashboard');
    } catch (error: any) {
      toast({
        title: "Error", 
        description: error.message || "Failed to update venue",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const addService = () => {
    setServices([...services, {
      service_type: SERVICE_CATALOG[0] as ServiceType,
      price: 0,
      images: [],
      service_games: [],
      guest_pricing_rules: []
    }]);
  };

  const removeService = (index: number) => {
    const newServices = services.filter((_, i) => i !== index);
    setServices(newServices);
  };

  const updateService = (index: number, field: keyof VenueService, value: any) => {
    const newServices = [...services];
    newServices[index] = { ...newServices[index], [field]: value };
    
    // Reset service_games when service_type changes
    if (field === 'service_type') {
      newServices[index].service_games = [];
    }
    
    setServices(newServices);
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

  // Handle location selection from map
  const handleLocationSelect = (locationData: { address: string; latitude: number; longitude: number; district?: string }) => {
    setVenue({
      ...venue,
      location: locationData.address,
      district: locationData.district || venue.district,
      latitude: locationData.latitude,
      longitude: locationData.longitude
    });
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this venue? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('venues')
        .delete()
        .eq('id', venueId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Venue deleted successfully",
      });
      
      navigate('/partner/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete venue",
        variant: "destructive"
      });
    }
  };



  if (loading) {
    return (
      <PartnerLayout>
        <PageLoading message="Loading venue details..." />
      </PartnerLayout>
    );
  }

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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Venue</h1>
                <p className="text-gray-600 dark:text-gray-400">Manage your venue details and settings</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Venue
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
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
              <LocationPicker 
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
                venueId={venueId!}
              />
            </CardContent>
          </Card>
          {/* Services Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Services</CardTitle>
                <Button onClick={addService} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {services.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No services added yet. Click "Add Service" to create your first service.</p>
                </div>
              ) : (
                services.map((service, index) => (
                  <Card key={index} className="border-dashed">
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
                            {SERVICE_CATALOG.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
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

                        {/* Pricing Configuration */}
                        {isPerTableService(service.service_type) ? (
                          <div className="space-y-2">
                            <Label>Price per Table (GEL)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={service.price || 0}
                              onChange={(e) => updateService(index, 'price', parseFloat(e.target.value) || 0)}
                              className="w-48"
                            />
                            <p className="text-sm text-muted-foreground">For PC Gaming and Billiards, pricing is per table per hour.</p>
                          </div>
                        ) : (
                          <GuestPricingManager
                            rules={service.guest_pricing_rules}
                            onRulesChange={(rules) => updateService(index, 'guest_pricing_rules', rules)}
                          />
                        )}

                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>

          {/* Global Discount Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Service Discounts</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure discounts that will be applied to selected services
              </p>
            </CardHeader>
            <CardContent>
              <VenueDiscountConfig
                services={services.map((s, index) => ({ 
                  id: s.id || `temp-service-${index}`, 
                  name: s.service_type 
                }))}
                overallDiscountPercent={globalDiscounts.overall_discount_percent}
                setOverallDiscountPercent={(value) => setGlobalDiscounts({...globalDiscounts, overall_discount_percent: value})}
                overallDiscountEnabled={globalDiscounts.overall_discount_enabled}
                setOverallDiscountEnabled={(value) => setGlobalDiscounts({...globalDiscounts, overall_discount_enabled: value})}
                overallDiscountServiceIds={globalDiscounts.overall_discount_service_ids}
                setOverallDiscountServiceIds={(value) => setGlobalDiscounts({...globalDiscounts, overall_discount_service_ids: value})}
                freeHourDiscountEnabled={globalDiscounts.free_hour_discount_enabled}
                setFreeHourDiscountEnabled={(value) => setGlobalDiscounts({...globalDiscounts, free_hour_discount_enabled: value})}
                freeHourDiscounts={globalDiscounts.free_hour_discounts}
                setFreeHourDiscounts={(value) => setGlobalDiscounts({...globalDiscounts, free_hour_discounts: value})}
                groupDiscounts={globalDiscounts.group_discounts}
                setGroupDiscounts={(value) => setGlobalDiscounts({...globalDiscounts, group_discounts: value})}
                groupDiscountEnabled={globalDiscounts.group_discount_enabled}
                setGroupDiscountEnabled={(value) => setGlobalDiscounts({...globalDiscounts, group_discount_enabled: value})}
                timeslotDiscounts={globalDiscounts.timeslot_discounts}
                setTimeslotDiscounts={(value) => setGlobalDiscounts({...globalDiscounts, timeslot_discounts: value})}
                timeslotDiscountEnabled={globalDiscounts.timeslot_discount_enabled}
                setTimeslotDiscountEnabled={(value) => setGlobalDiscounts({...globalDiscounts, timeslot_discount_enabled: value})}
              />
            </CardContent>
          </Card>

        </div>
      </div>
    </PartnerLayout>
  );
};

export default EditVenue;
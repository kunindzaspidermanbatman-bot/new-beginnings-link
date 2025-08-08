import { useState, useMemo, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useVenues } from "@/hooks/useVenues";
import VenueCard from "@/components/VenueCard";
import GoogleMapsWrapper from "@/components/GoogleMapsWrapper";
import { Button } from "@/components/ui/button";
import { Map, MapPin, Loader2, Grid3x3, Navigation } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { SkeletonCard } from '@/components/ui/loading';
import { toast } from "sonner";
import type { Venue } from "@/hooks/useVenues";
import HomePageFilters from "@/components/HomePageFilters";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";

// Generate stable coordinates for venues (same logic as AirbnbStyleMap)
const getVenueCoordinates = (venue: Venue) => {
  if (venue.latitude && venue.longitude) {
    return { lat: venue.latitude, lng: venue.longitude };
  }

  const tbilisiBase = { lat: 41.7151, lng: 44.8271 };
  const districts: { [key: string]: { lat: number; lng: number } } = {
    'Vake': { lat: 41.7070, lng: 44.7737 },
    'Saburtalo': { lat: 41.7325, lng: 44.7516 },
    'Old Tbilisi': { lat: 41.6934, lng: 44.8015 },
    'Didube': { lat: 41.7789, lng: 44.7916 },
    'Gldani': { lat: 41.7789, lng: 44.8144 },
    'Isani': { lat: 41.7033, lng: 44.8144 },
    'Krtsanisi': { lat: 41.6725, lng: 44.8271 },
    'Mtatsminda': { lat: 41.6969, lng: 44.7909 },
    'Nadzaladevi': { lat: 41.7578, lng: 44.7516 },
    'Chugureti': { lat: 41.7211, lng: 44.7737 }
  };

  if (districts[venue.district]) {
    const base = districts[venue.district];
    const hash = venue.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return {
      lat: base.lat + (hash % 100 - 50) * 0.001,
      lng: base.lng + (hash % 100 - 50) * 0.001
    };
  }

  const hash = venue.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return {
    lat: tbilisiBase.lat + (hash % 200 - 100) * 0.002,
    lng: tbilisiBase.lng + (hash % 200 - 100) * 0.002
  };
};

const SearchResults = () => {
  const { data: venues, isLoading } = useVenues();
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('split');
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [hoveredVenue, setHoveredVenue] = useState<Venue | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [mapBounds, setMapBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null);
  const { getCurrentLocation, loading: locationLoading, error: locationError } = useGeolocation();
  const routerLocation = useLocation();
  
  // Filter state management
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);
  const [currentFilters, setCurrentFilters] = useState({
    category: [],
    location: [],
    games: []
  });

  // Fetch all venue services for filtering
  const { data: allVenueServices } = useQuery({
    queryKey: ['all-venue-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venue_services')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  });

  // Update filtered venues when venues data changes
  useEffect(() => {
    setFilteredVenues(venues || []);
  }, [venues]);

  // Parse URL params for view and filters, and apply when data is ready
  useEffect(() => {
    const params = new URLSearchParams(routerLocation.search);
    const viewParam = params.get('view');
    if (viewParam === 'map' || viewParam === 'list' || viewParam === 'split') {
      setViewMode(viewParam);
    }

    const parseList = (value: string | null) =>
      value && value.trim().length > 0
        ? value.split(',').map(v => v.trim()).filter(Boolean)
        : [];

    const parsed = {
      category: parseList(params.get('category')) as string[],
      location: parseList(params.get('location')) as string[],
      games: parseList(params.get('games')) as string[]
    };

    // Only update if there is at least one filter present
    if (parsed.category.length || parsed.location.length || parsed.games.length) {
      setCurrentFilters(parsed as unknown as { category: []; location: []; games: [] });
      // Apply when data is available
      if (venues && allVenueServices) {
        handleFiltersChange(parsed as { category: string[]; location: string[]; games: string[] });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routerLocation.search, venues, allVenueServices]);

  // Filter venues based on map bounds when in split or map view
  const filteredVenuesMemo = useMemo(() => {
    if (!filteredVenues) return [];
    
    // Only filter when map is visible and bounds are available
    if ((viewMode === 'split' || viewMode === 'map') && mapBounds) {
      return filteredVenues.filter(venue => {
        const coordinates = getVenueCoordinates(venue);
        return (
          coordinates.lat >= mapBounds.south &&
          coordinates.lat <= mapBounds.north &&
          coordinates.lng >= mapBounds.west &&
          coordinates.lng <= mapBounds.east
        );
      });
    }
    
    // Return filtered venues when in list view or no bounds available
    return filteredVenues;
  }, [filteredVenues, mapBounds, viewMode]);

  // Handle filters change
  const handleFiltersChange = (filters: {
    category: string[];
    location: string[];
    games: string[];
  }) => {
    if (!venues || !allVenueServices) {
      setFilteredVenues(venues || []);
      return;
    }

    // Store current filters
    setCurrentFilters(filters);

    let filtered = venues;

    console.log('Applying filters:', filters);
    console.log('Total venues:', venues.length);
    console.log('Total services:', allVenueServices.length);

    // Apply category filter (OR logic within categories)
    if (filters.category && filters.category.length > 0) {
      const venueIdsWithCategory = allVenueServices
        .filter(service => {
          const serviceType = (service as { service_type?: string }).service_type || '';
          const serviceName = (service as { name?: string }).name || '';
          
          // Check if any selected category matches this service
          return filters.category.some((category: string) => 
            serviceType.toLowerCase().includes(category.toLowerCase()) ||
            serviceName.toLowerCase().includes(category.toLowerCase()) ||
            category.toLowerCase() === 'billiards' && serviceType.toLowerCase().includes('billiard')
          );
        })
        .map(service => (service as { venue_id: string }).venue_id);
      
      filtered = filtered.filter(venue => venueIdsWithCategory.includes(venue.id));
      console.log('After category filter:', filtered.length, 'venues', 'Categories:', filters.category);
    }

    // Apply location filter (OR logic within locations) - search by district only
    if (filters.location && filters.location.length > 0) {
      filtered = filtered.filter(venue => 
        filters.location.some((location: string) => {
          // Only check district field for matches
          return venue.district && venue.district.toLowerCase().includes(location.toLowerCase());
        })
      );
      console.log('After location filter:', filtered.length, 'venues', 'Locations:', filters.location);
    }

    // Apply games filter (OR logic within games)
    if (filters.games && filters.games.length > 0) {
      const venueIdsWithGames = allVenueServices
        .filter(service => {
          // Check if service has any of the selected games
          const serviceGames = (service as { service_games?: string[] }).service_games || [];
          const serviceType = (service as { service_type?: string }).service_type || '';
          const serviceName = (service as { name?: string }).name || '';
          
          return filters.games.some((game: string) => {
            const gameLower = game.toLowerCase();
            return serviceGames.some((sg: string) => sg.toLowerCase().includes(gameLower)) ||
                   serviceType.toLowerCase().includes(gameLower) ||
                   serviceName.toLowerCase().includes(gameLower) ||
                   // Special handling for billiards
                   (gameLower.includes('billiard') && (
                     serviceType.toLowerCase().includes('billiard') ||
                     serviceType.toLowerCase().includes('pool') ||
                     serviceName.toLowerCase().includes('billiard') ||
                     serviceName.toLowerCase().includes('pool')
                   ));
          });
        })
        .map(service => (service as { venue_id: string }).venue_id);
      
      filtered = filtered.filter(venue => venueIdsWithGames.includes(venue.id));
      console.log('After games filter:', filtered.length, 'venues', 'Games:', filters.games);
    }

    console.log('Final filtered venues:', filtered.length);
    setFilteredVenues(filtered);
  };

  // Handle map bounds change - memoized to prevent infinite re-renders
  const handleBoundsChange = useCallback((bounds: { north: number; south: number; east: number; west: number }) => {
    setMapBounds(bounds);
  }, []);

  const handleVenueHover = (venue: Venue) => {
    setHoveredVenue(venue);
  };

  const handleUseMyLocation = async () => {
    const location = await getCurrentLocation();
    if (location) {
      setMapCenter({ lat: location.latitude, lng: location.longitude });
      toast.success("Map centered on your location");
    } else if (locationError) {
      toast.error(locationError);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Header skeleton */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="space-y-2">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-80 animate-pulse"></div>
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-36 animate-pulse"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
            </div>
          </div>

          {/* Content skeleton - Split view layout */}
          <div className="flex gap-6 h-[calc(100vh-300px)]">
            {/* Venues List skeleton - 3 column grid */}
            <div className="w-1/2 overflow-hidden">
              <div className="h-full overflow-y-auto pr-4">
                <div className="grid grid-cols-3 gap-4 p-4">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-card rounded-lg border p-4 space-y-3">
                      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Map skeleton */}
            <div className="w-1/2 rounded-lg overflow-hidden border">
              <div className="h-full bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded mx-auto"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">
              Browse Gaming Venues
            </h1>
            <p className="text-muted-foreground">
              {(viewMode === 'split' || viewMode === 'map') && mapBounds 
                ? `${filteredVenuesMemo?.length || 0} of ${filteredVenues?.length || 0} venues in view`
                : `${filteredVenues?.length || 0} venues found`
              }
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Use My Location Button */}
            {(viewMode === 'split' || viewMode === 'map') && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUseMyLocation}
                disabled={locationLoading}
                className="mr-2"
              >
                {locationLoading ? (
                  <>
                    <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse mr-2" />
                    Locating...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    Use My Location
                  </>
                )}
              </Button>
            )}
            
            <div className="flex rounded-lg border overflow-hidden">
              <Button
                variant={viewMode === 'list' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-none"
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'split' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('split')}
                className="rounded-none"
              >
                <MapPin className="w-4 h-4 mr-1" />
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'map' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('map')}
                className="rounded-none"
              >
                <MapPin className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filter Component */}
        <div className="flex justify-start mb-6">
          <HomePageFilters 
            onFiltersChange={handleFiltersChange}
            initialFilters={currentFilters as unknown as { category: string[]; location: string[]; games: string[] }} 
          />
        </div>

        {/* Content */}
        <div className="flex gap-6 h-[calc(100vh-300px)]">
          {/* Venues List */}
          {(viewMode === 'split' || viewMode === 'list') && (
            <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} overflow-hidden`}>
              <div className="h-full overflow-y-auto pr-4">
                <div className={`grid gap-4 p-4 ${
                  viewMode === 'list' 
                    ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
                    : 'grid-cols-2 lg:grid-cols-3'
                }`}>
                  {filteredVenuesMemo?.map((venue, index) => (
                    <motion.div
                      key={venue.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: (index % 12) * 0.05 }}
                      className="group w-full"
                    >
                      <VenueCard venue={venue} searchMode={viewMode === 'split'} onHover={handleVenueHover} />
                    </motion.div>
                  ))}
                </div>
                
                {!filteredVenuesMemo?.length && filteredVenues?.length && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">
                      No venues found in the current map view.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Try zooming out or panning the map to see more venues.
                    </p>
                  </div>
                )}
                
                {!filteredVenues?.length && venues?.length && (
                  <div className="text-center py-12">
                    <div className="max-w-md mx-auto">
                      <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-gray-400 text-3xl">🔍</span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Venues Found</h3>
                      <p className="text-gray-600 mb-6">
                        No venues match your current filters. Try adjusting your search criteria or clear the filters to see all venues.
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          const emptyFilters = {
                            category: [],
                            location: [],
                            games: []
                          };
                          setCurrentFilters(emptyFilters);
                          setFilteredVenues(venues);
                        }}
                        className="mx-auto"
                      >
                        Clear All Filters
                      </Button>
                    </div>
                  </div>
                )}
                
                {!venues?.length && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">
                      No venues found.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Interactive Map */}
          {(viewMode === 'split' || viewMode === 'map') && (
            <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} rounded-lg overflow-hidden border`}>
              <GoogleMapsWrapper
                venues={filteredVenues || []}
                selectedVenue={selectedVenue}
                mapCenter={mapCenter}
                onBoundsChange={handleBoundsChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
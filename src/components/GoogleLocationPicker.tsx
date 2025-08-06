import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Navigation, CheckCircle, MapIcon } from 'lucide-react';
import { googleMapsLoader } from '@/utils/googleMapsLoader';

interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
  district?: string;
}

interface GoogleLocationPickerProps {
  onLocationSelect: (location: LocationData) => void;
  initialLocation?: LocationData;
  className?: string;
}


const GoogleLocationPicker = ({ 
  onLocationSelect, 
  initialLocation, 
  className 
}: GoogleLocationPickerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const marker = useRef<google.maps.Marker | null>(null);
  const autocomplete = useRef<google.maps.places.Autocomplete | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(initialLocation || null);

  // Initialize Google Maps and Autocomplete
  useEffect(() => {
    const initializeMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        await googleMapsLoader.loadGoogleMaps();

        if (!mapContainer.current || !searchInputRef.current) return;

        const center = initialLocation 
          ? { lat: initialLocation.latitude, lng: initialLocation.longitude }
          : { lat: 41.7151, lng: 44.8271 };

        // Initialize map
        map.current = new google.maps.Map(mapContainer.current, {
          center,
          zoom: initialLocation ? 16 : 12,
          streetViewControl: false,
          fullscreenControl: false,
          mapTypeControl: false,
          zoomControl: true,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "simplified" }]
            },
            {
              featureType: "transit",
              elementType: "labels", 
              stylers: [{ visibility: "off" }]
            }
          ]
        });

        // Initialize native Google Places Autocomplete
        autocomplete.current = new google.maps.places.Autocomplete(searchInputRef.current, {
          bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(41.6, 44.6),
            new google.maps.LatLng(41.8, 45.0)
          ),
          componentRestrictions: { country: 'ge' },
          fields: ['place_id', 'geometry', 'formatted_address', 'address_components', 'name'],
          types: ['establishment', 'geocode']
        });

        // Style the autocomplete dropdown to match our design
        const pacContainer = document.querySelector('.pac-container');
        if (pacContainer) {
          (pacContainer as HTMLElement).style.zIndex = '9999';
          (pacContainer as HTMLElement).style.borderRadius = '8px';
          (pacContainer as HTMLElement).style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
        }

        // Handle autocomplete place selection
        autocomplete.current.addListener('place_changed', () => {
          const place = autocomplete.current?.getPlace();
          if (place?.geometry?.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            
            // Extract district from place address components
            let district = '';
            if (place.address_components) {
              for (const component of place.address_components) {
                if (component.types.includes('sublocality') || 
                    component.types.includes('sublocality_level_1') ||
                    component.types.includes('administrative_area_level_2') ||
                    component.types.includes('neighborhood')) {
                  district = component.long_name;
                  break;
                }
              }
            }
            
            map.current?.setCenter({ lat, lng });
            map.current?.setZoom(16);
            addMarker(lat, lng);
            
            const locationData = {
              address: place.formatted_address || place.name || '',
              latitude: lat,
              longitude: lng,
              district
            };
            
            setSelectedLocation(locationData);
            onLocationSelect(locationData);
            
            // Clear the search input
            if (searchInputRef.current) {
              searchInputRef.current.value = '';
            }
          }
        });

        if (initialLocation) {
          addMarker(initialLocation.latitude, initialLocation.longitude);
        }

        // Handle map clicks
        map.current.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            addMarker(lat, lng);
            handleLocationSelect(lat, lng);
          }
        });

        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing Google Maps:', err);
        setError('Failed to load Google Maps. Please check your internet connection.');
        setIsLoading(false);
      }
    };

    initializeMap();

    return () => {
      if (marker.current) {
        marker.current.setMap(null);
      }
    };
  }, []);

  // Custom marker creation
  const createCustomMarker = (lat: number, lng: number) => {
    return new google.maps.Marker({
      position: { lat, lng },
      map: map.current,
      draggable: true,
      title: 'Venue Location (drag to adjust)',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#3B82F6',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 3,
        anchor: new google.maps.Point(0, 0)
      },
      animation: google.maps.Animation.DROP
    });
  };

  const addMarker = (lat: number, lng: number) => {
    if (!map.current) return;

    if (marker.current) {
      marker.current.setMap(null);
    }

    marker.current = createCustomMarker(lat, lng);

    marker.current.addListener('dragend', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        handleLocationSelect(lat, lng);
      }
    });

    map.current.panTo({ lat, lng });
  };

  const handleLocationSelect = async (lat: number, lng: number, providedAddress?: string) => {
    try {
      let address = providedAddress;
      let district = '';

      if (!address) {
        const geocoder = new google.maps.Geocoder();
        const response = await geocoder.geocode({
          location: { lat, lng }
        });

        if (response.results && response.results.length > 0) {
          const result = response.results[0];
          address = result.formatted_address;
          
          // Extract district
          for (const component of result.address_components) {
            if (component.types.includes('sublocality') || 
                component.types.includes('sublocality_level_1') ||
                component.types.includes('administrative_area_level_2')) {
              district = component.long_name;
              break;
            }
          }
        }
      }

      if (address) {
        const locationData: LocationData = {
          address,
          latitude: lat,
          longitude: lng,
          district
        };

        setSelectedLocation(locationData);
        onLocationSelect(locationData);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };


  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        if (map.current) {
          map.current.setCenter({ lat, lng });
          map.current.setZoom(16);
          addMarker(lat, lng);
          handleLocationSelect(lat, lng);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError('Unable to get your current location. Please select manually.');
        setIsLoading(false);
      }
    );
  };

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert className="border-destructive">
            <AlertDescription className="text-destructive">
              {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapIcon className="h-5 w-5" />
          Where is your venue located?
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Search for an address or click on the map to pin your venue location
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Native Google Places Autocomplete Search */}
        <div className="space-y-4">
          <div className="relative">
            <Input
              ref={searchInputRef}
              placeholder="Search for address, business, or landmark..."
              className="h-12 text-base"
            />
            <div className="absolute inset-0 pointer-events-none border border-border rounded-md"></div>
          </div>

          {/* Current Location Button */}
          <Button
            type="button"
            variant="outline"
            onClick={useCurrentLocation}
            className="w-full justify-start gap-2 h-11"
            disabled={isLoading}
          >
            <Navigation className="h-4 w-4" />
            {isLoading ? 'Getting location...' : 'Use my current location'}
          </Button>
        </div>


        {/* Selected Location Display */}
        {selectedLocation && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium text-green-800 dark:text-green-200">
                  📍 Location pinned successfully!
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  {selectedLocation.address}
                </div>
                {selectedLocation.district && (
                  <div className="text-xs text-green-600 dark:text-green-400">
                    District: {selectedLocation.district}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Map Container */}
        <div className="relative">
          <div 
            ref={mapContainer} 
            className="w-full h-96 bg-muted rounded-lg border border-border overflow-hidden"
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
              <div className="text-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground">Loading Google Maps...</p>
              </div>
            </div>
          )}
          
          {/* Map Instructions Overlay */}
          {!selectedLocation && !isLoading && (
            <div className="absolute top-4 left-4 right-4 bg-background/95 backdrop-blur-sm rounded-lg p-3 border border-border shadow-sm">
              <p className="text-sm text-muted-foreground text-center">
                🎯 <strong>Tip:</strong> Search above or click anywhere on the map to pin your venue. Drag the marker to fine-tune!
              </p>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-lg">
          <p>🔍 <strong>Search:</strong> Type any address, business name, or landmark for instant suggestions</p>
          <p>🗺️ <strong>Map:</strong> Click anywhere to drop a pin, then drag to adjust position</p>
          <p>📍 <strong>Location:</strong> Use GPS to automatically detect your current location</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleLocationPicker;
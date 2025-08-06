import React, { useState, useEffect } from 'react';
import { Venue } from '@/hooks/useVenues';
import AirbnbStyleMap from './AirbnbStyleMap';
import { googleMapsLoader } from '@/utils/googleMapsLoader';

interface GoogleMapsWrapperProps {
  venues: Venue[];
  selectedVenue?: Venue | null;
  onVenueClick?: (venue: Venue) => void;
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void;
  mapCenter?: { lat: number; lng: number } | null;
  className?: string;
}

const GoogleMapsWrapper = ({ 
  venues, 
  selectedVenue, 
  onVenueClick, 
  onBoundsChange,
  mapCenter,
  className = "w-full h-full"
}: GoogleMapsWrapperProps) => {
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  // Fetch Google Maps API key from Supabase edge function
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('GoogleMapsWrapper: Fetching API key from Supabase...');
        
        const response = await fetch('https://vpyrrctzuudgokhkucli.supabase.co/functions/v1/get-google-maps-api-key');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const apiKey = data.apiKey;
        
        if (!apiKey || apiKey === 'your-google-maps-api-key-here') {
          throw new Error('Google Maps API key not configured in Supabase secrets');
        }
        
        console.log('GoogleMapsWrapper: API key fetched successfully');
        setGoogleMapsApiKey(apiKey);
      } catch (err) {
        console.error('GoogleMapsWrapper: Failed to get API key:', err);
        setError(err instanceof Error ? err.message : 'Failed to load Google Maps API key');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApiKey();
  }, []);

  // Load Google Maps API using global loader
  useEffect(() => {
    if (!googleMapsApiKey) return;

    console.log('GoogleMapsWrapper: Loading Google Maps API...');

    // Check if already loaded
    if (googleMapsLoader.isGoogleMapsLoaded()) {
      console.log('GoogleMapsWrapper: Google Maps already loaded');
      setIsGoogleMapsLoaded(true);
      return;
    }

    // Load Google Maps using global loader
    googleMapsLoader.loadGoogleMaps(googleMapsApiKey)
      .then((success) => {
        if (success) {
          console.log('GoogleMapsWrapper: Google Maps loaded successfully');
          setIsGoogleMapsLoaded(true);
        } else {
          console.error('GoogleMapsWrapper: Failed to load Google Maps');
          setError('Failed to load Google Maps API');
        }
      })
      .catch((err) => {
        console.error('GoogleMapsWrapper: Google Maps loading error:', err);
        setError('Failed to load Google Maps API. Please check your API key and internet connection.');
      });
  }, [googleMapsApiKey]);

  // Show loading state
  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading Google Maps...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-red-600">
            <p>Failed to load Google Maps: {error}</p>
            <p className="text-sm mt-2">Please check the setup guide in GOOGLE_MAPS_SETUP.md</p>
          </div>
        </div>
      </div>
    );
  }

  // If no API key, show error
  if (!googleMapsApiKey) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-red-600">
            <p>Google Maps unavailable: API key not configured</p>
            <p className="text-sm mt-2">Add VITE_GOOGLE_MAPS_API_KEY to your .env file</p>
          </div>
        </div>
      </div>
    );
  }

  // If Google Maps not loaded yet, show loading
  if (!isGoogleMapsLoaded) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading Google Maps API...</p>
          </div>
        </div>
      </div>
    );
  }

  console.log('GoogleMapsWrapper: Rendering Airbnb-style map with', venues.length, 'venues');

  // Show the Airbnb-style map
  return (
    <AirbnbStyleMap
      venues={venues}
      selectedVenue={selectedVenue}
      onVenueClick={onVenueClick}
      onBoundsChange={onBoundsChange}
      mapCenter={mapCenter}
      googleMapsApiKey={googleMapsApiKey}
      className={className}
    />
  );
};

export default GoogleMapsWrapper; 
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Venue } from '@/hooks/useVenues';
import VenueMapPopup from './VenueMapPopup';

interface MapboxVenueMapProps {
  venues: Venue[];
  selectedVenue?: Venue | null;
  onVenueClick?: (venue: Venue) => void;
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void;
  mapboxToken: string;
  className?: string;
}

// Generate stable coordinates for venues - only called once per venue
const getVenueCoordinates = (venue: Venue) => {
  // If venue has actual coordinates, use them
  if (venue.latitude && venue.longitude) {
    return {
      lat: venue.latitude,
      lng: venue.longitude
    };
  }

  // Fallback: Generate stable coordinates based on venue ID and district
  const tbilisiBase = { lat: 41.7151, lng: 44.8271 };
  
  // Different districts with approximate coordinates
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

  // Use district coordinates if available
  if (districts[venue.district]) {
    const base = districts[venue.district];
    // Generate stable offset based on venue ID
    const hash = venue.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return {
      lat: base.lat + (hash % 100 - 50) * 0.001,
      lng: base.lng + (hash % 100 - 50) * 0.001
    };
  }

  // Fallback to Tbilisi center with stable offset
  const hash = venue.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return {
    lat: tbilisiBase.lat + (hash % 200 - 100) * 0.002,
    lng: tbilisiBase.lng + (hash % 200 - 100) * 0.002
  };
};

// Simple clustering algorithm that uses stable coordinates
const clusterVenues = (venuesWithCoords: Array<{ venue: Venue; coordinates: { lat: number; lng: number } }>, zoom: number) => {
  if (zoom >= 12) {
    // Show individual markers when zoomed in
    return venuesWithCoords.map(({ venue, coordinates }) => ({
      type: 'individual' as const,
      venues: [venue],
      coordinates,
      center: coordinates
    }));
  }

  // For zoomed out view, just show individual markers but make them smaller
  // This ensures venues never move from their original positions
  return venuesWithCoords.map(({ venue, coordinates }) => ({
    type: 'individual' as const,
    venues: [venue],
    coordinates,
    center: coordinates
  }));
};

const MapboxVenueMap = ({ 
  venues, 
  selectedVenue, 
  onVenueClick, 
  onBoundsChange, 
  mapboxToken,
  className = "w-full h-full"
}: MapboxVenueMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupVenue, setPopupVenue] = useState<Venue | null>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const boundsChangeTimeout = useRef<NodeJS.Timeout | null>(null);
  const isUserInteracting = useRef(false);
  const [currentZoom, setCurrentZoom] = useState(11);
  
  // Store stable coordinates in a ref to prevent recalculation
  const stableCoordinates = useRef<Map<string, { lat: number; lng: number }>>(new Map());

  // Initialize stable coordinates only once per venue
  useEffect(() => {
    venues.forEach(venue => {
      if (!stableCoordinates.current.has(venue.id)) {
        const coords = getVenueCoordinates(venue);
        stableCoordinates.current.set(venue.id, coords);
        console.log(`Stored stable coordinates for venue ${venue.id}:`, coords);
      }
    });
  }, [venues]);

  // Get venues with their stable coordinates
  const venuesWithCoords = useMemo(() => {
    return venues.map(venue => ({
      venue,
      coordinates: stableCoordinates.current.get(venue.id) || getVenueCoordinates(venue)
    }));
  }, [venues]);

  // Debounced bounds change handler
  const debouncedBoundsChange = useCallback((bounds: { north: number; south: number; east: number; west: number }) => {
    if (boundsChangeTimeout.current) {
      clearTimeout(boundsChangeTimeout.current);
    }
    
    boundsChangeTimeout.current = setTimeout(() => {
      if (onBoundsChange && !isUserInteracting.current) {
        onBoundsChange(bounds);
      }
    }, 300); // 300ms debounce
  }, [onBoundsChange]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [44.8271, 41.7151], // Tbilisi, Georgia
      zoom: 11,
      pitch: 0,
      bearing: 0
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Track zoom level
    map.current.on('zoom', () => {
      if (map.current) {
        setCurrentZoom(map.current.getZoom());
      }
    });

    // Add bounds change listener with debouncing
    map.current.on('moveend', () => {
      if (map.current) {
        const bounds = map.current.getBounds();
        debouncedBoundsChange({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest()
        });
      }
    });

    // Track user interactions to prevent unwanted bounds changes
    map.current.on('movestart', () => {
      isUserInteracting.current = true;
    });

    map.current.on('moveend', () => {
      // Small delay to ensure the move is complete
      setTimeout(() => {
        isUserInteracting.current = false;
      }, 100);
    });

    map.current.on('zoomstart', () => {
      isUserInteracting.current = true;
    });

    map.current.on('zoomend', () => {
      // Small delay to ensure the zoom is complete
      setTimeout(() => {
        isUserInteracting.current = false;
      }, 100);
    });

    return () => {
      if (boundsChangeTimeout.current) {
        clearTimeout(boundsChangeTimeout.current);
      }
      map.current?.remove();
    };
  }, [mapboxToken, debouncedBoundsChange]);

  // Update markers when venues change or zoom changes
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Cluster venues based on current zoom using stable coordinates
    const clusters = clusterVenues(venuesWithCoords, currentZoom);

    // Add new markers
    clusters.forEach(cluster => {
      const venue = cluster.venues[0];
      const coordinates = cluster.coordinates;
      
      // Get price for the venue
      let minPrice = venue.price || 25;

      // Create marker element (Airbnb-style price bubble)
      const markerEl = document.createElement('div');
      markerEl.className = 'venue-marker';
      
      // Adjust marker size based on zoom level
      const isZoomedOut = currentZoom < 12;
      const markerClass = isZoomedOut ? 'price-marker-zoomed-out' : 'price-marker';
      
      markerEl.innerHTML = `
        <div class="${markerClass} ${selectedVenue?.id === venue.id ? 'selected' : ''}" data-venue-id="${venue.id}">
          <span class="price-text">₾${minPrice}</span>
        </div>
      `;

      // Add click handler
      markerEl.addEventListener('click', (e) => {
        e.stopPropagation();
        setPopupVenue(venue);
        setShowPopup(true);
        onVenueClick?.(venue);

        // Calculate popup position
        const rect = mapContainer.current?.getBoundingClientRect();
        if (rect) {
          const mapPoint = map.current?.project([coordinates.lng, coordinates.lat]);
          if (mapPoint) {
            setPopupPosition({
              x: mapPoint.x,
              y: mapPoint.y - 10
            });
          }
        }
      });

      // Create and add marker
      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat([coordinates.lng, coordinates.lat])
        .addTo(map.current);

      markers.current.push(marker);
    });

    // Add marker styles
    const style = document.createElement('style');
    style.textContent = `
      .price-marker {
        background: white;
        border: 1.5px solid #e5e7eb;
        border-radius: 16px;
        padding: 2px 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.10);
        position: relative;
        color: #374151;
        min-width: unset;
        width: auto;
        display: inline-block;
        text-align: center;
        max-width: 60px;
      }
      .price-marker-zoomed-out {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 1px 6px;
        font-size: 10px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 1px 3px rgba(0,0,0,0.10);
        position: relative;
        color: #374151;
        min-width: unset;
        width: auto;
        display: inline-block;
        text-align: center;
        max-width: 45px;
      }
      .price-marker:hover, .price-marker.selected,
      .price-marker-zoomed-out:hover, .price-marker-zoomed-out.selected {
        background: #1f2937;
        color: white;
        border-color: #1f2937;
        transform: scale(1.08);
        z-index: 10;
      }
      .price-marker::after {
        content: '';
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 6px solid #e5e7eb;
        transition: border-color 0.2s ease;
      }
      .price-marker-zoomed-out::after {
        content: '';
        position: absolute;
        bottom: -4px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 4px solid #e5e7eb;
        transition: border-color 0.2s ease;
      }
      .price-marker:hover::after, .price-marker.selected::after,
      .price-marker-zoomed-out:hover::after, .price-marker-zoomed-out.selected::after {
        border-top-color: #1f2937;
      }
      .venue-marker {
        position: relative;
        z-index: 1;
      }
      .price-text {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
    `;
    document.head.appendChild(style);
  }, [venuesWithCoords, selectedVenue, onVenueClick, currentZoom]);

  // Close popup when clicking on map
  useEffect(() => {
    if (!map.current) return;

    const handleMapClick = () => {
      setShowPopup(false);
      setPopupVenue(null);
    };

    map.current.on('click', handleMapClick);

    return () => {
      map.current?.off('click', handleMapClick);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden" />
      
      {/* Venue Popup */}
      {showPopup && popupVenue && (
        <div
          className="absolute z-50 transform -translate-x-1/2 -translate-y-full"
          style={{
            left: popupPosition.x,
            top: popupPosition.y,
            pointerEvents: 'auto'
          }}
        >
          <VenueMapPopup
            venue={popupVenue}
            onClose={() => {
              setShowPopup(false);
              setPopupVenue(null);
            }}
          />
        </div>
      )}
      
      {/* Map attribution */}
      <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded">
        © Mapbox © OpenStreetMap
      </div>
    </div>
  );
};

export default MapboxVenueMap;
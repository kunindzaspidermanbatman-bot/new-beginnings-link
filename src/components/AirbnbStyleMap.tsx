import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Venue, useVenueServices } from '@/hooks/useVenues';
import { getServiceDisplayPrice } from '@/utils/guestPricing';
import AirbnbMapPopup from './AirbnbMapPopup';

interface AirbnbStyleMapProps {
  venues: Venue[];
  selectedVenue?: Venue | null;
  onVenueClick?: (venue: Venue) => void;
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void;
  mapCenter?: { lat: number; lng: number } | null;
  googleMapsApiKey: string;
  className?: string;
}

// Generate stable coordinates for venues
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

// Component to handle venue services data
const VenueMarker = ({ venue, coordinates, onVenueClick, map, isSelected }: { 
  venue: Venue; 
  coordinates: { lat: number; lng: number };
  onVenueClick?: (venue: Venue) => void;
  map: google.maps.Map | null;
  isSelected: boolean;
}) => {
  const { data: services } = useVenueServices(venue.id);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);

  // Calculate price from services using the same logic as VenueCard
  const getVenuePrice = useMemo(() => {
    if (services && services.length > 0) {
      // Use the same logic as VenueCard
      const prices = services.map(service => {
        const displayPrice = getServiceDisplayPrice(service);
        // Extract numeric value from "From X₾" or "X₾/guest" format
        const numericMatch = displayPrice.match(/(\d+)₾/);
        return numericMatch ? parseInt(numericMatch[1]) : service.price;
      });
      return Math.min(...prices);
    }
    
    // Fallback to venue price if no services
    if (typeof venue.price === 'number' && venue.price > 0) {
      return venue.price;
    }
    
    // Default fallback
    return 20;
  }, [services, venue.price]);

  // Create marker icon with Airbnb-style design
  const createMarkerIcon = useCallback((price: number, selected: boolean = false) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Airbnb-style font and text setup
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    const text = `₾${price}`;
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;
    
    // Airbnb-style dimensions with generous padding
    const horizontalPadding = 12;
    const verticalPadding = 6;
    const canvasWidth = textWidth + (horizontalPadding * 2);
    const canvasHeight = 28; // Fixed height for consistency
    const borderRadius = 14; // Half of height for perfect pill shape

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Airbnb-style colors
    const bgColor = selected ? '#222222' : '#ffffff';
    const textColor = selected ? '#ffffff' : '#222222';
    const borderColor = '#dddddd';
    const shadowColor = 'rgba(0, 0, 0, 0.18)';

    // Add shadow (slightly offset)
    if (!selected) {
      ctx.fillStyle = shadowColor;
      ctx.beginPath();
      ctx.moveTo(borderRadius + 1, 1);
      ctx.lineTo(canvasWidth - borderRadius + 1, 1);
      ctx.quadraticCurveTo(canvasWidth + 1, 1, canvasWidth + 1, borderRadius + 1);
      ctx.lineTo(canvasWidth + 1, canvasHeight - borderRadius + 1);
      ctx.quadraticCurveTo(canvasWidth + 1, canvasHeight + 1, canvasWidth - borderRadius + 1, canvasHeight + 1);
      ctx.lineTo(borderRadius + 1, canvasHeight + 1);
      ctx.quadraticCurveTo(1, canvasHeight + 1, 1, canvasHeight - borderRadius + 1);
      ctx.lineTo(1, borderRadius + 1);
      ctx.quadraticCurveTo(1, 1, borderRadius + 1, 1);
      ctx.closePath();
      ctx.fill();
    }

    // Draw main pill shape
    ctx.fillStyle = bgColor;
    ctx.strokeStyle = selected ? bgColor : borderColor;
    ctx.lineWidth = selected ? 0 : 1;
    
    ctx.beginPath();
    ctx.moveTo(borderRadius, 0);
    ctx.lineTo(canvasWidth - borderRadius, 0);
    ctx.quadraticCurveTo(canvasWidth, 0, canvasWidth, borderRadius);
    ctx.lineTo(canvasWidth, canvasHeight - borderRadius);
    ctx.quadraticCurveTo(canvasWidth, canvasHeight, canvasWidth - borderRadius, canvasHeight);
    ctx.lineTo(borderRadius, canvasHeight);
    ctx.quadraticCurveTo(0, canvasHeight, 0, canvasHeight - borderRadius);
    ctx.lineTo(0, borderRadius);
    ctx.quadraticCurveTo(0, 0, borderRadius, 0);
    ctx.closePath();
    
    ctx.fill();
    if (!selected) {
      ctx.stroke();
    }

    // Draw price text
    ctx.fillStyle = textColor;
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvasWidth / 2, canvasHeight / 2);

    return {
      url: canvas.toDataURL(),
      scaledSize: new google.maps.Size(canvasWidth, canvasHeight),
      anchor: new google.maps.Point(canvasWidth / 2, canvasHeight),
      origin: new google.maps.Point(0, 0)
    };
  }, []);

  // Create and update marker
  useEffect(() => {
    if (!map || !window.google || !window.google.maps) {
      console.log('VenueMarker: Not ready to create marker - missing dependencies');
      return;
    }

    const price = getVenuePrice;
    const markerIcon = createMarkerIcon(price, isSelected);
    
    if (!markerIcon) {
      console.log('VenueMarker: Failed to create marker icon');
      return;
    }

    console.log(`VenueMarker: Creating marker for ${venue.name} at`, coordinates, 'with price', price);

    try {
      const newMarker = new google.maps.Marker({
        position: coordinates,
        map: map,
        title: venue.name,
        icon: markerIcon,
        clickable: true,
        draggable: false,
        zIndex: isSelected ? 10 : 1,
        optimized: false // Disable optimization to ensure custom icons work
      });

      // Add click listener
      newMarker.addListener('click', () => {
        console.log('VenueMarker: Marker clicked for venue:', venue.name);
        onVenueClick?.(venue);
      });

      console.log(`VenueMarker: Marker created successfully for ${venue.name}`);
      setMarker(newMarker);

      return () => {
        console.log(`VenueMarker: Cleaning up marker for ${venue.name}`);
        if (newMarker) {
          newMarker.setMap(null);
        }
      };
    } catch (error) {
      console.error(`VenueMarker: Error creating marker for ${venue.name}:`, error);
    }
  }, [map, venue, coordinates, getVenuePrice, createMarkerIcon, onVenueClick, isSelected]);

  // Update marker icon when price changes or selection state changes
  useEffect(() => {
    if (marker && window.google && window.google.maps) {
      const price = getVenuePrice;
      const markerIcon = createMarkerIcon(price, isSelected);
      marker.setIcon(markerIcon);
      marker.setZIndex(isSelected ? 10 : 1);
    }
  }, [marker, getVenuePrice, createMarkerIcon, isSelected]);

  return null; // This component doesn't render anything visible
};

const AirbnbStyleMap = ({ 
  venues, 
  selectedVenue, 
  onVenueClick, 
  onBoundsChange, 
  mapCenter,
  googleMapsApiKey,
  className = "w-full h-full"
}: AirbnbStyleMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupVenue, setPopupVenue] = useState<Venue | null>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const boundsChangeTimeout = useRef<NodeJS.Timeout | null>(null);
  const isUserInteracting = useRef(false);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  
  const stableCoordinates = useRef<Map<string, { lat: number; lng: number }>>(new Map());

  // Initialize stable coordinates
  useEffect(() => {
    venues.forEach(venue => {
      if (!stableCoordinates.current.has(venue.id)) {
        const coords = getVenueCoordinates(venue);
        stableCoordinates.current.set(venue.id, coords);
      }
    });
  }, [venues]);

  const venuesWithCoords = useMemo(() => {
    return venues.map(venue => ({
      venue,
      coordinates: stableCoordinates.current.get(venue.id) || getVenueCoordinates(venue)
    }));
  }, [venues]);

  // Calculate smart popup position based on marker location
  const calculatePopupPosition = useCallback((venue: Venue) => {
    if (!map.current) return { x: 0, y: 0 };

    const coordinates = stableCoordinates.current.get(venue.id) || getVenueCoordinates(venue);
    
    // Get the map's current viewport
    const bounds = map.current.getBounds();
    if (!bounds) return { x: 0, y: 0 };

    // Get map container dimensions
    const mapDiv = map.current.getDiv();
    const mapRect = mapDiv.getBoundingClientRect();
    const mapWidth = mapRect.width;
    const mapHeight = mapRect.height;

    // Calculate marker position relative to map center
    const center = map.current.getCenter();
    if (!center) return { x: 0, y: 0 };

    // Get the map's projection
    const projection = map.current.getProjection();
    if (!projection) return { x: 0, y: 0 };

    // Convert coordinates to pixel positions
    const centerPoint = projection.fromLatLngToPoint(center);
    const markerPoint = projection.fromLatLngToPoint(coordinates);
    
    // Calculate pixel offset from center
    const scale = Math.pow(2, map.current.getZoom() || 11);
    const pixelX = (markerPoint.x - centerPoint.x) * scale + mapWidth / 2;
    const pixelY = (markerPoint.y - centerPoint.y) * scale + mapHeight / 2;

    // Popup dimensions (smaller)
    const popupWidth = 280;
    const popupHeight = 280; // Reduced height
    const markerHeight = 20; // Approximate height for dynamic markers (12px text + 8px padding)
    const gapAbove = 20; // Gap when popup is above marker
    const gapBelow = 5; // Much smaller gap when popup is below marker

    // IMPORTANT: pixelY represents the BOTTOM of the marker (due to anchor point)
    // So we need to calculate marker top and bottom positions correctly
    const markerTop = pixelY - markerHeight; // Top of marker
    const markerBottom = pixelY; // Bottom of marker (this is pixelY)

    // Determine if popup should go above or below marker
    const spaceAbove = markerTop - popupHeight - gapAbove;
    const spaceBelow = mapHeight - markerBottom - popupHeight - gapBelow;
    
    let x = pixelX - popupWidth / 2; // Center horizontally on marker
    let y;

    if (spaceAbove >= 0) {
      // Place above marker with normal gap
      y = markerTop - popupHeight - gapAbove;
      console.log('Placing popup ABOVE marker with gap:', gapAbove);
    } else if (spaceBelow >= 0) {
      // Place below marker with minimal gap
      y = markerBottom + gapBelow;
      console.log('Placing popup BELOW marker with minimal gap:', gapBelow);
    } else {
      // If neither fits, place where there's more space
      if (spaceAbove > spaceBelow) {
        y = markerTop - popupHeight - gapAbove;
        console.log('Placing popup ABOVE marker (fallback) with gap:', gapAbove);
      } else {
        y = markerBottom + gapBelow;
        console.log('Placing popup BELOW marker (fallback) with minimal gap:', gapBelow);
      }
    }

    // Allow popup to extend beyond map boundaries (only minimal constraints)
    // Only prevent it from going completely off-screen
    if (x < -popupWidth + 50) x = -popupWidth + 50; // Allow some overflow but keep part visible
    if (x > mapWidth - 50) x = mapWidth - 50; // Allow some overflow but keep part visible
    if (y < -popupHeight + 50) y = -popupHeight + 50; // Allow some overflow but keep part visible
    if (y > mapHeight - 50) y = mapHeight - 50; // Allow some overflow but keep part visible

    console.log('Popup positioning:', {
      markerPixelX: pixelX,
      markerPixelY: pixelY,
      markerTop,
      markerBottom,
      popupX: x,
      popupY: y,
      spaceAbove,
      spaceBelow,
      gapAbove,
      gapBelow,
      mapWidth,
      mapHeight,
      popupBottom: y + popupHeight,
      actualGapAbove: markerTop - (y + popupHeight),
      actualGapBelow: y - markerBottom
    });

    return { x, y };
  }, []);

  const debouncedBoundsChange = useCallback((bounds: google.maps.LatLngBounds) => {
    if (boundsChangeTimeout.current) {
      clearTimeout(boundsChangeTimeout.current);
    }
    
    boundsChangeTimeout.current = setTimeout(() => {
      if (onBoundsChange && !isUserInteracting.current) {
        onBoundsChange({
          north: bounds.getNorthEast().lat(),
          south: bounds.getSouthWest().lat(),
          east: bounds.getNorthEast().lng(),
          west: bounds.getSouthWest().lng()
        });
      }
    }, 300);
  }, [onBoundsChange]);

  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current || !googleMapsApiKey) return;

    if (!window.google || !window.google.maps) return;

    console.log('AirbnbStyleMap: Initializing map with', venuesWithCoords.length, 'venues');

    const mapOptions: google.maps.MapOptions = {
      center: { lat: 41.7151, lng: 44.8271 }, // Tbilisi, Georgia
      zoom: 11,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'transit',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'landscape',
          elementType: 'geometry',
          stylers: [{ color: '#f5f5f5' }]
        }
      ]
    };

    try {
      map.current = new google.maps.Map(mapRef.current, mapOptions);

      // Wait for map to be fully loaded before creating markers
      google.maps.event.addListenerOnce(map.current, 'tilesloaded', () => {
        console.log('AirbnbStyleMap: Map tiles loaded, setting map ready');
        setIsMapReady(true);
        
        // Fit map to show all venues after map is loaded
        if (venuesWithCoords.length > 0) {
          const bounds = new google.maps.LatLngBounds();
          venuesWithCoords.forEach(({ coordinates }) => {
            bounds.extend(coordinates);
          });
          
          // Fit the map to show all venues with some padding
          map.current!.fitBounds(bounds, {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50
          });
          
          console.log('AirbnbStyleMap: Map fitted to show all venues');
        }
      });

      map.current.addListener('bounds_changed', () => {
        if (map.current) {
          const bounds = map.current.getBounds();
          if (bounds) {
            debouncedBoundsChange(bounds);
          }
        }
      });

      map.current.addListener('dragstart', () => {
        isUserInteracting.current = true;
      });

      map.current.addListener('dragend', () => {
        setTimeout(() => {
          isUserInteracting.current = false;
        }, 100);
      });

      map.current.addListener('zoom_changed', () => {
        isUserInteracting.current = true;
        setTimeout(() => {
          isUserInteracting.current = false;
        }, 100);
      });

    } catch (error) {
      console.error('AirbnbStyleMap: Error initializing map:', error);
    }

    return () => {
      if (boundsChangeTimeout.current) {
        clearTimeout(boundsChangeTimeout.current);
      }
      setIsMapReady(false);
    };
  }, [googleMapsApiKey, debouncedBoundsChange, venuesWithCoords]);

  // Handle mapCenter changes - center map on user's location
  useEffect(() => {
    if (!map.current || !mapCenter) return;

    console.log('AirbnbStyleMap: Centering map on user location:', mapCenter);
    
    // Smoothly animate to user's location
    map.current.panTo(mapCenter);
    map.current.setZoom(14); // Zoom in to a reasonable level for user location
  }, [mapCenter]);

  // Handle venue click
  const handleVenueClick = useCallback((venue: Venue) => {
    console.log('AirbnbStyleMap: Venue clicked:', venue.name);
    
    // Close any existing popup first
    if (showPopup) {
      console.log('AirbnbStyleMap: Closing existing popup');
      setShowPopup(false);
      setPopupVenue(null);
      setSelectedMarkerId(null);
    }
    
    console.log('AirbnbStyleMap: Setting popup state...');
    
    // Calculate smart position for the popup
    const position = calculatePopupPosition(venue);
    setPopupPosition(position);
    
    setSelectedMarkerId(venue.id);
    setPopupVenue(venue);
    setShowPopup(true);
    console.log('AirbnbStyleMap: Popup state set to show for venue:', venue.name);
    console.log('AirbnbStyleMap: Popup position:', position);
    onVenueClick?.(venue);
  }, [onVenueClick, calculatePopupPosition, showPopup]);

  // Close popup when clicking on map
  useEffect(() => {
    if (!map.current) return;

    const handleMapClick = () => {
      setShowPopup(false);
      setPopupVenue(null);
      setSelectedMarkerId(null);
    };

    map.current.addListener('click', handleMapClick);

    return () => {
      if (map.current) {
        google.maps.event.clearListeners(map.current, 'click');
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden" />
      
      {/* Render venue markers only when map is ready */}
      {isMapReady && venuesWithCoords.map(({ venue, coordinates }) => (
        <VenueMarker
          key={venue.id}
          venue={venue}
          coordinates={coordinates}
          onVenueClick={handleVenueClick}
          map={map.current}
          isSelected={selectedMarkerId === venue.id}
        />
      ))}
      
      {/* Venue Popup - Smart positioned */}
      {showPopup && popupVenue && (() => {
        console.log('AirbnbStyleMap: Rendering popup for venue:', popupVenue.name);
        return (
          <div 
            className="absolute z-50 pointer-events-auto" 
            style={{
              left: `${popupPosition.x}px`,
              top: `${popupPosition.y}px`,
              minWidth: '280px',
              maxWidth: '320px'
            }}
          >
            <AirbnbMapPopup
              venue={popupVenue}
              onClose={() => {
                console.log('AirbnbStyleMap: Closing popup');
                setShowPopup(false);
                setPopupVenue(null);
                setSelectedMarkerId(null);
              }}
            />
          </div>
        );
      })()}
      
      {/* Map attribution */}
      <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded">
        © Google Maps
      </div>
    </div>
  );
};

export default AirbnbStyleMap;
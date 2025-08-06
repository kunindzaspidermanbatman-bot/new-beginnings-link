import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Venue } from '@/hooks/useVenues';
import VenueMapPopup from './VenueMapPopup';

interface GoogleVenueMapProps {
  venues: Venue[];
  selectedVenue?: Venue | null;
  onVenueClick?: (venue: Venue) => void;
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void;
  googleMapsApiKey: string;
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

const GoogleVenueMap = ({ 
  venues, 
  selectedVenue, 
  onVenueClick, 
  onBoundsChange, 
  googleMapsApiKey,
  className = "w-full h-full"
}: GoogleVenueMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const markers = useRef<google.maps.Marker[]>([]);
  const infoWindows = useRef<google.maps.InfoWindow[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupVenue, setPopupVenue] = useState<Venue | null>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const boundsChangeTimeout = useRef<NodeJS.Timeout | null>(null);
  const isUserInteracting = useRef(false);
  const activeInfoWindow = useRef<google.maps.InfoWindow | null>(null);
  
  // Store stable coordinates in a ref to prevent recalculation
  const stableCoordinates = useRef<Map<string, { lat: number; lng: number }>>(new Map());

  // Initialize stable coordinates only once per venue
  useEffect(() => {
    venues.forEach(venue => {
      if (!stableCoordinates.current.has(venue.id)) {
        const coords = getVenueCoordinates(venue);
        stableCoordinates.current.set(venue.id, coords);
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

  // Helper function to get the correct price for a venue
  const getVenuePrice = (venue: Venue) => {
    // If venue has a valid price, use it
    if (typeof venue.price === 'number' && venue.price > 0) {
      return venue.price;
    }
    
    // Fallback to 25 if no price is available
    return 25;
  };

  // Helper function to create Airbnb-style marker icon
  const createMarkerIcon = (price: number) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = 60;
    canvas.height = 30;

    // Draw the marker background (Airbnb style)
    ctx.fillStyle = '#222222';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    // Create rounded rectangle
    const radius = 15;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(canvas.width - radius, 0);
    ctx.quadraticCurveTo(canvas.width, 0, canvas.width, radius);
    ctx.lineTo(canvas.width, canvas.height - radius);
    ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - radius, canvas.height);
    ctx.lineTo(radius, canvas.height);
    ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    
    ctx.fill();
    ctx.stroke();

    // Add price text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
            ctx.fillText(`${price} GEL`, canvas.width / 2, canvas.height / 2);

    return {
      url: canvas.toDataURL(),
      scaledSize: new google.maps.Size(60, 30),
      anchor: new google.maps.Point(30, 30), // Center bottom
      origin: new google.maps.Point(0, 0)
    };
  };

  // Helper function to create hover tooltip content
  const createTooltipContent = (venue: Venue) => {
    const price = getVenuePrice(venue);
    const firstImage = venue.images && venue.images.length > 0 ? venue.images[0] : '/placeholder.svg';
    const imageCount = venue.images ? venue.images.length : 0;
    
    return `
      <div class="airbnb-venue-card" style="
        width: 320px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 6px 16px rgba(0,0,0,0.12);
        overflow: hidden;
        font-family: Circular, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, sans-serif;
        cursor: default;
        border: 1px solid #ebebeb;
        transition: transform 0.2s ease;
      ">
        <!-- Image Container -->
        <div style="position: relative; height: 200px; background: #f7f7f7;">
          <img src="${firstImage}" alt="${venue.name}" style="
            width: 100%;
            height: 100%;
            object-fit: cover;
          " onerror="this.src='/placeholder.svg'">
          
          <!-- Overlay Buttons -->
          <div style="
            position: absolute;
            top: 12px;
            right: 12px;
            display: flex;
            gap: 8px;
          ">
            <!-- Heart Button -->
            <div class="heart-btn" style="
              width: 32px;
              height: 32px;
              background: rgba(255,255,255,0.9);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              font-size: 16px;
              color: #222222;
              transition: all 0.2s ease;
            ">♡</div>
            
            <!-- Close Button -->
            <div class="close-btn" style="
              width: 32px;
              height: 32px;
              background: rgba(255,255,255,0.9);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              font-size: 18px;
              color: #222222;
              font-weight: 300;
              transition: all 0.2s ease;
            ">×</div>
          </div>
          
          <!-- Image Dots -->
          ${imageCount > 1 ? `
            <div style="
              position: absolute;
              bottom: 12px;
              left: 50%;
              transform: translateX(-50%);
              display: flex;
              gap: 6px;
            ">
              ${Array.from({ length: Math.min(imageCount, 5) }, (_, i) => `
                <div style="
                  width: 6px;
                  height: 6px;
                  border-radius: 50%;
                  background: ${i === 0 ? 'white' : 'rgba(255,255,255,0.6)'};
                  border: ${i === 0 ? 'none' : '1px solid rgba(255,255,255,0.6)'};
                "></div>
              `).join('')}
            </div>
          ` : ''}
        </div>
        
        <!-- Content Section -->
        <div style="padding: 12px;">
          <!-- Title and Rating Row -->
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 4px;
          ">
            <div style="
              font-weight: 600;
              font-size: 15px;
              line-height: 20px;
              color: #222222;
              flex: 1;
              margin-right: 12px;
            ">${venue.name}</div>
            
            ${venue.rating ? `
              <div style="
                display: flex;
                align-items: center;
                font-size: 14px;
                color: #222222;
                white-space: nowrap;
              ">
                <span style="margin-right: 4px;">★</span>
                <span style="font-weight: 500;">${venue.rating}</span>
                <span style="color: #717171; margin-left: 4px;">(${venue.review_count || 0})</span>
              </div>
            ` : ''}
          </div>
          
          <!-- Location -->
          <div style="
            font-size: 14px;
            color: #717171;
            margin-bottom: 4px;
            line-height: 18px;
          ">📍 ${venue.district}</div>
          
          <!-- Category -->
          <div style="
            font-size: 14px;
            color: #717171;
            margin-bottom: 8px;
            line-height: 18px;
          ">🎮 ${venue.category}</div>
          
          <!-- Price -->
          <div style="
            font-size: 15px;
            color: #222222;
            margin-bottom: 12px;
            line-height: 18px;
          ">
            <span style="font-weight: 600;">${price} GEL</span>
            <span style="font-weight: 400; color: #717171;"> per hour</span>
          </div>
          
          <!-- View Details Button -->
          <div class="view-details-btn" style="
            background: #222222;
            color: white;
            text-align: center;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s ease;
            user-select: none;
            line-height: 18px;
          ">View Details</div>
        </div>
      </div>
    `;
  };

  // Debounced bounds change handler
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
    if (!mapRef.current || !googleMapsApiKey) {
      console.log('GoogleVenueMap: Missing mapRef or API key', { 
        hasMapRef: !!mapRef.current, 
        hasApiKey: !!googleMapsApiKey 
      });
      return;
    }

    // Check if Google Maps is loaded
    if (!window.google || !window.google.maps) {
      console.log('GoogleVenueMap: Google Maps not loaded yet');
      return;
    }

    console.log('GoogleVenueMap: Initializing map with', venuesWithCoords.length, 'venues');

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
        }
      ]
    };

    try {
      map.current = new google.maps.Map(mapRef.current, mapOptions);
      console.log('GoogleVenueMap: Map initialized successfully');

      // Add bounds change listener
      map.current.addListener('bounds_changed', () => {
        if (map.current) {
          const bounds = map.current.getBounds();
          if (bounds) {
            debouncedBoundsChange(bounds);
          }
        }
      });

      // Track user interactions
      map.current.addListener('dragstart', () => {
        isUserInteracting.current = true;
        // Close any open info windows when dragging
        if (activeInfoWindow.current) {
          activeInfoWindow.current.close();
          activeInfoWindow.current = null;
        }
      });

      map.current.addListener('dragend', () => {
        setTimeout(() => {
          isUserInteracting.current = false;
        }, 100);
      });

      map.current.addListener('zoom_changed', () => {
        isUserInteracting.current = true;
        // Close any open info windows when zooming
        if (activeInfoWindow.current) {
          activeInfoWindow.current.close();
          activeInfoWindow.current = null;
        }
        setTimeout(() => {
          isUserInteracting.current = false;
        }, 100);
      });

    } catch (error) {
      console.error('GoogleVenueMap: Error initializing map:', error);
    }

    return () => {
      if (boundsChangeTimeout.current) {
        clearTimeout(boundsChangeTimeout.current);
      }
    };
  }, [googleMapsApiKey, debouncedBoundsChange, venuesWithCoords.length]);

  // Update markers when venues change
  useEffect(() => {
    if (!map.current) {
      console.log('GoogleVenueMap: Map not ready for markers');
      return;
    }

    console.log('GoogleVenueMap: Updating markers for', venuesWithCoords.length, 'venues');

    // Clear existing markers and info windows
    markers.current.forEach(marker => marker.setMap(null));
    markers.current = [];
    
    infoWindows.current.forEach(infoWindow => infoWindow.close());
    infoWindows.current = [];

    // Add new markers
    venuesWithCoords.forEach(({ venue, coordinates }, index) => {
      try {
        // Get correct price for the venue
        const price = getVenuePrice(venue);

        console.log(`Creating marker ${index + 1}/${venuesWithCoords.length} for venue ${venue.name} at`, coordinates);

        // Create custom marker icon
        const markerIcon = createMarkerIcon(price);

        // Create Google Maps marker with custom icon
        const marker = new google.maps.Marker({
          position: coordinates,
          map: map.current,
          title: venue.name, // This shows on hover
          icon: markerIcon,
          clickable: true,
          draggable: false,
          zIndex: 1
        });

        // Create info window for hover tooltip
        const infoWindow = new google.maps.InfoWindow({
          content: createTooltipContent(venue),
          disableAutoPan: true,
          pixelOffset: new google.maps.Size(-160, -10), // Center the card over the marker
          maxWidth: 320
        });

        // Add hover listeners with delay
        let hoverTimeout: NodeJS.Timeout;
        
        marker.addListener('mouseover', () => {
          console.log('Marker hover:', venue.name);
          clearTimeout(hoverTimeout);
          hoverTimeout = setTimeout(() => {
            // Close any other open info window
            if (activeInfoWindow.current && activeInfoWindow.current !== infoWindow) {
              activeInfoWindow.current.close();
            }
            infoWindow.open(map.current, marker);
            activeInfoWindow.current = infoWindow;
          }, 200); // Small delay to prevent flickering
        });

        marker.addListener('mouseout', () => {
          clearTimeout(hoverTimeout);
          setTimeout(() => {
            if (activeInfoWindow.current === infoWindow) {
              infoWindow.close();
              activeInfoWindow.current = null;
            }
          }, 300); // Keep open briefly when moving from marker to info window
        });

        // Add click listener to marker
        marker.addListener('click', () => {
          console.log('Marker clicked:', venue.name);
          infoWindow.close();
          activeInfoWindow.current = null;
          setPopupVenue(venue);
          setShowPopup(true);
          onVenueClick?.(venue);
        });

        // Add click listener to info window content
        infoWindow.addListener('domready', () => {
          // Wait a bit for the DOM to be ready
          setTimeout(() => {
            const infoWindowElement = infoWindow.getContent();
            if (infoWindowElement) {
              const div = document.createElement('div');
              div.innerHTML = infoWindowElement as string;
              
              // Add click listener to the entire card
              const venueCard = div.querySelector('.airbnb-venue-card');
              if (venueCard) {
                venueCard.addEventListener('click', (e) => {
                  // Don't trigger if clicking on close or favorite buttons
                  if ((e.target as Element).closest('.close-btn') || (e.target as Element).closest('.heart-btn')) {
                    return;
                  }
                  console.log('Venue card clicked:', venue.name);
                  infoWindow.close();
                  activeInfoWindow.current = null;
                  setPopupVenue(venue);
                  setShowPopup(true);
                  onVenueClick?.(venue);
                });
              }
              
              // Add specific click listener to View Details button
              const viewDetailsBtn = div.querySelector('.view-details-btn');
              if (viewDetailsBtn) {
                viewDetailsBtn.addEventListener('click', (e) => {
                  e.stopPropagation();
                  console.log('View Details button clicked:', venue.name);
                  infoWindow.close();
                  activeInfoWindow.current = null;
                  setPopupVenue(venue);
                  setShowPopup(true);
                  onVenueClick?.(venue);
                });
              }
              
              // Add click listener to close button
              const closeBtn = div.querySelector('.close-btn');
              if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                  e.stopPropagation();
                  console.log('Close button clicked');
                  infoWindow.close();
                  activeInfoWindow.current = null;
                });
              }
              
              // Add click listener to favorite button
              const favoriteBtn = div.querySelector('.heart-btn') as HTMLElement;
              if (favoriteBtn) {
                favoriteBtn.addEventListener('click', (e) => {
                  e.stopPropagation();
                  console.log('Favorite button clicked:', venue.name);
                  // TODO: Implement favorite functionality
                  favoriteBtn.innerHTML = '♥';
                  favoriteBtn.style.color = '#ff385c';
                });
              }
            }
          }, 100);
        });

        markers.current.push(marker);
        infoWindows.current.push(infoWindow);

      } catch (error) {
        console.error(`Error creating marker for venue ${venue.name}:`, error);
      }
    });

    console.log('GoogleVenueMap: Created', markers.current.length, 'markers');

    // Add marker styles
    const style = document.createElement('style');
    style.textContent = `
      .airbnb-venue-card {
        transition: transform 0.2s ease;
      }
      .airbnb-venue-card:hover {
        transform: translateY(-2px);
      }
      .airbnb-venue-card img {
        transition: transform 0.3s ease;
      }
      .airbnb-venue-card:hover img {
        transform: scale(1.05);
      }
      .view-details-btn:hover {
        background: #000000 !important;
      }
      .heart-btn:hover {
        background: rgba(255,255,255,1) !important;
      }
      .close-btn:hover {
        background: rgba(255,255,255,1) !important;
      }
    `;
    document.head.appendChild(style);
  }, [venuesWithCoords, selectedVenue, onVenueClick]);

  // Close popup when clicking on map
  useEffect(() => {
    if (!map.current) return;

    const handleMapClick = () => {
      setShowPopup(false);
      setPopupVenue(null);
      // Close any open info windows
      if (activeInfoWindow.current) {
        activeInfoWindow.current.close();
        activeInfoWindow.current = null;
      }
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
        © Google Maps
      </div>
    </div>
  );
};

export default GoogleVenueMap; 
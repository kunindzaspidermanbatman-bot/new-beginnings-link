import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Star, MapPin, Clock } from 'lucide-react';
import { Venue, useVenueServices } from '@/hooks/useVenues';
import { getServiceDisplayPrice } from '@/utils/guestPricing';

interface AirbnbMapPopupProps {
  venue: Venue;
  onClose: () => void;
}

const AirbnbMapPopup = ({ venue, onClose }: AirbnbMapPopupProps) => {
  const { data: services } = useVenueServices(venue.id);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  console.log('AirbnbMapPopup: Rendering popup for venue:', venue.name);
  console.log('AirbnbMapPopup: Services data:', services);
  
  const images = venue.images && venue.images.length > 0 ? venue.images : ['/placeholder.svg'];
  const totalImages = images.length;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % totalImages);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
  };

  // Calculate price from services using the same logic as VenueCard
  const getVenuePrice = () => {
    if (services && services.length > 0) {
      const prices = services.map(service => {
        const displayPrice = getServiceDisplayPrice(service);
        const numericMatch = displayPrice.match(/(\d+) GEL/);
        return numericMatch ? parseInt(numericMatch[1]) : service.price;
      });
      return Math.min(...prices);
    }
    
    if (typeof venue.price === 'number' && venue.price > 0) {
      return venue.price;
    }
    
    return 20;
  };

  const price = getVenuePrice();

  return (
    <div className="absolute z-50 bg-white rounded-2xl shadow-2xl max-w-xs w-full overflow-hidden border border-gray-200" style={{ minHeight: '260px' }}>
      {/* Image Carousel */}
      <div className="relative h-36 bg-gray-100">
        <img
          src={images[currentImageIndex]}
          alt={`${venue.name} - Image ${currentImageIndex + 1}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder.svg';
          }}
        />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-6 h-6 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-colors shadow-sm"
        >
          <X className="w-3 h-3 text-gray-700" />
        </button>

        {/* Navigation Arrows */}
        {totalImages > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-colors shadow-sm"
            >
              <ChevronLeft className="w-3 h-3 text-gray-700" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-colors shadow-sm"
            >
              <ChevronRight className="w-3 h-3 text-gray-700" />
            </button>
          </>
        )}

        {/* Image Dots */}
        {totalImages > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {Array.from({ length: totalImages }, (_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === currentImageIndex ? 'bg-white' : 'bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-1.5">
        {/* Title and Rating Row */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-sm text-gray-900 leading-tight">
              {venue.name}
            </h3>
            <div className="flex items-center text-gray-500 text-xs">
              <MapPin className="w-3 h-3 mr-1" />
              <span>{venue.district}</span>
            </div>
          </div>
          {venue.rating > 0 && (
            <div className="flex items-center text-xs text-gray-900 ml-2">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-0.5" />
              <span className="font-medium">{venue.rating}</span>
              <span className="text-gray-500 ml-0.5">({venue.review_count || 0})</span>
            </div>
          )}
        </div>

        {/* Category */}
        <div className="text-xs text-gray-500 mt-0.5">
          🎮 {venue.category}
        </div>

        {/* Services */}
        {services && services.length > 0 && (
          <div className="mt-1">
            <div className="flex flex-wrap gap-0.5">
              {services.slice(0, 2).map((service) => (
                <span
                  key={service.id}
                  className="inline-block bg-gray-100 text-gray-700 text-xs px-1 py-0.5 rounded"
                >
                  {service.name.length > 6 ? service.name.substring(0, 6) + '...' : service.name}
                </span>
              ))}
              {services.length > 2 && (
                <span className="inline-block bg-gray-100 text-gray-700 text-xs px-1 py-0.5 rounded">
                  +{services.length - 2}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline justify-between mt-1">
          <div>
                            <span className="text-lg font-bold text-gray-900">{price} GEL</span>
            <span className="text-gray-500 text-xs ml-1">per hour</span>
          </div>
          {venue.opening_time && venue.closing_time && (
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="w-3 h-3 mr-0.5" />
              <span>{venue.opening_time}-{venue.closing_time}</span>
            </div>
          )}
        </div>

        {/* View Details Button */}
        <button
          onClick={() => {
            // Navigate to venue page
            window.location.href = `/venue/${venue.id}`;
          }}
          className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-1 px-2 rounded text-sm mt-1"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default AirbnbMapPopup; 
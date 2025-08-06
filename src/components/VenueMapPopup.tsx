import { X, Star, ChevronRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Venue, useVenueServices } from "@/hooks/useVenues";
import { getServiceDisplayPrice } from "@/utils/guestPricing";
import { Link } from "react-router-dom";

interface VenueMapPopupProps {
  venue: Venue;
  onClose: () => void;
}

const VenueMapPopup = ({ venue, onClose }: VenueMapPopupProps) => {
  const { data: services } = useVenueServices(venue.id);

  const getMinPrice = () => {
    if (services && services.length > 0) {
      const prices = services.map(service => {
        const displayPrice = getServiceDisplayPrice(service);
        const numericMatch = displayPrice.match(/(\d+) GEL/);
        return numericMatch ? parseInt(numericMatch[1]) : service.price;
      });
      return Math.min(...prices);
    }
    return null;
  };

  return (
    <Card className="w-80 bg-white shadow-xl rounded-xl overflow-hidden border border-gray-200">
      {/* Header with image */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 bg-white/90 hover:bg-white rounded-full p-0.5 h-8 w-8 shadow-sm"
        >
          <X className="h-4 w-4" />
        </Button>
        
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={venue.images?.[0] || "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400"}
            alt={venue.name}
            className="w-full h-full object-cover"
          />
          
          {/* Heart button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-3 left-3 bg-white/90 hover:bg-white rounded-full p-0.5 h-8 w-8 shadow-sm"
          >
            <Heart className="h-4 w-4" />
          </Button>
          
          {/* Image dots if multiple images */}
          {venue.images && venue.images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5">
              {Array.from({ length: Math.min(venue.images.length, 5) }, (_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full border ${
                    i === 0 
                      ? 'bg-white border-white' 
                      : 'bg-white/60 border-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Title and Rating */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-base text-gray-900 line-clamp-2 flex-1 mr-3">
            {venue.name}
          </h3>
          {venue.rating && (
            <div className="flex items-center gap-1 text-sm flex-shrink-0">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-gray-900">{venue.rating}</span>
              {venue.review_count && (
                <span className="text-gray-500">({venue.review_count})</span>
              )}
            </div>
          )}
        </div>
        
        {/* Location */}
        <p className="text-gray-600 text-sm mb-2 line-clamp-1">
          📍 {venue.location}
        </p>
        
        {/* Category */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-1">
          🎮 {venue.category}
        </p>
        
        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            <span className="font-bold text-gray-900 text-lg">
              {getMinPrice() ? `${getMinPrice()} GEL` : 'Contact'}
            </span>
            <span className="text-gray-500 text-sm">
              {getMinPrice() ? '/hour' : ''}
            </span>
          </div>
        </div>
        
        {/* View Details button */}
        <Link to={`/venue/${venue.id}`} className="block">
          <Button 
            size="sm" 
            className="w-full h-10 text-sm font-semibold bg-gray-900 hover:bg-black text-white rounded-lg"
          >
            View Details
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>
    </Card>
  );
};

export default VenueMapPopup;
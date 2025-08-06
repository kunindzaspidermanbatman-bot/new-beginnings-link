import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { 
  Star, 
  MapPin, 
  Percent, 
  Clock, 
  Gift, 
  Users, 
  ArrowRight,
  ArrowLeft,
  Eye
} from "lucide-react";
import { Venue, useVenueServices } from "@/hooks/useVenues";
import { getServiceDisplayPrice } from "@/utils/guestPricing";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface VenueCardProps {
  venue: Venue;
  compact?: boolean;
  searchMode?: boolean;
  onHover?: (venue: Venue) => void;
}

const VenueCard = ({ venue, compact = false, searchMode = false, onHover }: VenueCardProps) => {
  const { data: services } = useVenueServices(venue.id);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Get venue images
  const venueImages = venue.images && venue.images.length > 0 
    ? venue.images 
    : ["https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800"];
  
  // Reset image index when venue changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [venue.id]);
  
  const handlePrevious = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? venueImages.length - 1 : prev - 1
    );
  };
  
  const handleNext = () => {
    setCurrentImageIndex((prev) => 
      prev === venueImages.length - 1 ? 0 : prev + 1
    );
  };
  
  // Get all available discounts to show from services only
  const getAllDiscounts = () => {
    const discounts = [];
    
    if (!services || services.length === 0) {
      return discounts;
    }

    // Check each service for discounts and collect unique ones
    const allServiceDiscounts = {
      overall: new Set<number>(),
      group: [] as any[],
      timeslot: [] as any[],
      freeHour: [] as any[]
    };

    services.forEach(service => {
      // Overall discounts
      if (service.overall_discount_percent && service.overall_discount_percent > 0) {
        allServiceDiscounts.overall.add(service.overall_discount_percent);
      }

      // Group discounts
      if (service.group_discounts && Array.isArray(service.group_discounts) && service.group_discounts.length > 0) {
        allServiceDiscounts.group.push(...service.group_discounts);
      }

      // Timeslot discounts
      if (service.timeslot_discounts && Array.isArray(service.timeslot_discounts) && service.timeslot_discounts.length > 0) {
        allServiceDiscounts.timeslot.push(...service.timeslot_discounts);
      }

      // Free hour discounts
      if (service.free_hour_discounts && Array.isArray(service.free_hour_discounts) && service.free_hour_discounts.length > 0) {
        allServiceDiscounts.freeHour.push(...service.free_hour_discounts);
      }
    });

    // Convert to discount objects
    if (allServiceDiscounts.overall.size > 0) {
      const maxDiscount = Math.max(...Array.from(allServiceDiscounts.overall));
      discounts.push({
        icon: Percent,
        text: `${maxDiscount}%`,
        type: 'overall',
        color: 'from-green-500 to-emerald-600'
      });
    }

    if (allServiceDiscounts.group.length > 0) {
      const bestGroupDiscount = allServiceDiscounts.group.reduce((best: any, current: any) => {
        if (!best || current.minGuests < best.minGuests || 
            (current.minGuests === best.minGuests && current.discountPercent > best.discountPercent)) {
          return current;
        }
        return best;
      }, null);

      if (bestGroupDiscount && bestGroupDiscount.discountPercent > 0) {
        discounts.push({
          icon: Users,
          text: `${bestGroupDiscount.minGuests}+ people`,
          subText: `${bestGroupDiscount.discountPercent}%`,
          type: 'group',
          color: 'from-blue-500 to-blue-600'
        });
      }
    }

    if (allServiceDiscounts.timeslot.length > 0) {
      const bestTimeslot = allServiceDiscounts.timeslot.reduce((best: any, current: any) => {
        if (!best || current.discountPercent > best.discountPercent) {
          return current;
        }
        return best;
      }, null);

      if (bestTimeslot && bestTimeslot.discountPercent > 0) {
        const formatTime = (time: string) => {
          const [hour, minute] = time.split(':');
          const hourNum = parseInt(hour);
          const ampm = hourNum >= 12 ? 'PM' : 'AM';
          const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
          return `${displayHour}:${minute} ${ampm}`;
        };
        
        discounts.push({
          icon: Clock,
          text: `${formatTime(bestTimeslot.start)}-${formatTime(bestTimeslot.end)}`,
          subText: `${bestTimeslot.discountPercent}%`,
          type: 'timeslot',
          color: 'from-orange-500 to-orange-600'
        });
      }
    }

    if (allServiceDiscounts.freeHour.length > 0) {
      const bestFreeHour = allServiceDiscounts.freeHour.reduce((best: any, current: any) => {
        if (!best || current.freeHours > best.freeHours) {
          return current;
        }
        return best;
      }, null);

      if (bestFreeHour && bestFreeHour.freeHours > 0) {
        discounts.push({
          icon: Gift,
          text: `${bestFreeHour.thresholdHours}+${bestFreeHour.freeHours}`,
          type: 'bundle',
          color: 'from-purple-500 to-purple-600'
        });
      }
    }
    
    return discounts;
  };
  
  const allDiscounts = getAllDiscounts();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -8 }}
      className="group"
      onMouseEnter={() => onHover?.(venue)}
    >
      <Card className="venue-card-new overflow-hidden bg-white border-0 shadow-lg hover:shadow-2xl transition-all duration-500 ease-out">
        {/* Image Carousel Section */}
        <div className="relative">
          <div className={`relative overflow-hidden ${searchMode ? 'aspect-[4/3]' : 'aspect-[8/5]'}`}>
            <img
              src={venueImages[currentImageIndex]}
              alt={`${venue.name} - Image ${currentImageIndex + 1}`}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Image Counter */}
            {venueImages.length > 1 && (
              <div className={`absolute glass-overlay text-white rounded-full ${searchMode ? 'top-1 right-1 text-[8px] px-1 py-0.5' : 'top-2 right-2 text-[10px] px-1.5 py-0.5'}`}>
                {currentImageIndex + 1} / {venueImages.length}
              </div>
            )}
            
            {/* Carousel Indicators */}
            {venueImages.length > 1 && (
              <div className={`absolute left-1/2 transform -translate-x-1/2 flex ${searchMode ? 'bottom-1 gap-0.5' : 'bottom-2 gap-0.5'}`}>
                {venueImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`rounded-full transition-all duration-200 ${
                      searchMode 
                        ? `w-1 h-1 ${index === currentImageIndex ? 'bg-white w-2' : 'bg-white/60'}`
                        : `w-1.5 h-1.5 ${index === currentImageIndex ? 'bg-white w-3' : 'bg-white/60'}`
                    }`}
                  />
                ))}
              </div>
            )}
            
            {/* Carousel Navigation */}
            {venueImages.length > 1 && (
              <>
                <Button
                  onClick={handlePrevious}
                  className={`absolute top-1/2 -translate-y-1/2 glass-overlay action-button border-0 p-0 ${searchMode ? 'left-0.5 h-5 w-5' : 'left-1 h-6 w-6'}`}
                >
                  <ArrowLeft className={`${searchMode ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
                </Button>
                <Button
                  onClick={handleNext}
                  className={`absolute top-1/2 -translate-y-1/2 glass-overlay action-button border-0 p-0 ${searchMode ? 'right-0.5 h-5 w-5' : 'right-1 h-6 w-6'}`}
                >
                  <ArrowRight className={`${searchMode ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
                </Button>
              </>
            )}
            
            {/* Discount Badge */}
            {allDiscounts.length > 0 && (
              <div className={`absolute ${searchMode ? 'top-1 left-1' : 'top-2 left-2'}`}>
                <div className={`bg-gradient-to-r ${allDiscounts[0].color} text-white rounded-full shadow-lg flex items-center gap-1 font-bold badge-animate ${searchMode ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-0.5 text-[10px]'}`}>
                  {(() => {
                    const IconComponent = allDiscounts[0].icon;
                    return <IconComponent className={`${searchMode ? 'h-2 w-2' : 'h-2.5 w-2.5'} flex-shrink-0`} />;
                  })()}
                  <span>{allDiscounts[0].text}</span>
                </div>
              </div>
            )}
            
            {/* Rating Badge */}
            <div className={`absolute ${searchMode ? 'bottom-1 left-1' : 'bottom-2 left-2'}`}>
              <div className={`glass-overlay rounded-full shadow-lg flex items-center gap-1 ${searchMode ? 'px-1 py-0.5' : 'px-1.5 py-0.5'}`}>
                <Star className={`${searchMode ? 'h-2 w-2' : 'h-2.5 w-2.5'} fill-yellow-400 text-yellow-400`} />
                <span className={`${searchMode ? 'text-[8px]' : 'text-[10px]'} font-semibold text-white`}>{venue.rating}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content Section */}
        <CardContent className={`${searchMode ? 'p-2 space-y-1.5' : 'p-2 space-y-1'}`}>
          {/* Venue Name and Location */}
          <div className={`${searchMode ? 'space-y-0.5' : 'space-y-1'}`}>
            <h3 className={`font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 ${searchMode ? 'text-sm' : 'text-base'}`}>
              {venue.name}
            </h3>
            
            <div className="flex items-center text-gray-500">
              <MapPin className={`${searchMode ? 'h-2.5 w-2.5 mr-0.5' : 'h-3 w-3 mr-1'} flex-shrink-0`} />
              <span className={`${searchMode ? 'text-[10px]' : 'text-xs'} line-clamp-1`}>{venue.location}</span>
            </div>
          </div>
          
          {/* Services Tags */}
          <div className={`${searchMode ? 'min-h-[16px]' : 'min-h-[18px]'}`}>
            {services && services.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {services.slice(0, searchMode ? 1 : (compact ? 2 : 3)).map((service) => (
                  <Badge 
                    key={service.id} 
                    variant="secondary" 
                    className={`${searchMode ? 'text-[8px] px-1 py-0.5' : 'text-[10px] px-1.5 py-0.5'} bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors`}
                  >
                    {service.name}
                  </Badge>
                ))}
                {services.length > (searchMode ? 1 : (compact ? 2 : 3)) && (
                  <Badge variant="outline" className={`${searchMode ? 'text-[8px] px-1 py-0.5' : 'text-[10px] px-1.5 py-0.5'} border-gray-300 text-gray-600`}>
                    +{services.length - (searchMode ? 1 : (compact ? 2 : 3))}
                  </Badge>
                )}
              </div>
            ) : (
              <span className={`${searchMode ? 'text-[10px]' : 'text-xs'} text-gray-400`}>No services available</span>
            )}
          </div>
        
          {/* Price and CTA Section */}
          <div className={`flex items-center justify-between border-t border-gray-100 ${searchMode ? 'pt-0.5' : 'pt-1'}`}>
            {/* Price */}
            <div className="flex items-baseline gap-1">
              <span className={`font-bold price-display ${searchMode ? 'text-sm' : 'text-lg'}`}>
                {services && services.length > 0 
                  ? (() => {
                      const prices = services.map(service => {
                        const displayPrice = getServiceDisplayPrice(service);
                        const numericMatch = displayPrice.match(/(\d+) GEL/);
                        return numericMatch ? parseInt(numericMatch[1]) : service.price;
                      });
                      return `${Math.min(...prices)} GEL`;
                    })()
                  : 'Contact'}
              </span>
              <span className={`${searchMode ? 'text-[10px]' : 'text-xs'} text-gray-500`}>/hour</span>
            </div>
            
            {/* View Details Button */}
            <Link to={`/venue/${venue.id}`}>
              <Button 
                size="sm" 
                className={`bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full transition-all duration-200 group-hover:scale-105 shadow-lg hover:shadow-xl ${searchMode ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1 text-xs'}`}
              >
                <Eye className={`${searchMode ? 'h-2.5 w-2.5 mr-0.5' : 'h-3 w-3 mr-1'}`} />
                View Details
              </Button>
            </Link>
          </div>
        </CardContent>
        
        {/* Hover Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg" />
      </Card>
    </motion.div>
  );
};

export default VenueCard;
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Percent, Clock, Gift, Users, ArrowRight } from "lucide-react";
import { Venue, useVenueServices } from "@/hooks/useVenues";
import { getServiceDisplayPrice } from "@/utils/guestPricing";

interface VenueCardProps {
  venue: Venue;
  compact?: boolean;
  onHover?: (venue: Venue) => void;
}

const VenueCard = ({ venue, compact = false, onHover }: VenueCardProps) => {
  const { data: services } = useVenueServices(venue.id);
  
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
    <Link to={`/venue/${venue.id}`}>
      <Card 
        className={`venue-card group ${compact ? 'h-[280px]' : 'h-[320px]'}`}
        onMouseEnter={() => onHover?.(venue)}
      >
        {/* Image Container */}
        <div className={`relative overflow-hidden ${compact ? 'h-[140px]' : 'h-[160px]'}`}>
          <img
            src={venue.images?.[0] || "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800"}
            alt={venue.name}
            className="venue-card-image"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Top Badges Container */}
          <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
            {/* Rating Badge */}
            <div className="venue-card-badge flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-semibold text-gray-800">{venue.rating}</span>
            </div>
            
            {/* Discount Badge */}
            {allDiscounts.length > 0 && (
              <div className={`venue-card-discount bg-gradient-to-r ${allDiscounts[0].color}`}>
                {(() => {
                  const IconComponent = allDiscounts[0].icon;
                  return <IconComponent className="h-3 w-3 flex-shrink-0" />;
                })()}
                <span>{allDiscounts[0].text}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Content Container */}
        <CardContent className={`p-3 space-y-1.5 ${compact ? 'h-[140px]' : 'h-[160px]'} flex flex-col justify-between`}>
          {/* Top Section */}
          <div className="space-y-1">
            {/* Venue Name */}
            <h3 className={`font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 ${compact ? 'text-sm' : 'text-base'}`}>
              {venue.name}
            </h3>
            
            {/* Location */}
            <div className="flex items-center text-gray-500">
              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="text-xs line-clamp-1">{venue.location}</span>
            </div>
          </div>
          
          {/* Middle Section - Services */}
          <div className="min-h-[24px]">
            {services && services.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {services.slice(0, compact ? 2 : 3).map((service) => (
                  <Badge 
                    key={service.id} 
                    variant="secondary" 
                    className="text-[10px] px-1.5 py-0.5 h-4 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors whitespace-nowrap max-w-full"
                  >
                    {service.name}
                  </Badge>
                ))}
                {services.length > (compact ? 2 : 3) && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 h-4 border-gray-300 text-gray-600">
                    +{services.length - (compact ? 2 : 3)}
                  </Badge>
                )}
              </div>
            ) : (
              <span className="text-xs text-gray-400">No services available</span>
            )}
          </div>
        
          {/* Bottom Section - Price and CTA */}
          <div className="flex items-center justify-between pt-2">
            {/* Price */}
            <div className="flex items-baseline gap-1">
              <span className={`font-bold text-gray-900 ${compact ? 'text-lg' : 'text-xl'}`}>
                {services && services.length > 0 
                  ? (() => {
                      const prices = services.map(service => {
                        const displayPrice = getServiceDisplayPrice(service);
                        const numericMatch = displayPrice.match(/(\d+)₾/);
                        return numericMatch ? parseInt(numericMatch[1]) : service.price;
                      });
                      return `${Math.min(...prices)}₾`;
                    })()
                  : 'Contact'}
              </span>
              <span className="text-xs text-gray-500">/hour</span>
            </div>
            
            {/* CTA Arrow */}
            <div className="venue-card-cta">
              <ArrowRight className="venue-card-cta-icon" />
            </div>
          </div>
        </CardContent>
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </Card>
    </Link>
  );
};

export default VenueCard;
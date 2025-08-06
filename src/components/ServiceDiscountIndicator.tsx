import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, Users, Percent, Gift } from "lucide-react";
import { VenueService } from "@/hooks/useVenues";

interface ServiceDiscountIndicatorProps {
  service: VenueService;
  className?: string;
}

const ServiceDiscountIndicator = ({ service, className = "" }: ServiceDiscountIndicatorProps) => {
  const discounts = [];

  // Check for overall discount
  if (service.overall_discount_percent && service.overall_discount_percent > 0) {
    discounts.push({
      type: 'overall',
      icon: Percent,
      label: `${service.overall_discount_percent}% off`,
      description: `${service.overall_discount_percent}% discount on all bookings`
    });
  }

  // Check for group discounts
  if (service.group_discounts && Array.isArray(service.group_discounts) && service.group_discounts.length > 0) {
    const maxGroupDiscount = Math.max(...service.group_discounts.map((d: any) => d.discountPercent || 0));
    const minGuests = Math.min(...service.group_discounts.map((d: any) => d.minGuests || 0));
    
    if (maxGroupDiscount > 0) {
      discounts.push({
        type: 'group',
        icon: Users,
        label: `Up to ${maxGroupDiscount}% off`,
        description: `Group discounts starting from ${minGuests} guests`
      });
    }
  }

  // Check for timeslot discounts
  if (service.timeslot_discounts && Array.isArray(service.timeslot_discounts) && service.timeslot_discounts.length > 0) {
    const maxTimeslotDiscount = Math.max(...service.timeslot_discounts.map((d: any) => d.discountPercent || 0));
    
    if (maxTimeslotDiscount > 0) {
      discounts.push({
        type: 'timeslot',
        icon: Clock,
        label: `${maxTimeslotDiscount}% off`,
        description: 'Time-based discounts available'
      });
    }
  }

  // Check for free hour discounts
  if (service.free_hour_discounts && Array.isArray(service.free_hour_discounts) && service.free_hour_discounts.length > 0) {
    const maxFreeHours = Math.max(...service.free_hour_discounts.map((d: any) => d.freeHours || 0));
    
    if (maxFreeHours > 0) {
      discounts.push({
        type: 'freeHours',
        icon: Gift,
        label: `${maxFreeHours} free hour${maxFreeHours > 1 ? 's' : ''}`,
        description: 'Free hours with extended bookings'
      });
    }
  }

  if (discounts.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      <TooltipProvider>
        {discounts.map((discount, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <Badge 
                variant="secondary" 
                className="text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors cursor-help flex items-center gap-1"
              >
                <discount.icon className="h-3 w-3" />
                {discount.label}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{discount.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
};

export default ServiceDiscountIndicator;
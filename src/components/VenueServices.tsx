
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, DollarSign } from "lucide-react";
import { VenueService } from "@/hooks/useVenues";
import { getServiceDisplayPrice } from "@/utils/guestPricing";

interface VenueServicesProps {
  services: VenueService[];
  onServiceSelect: (service: VenueService) => void;
  selectedService?: VenueService;
}

const VenueServices = ({ 
  services, 
  onServiceSelect, 
  selectedService 
}: VenueServicesProps) => {
  if (!services || services.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Available Services</h3>
      <div className="grid gap-4">
        {services.map((service) => (
          <Card 
            key={service.id}
            className={`cursor-pointer transition-all border-white/10 bg-card/50 hover:bg-card/70 ${
              selectedService?.id === service.id 
                ? 'ring-2 ring-primary border-primary/50' 
                : ''
            }`}
            onClick={() => onServiceSelect(service)}
          >
            <div className="flex gap-4">
              {/* Service Image */}
              {service.images && service.images.length > 0 && (
                <div className="w-24 h-24 flex-shrink-0">
                  <img
                    src={service.images[0]}
                    alt={service.name}
                    className="w-full h-full object-cover rounded-l-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div className="flex-1">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                     <Badge variant="secondary" className="bg-primary/10 text-primary">
                       {getServiceDisplayPrice(service)}
                     </Badge>
                   </div>
                 </CardHeader>
                 <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">{service.service_type}</span>
                      </div>
                       <div className="flex items-center gap-1">
                         <DollarSign className="h-4 w-4" />
                         {getServiceDisplayPrice(service)}
                       </div>
                    </div>
                  <Button 
                    variant={selectedService?.id === service.id ? "default" : "outline"}
                    size="sm"
                    className="w-full"
                  >
                    {selectedService?.id === service.id ? "Selected" : "Select Service"}
                  </Button>
                </CardContent>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default VenueServices;

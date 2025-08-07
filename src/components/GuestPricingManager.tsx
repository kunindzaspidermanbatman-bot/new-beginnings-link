import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface GuestPricingRule {
  maxGuests: number;
  price: number;
}

interface GuestPricingManagerProps {
  rules: GuestPricingRule[];
  onRulesChange: (rules: GuestPricingRule[]) => void;
}

export const GuestPricingManager = ({ rules, onRulesChange }: GuestPricingManagerProps) => {
  const { toast } = useToast();
  const [nextGuestCount, setNextGuestCount] = useState(1);

  // Initialize with 1 guest if no rules exist
  if (rules.length === 0) {
    onRulesChange([{ maxGuests: 1, price: 0 }]);
  }

  // Calculate the next guest count to add
  const getNextGuestCount = () => {
    if (rules.length === 0) return 2;
    const maxGuests = Math.max(...rules.map(rule => rule.maxGuests));
    return maxGuests + 1;
  };

  const addPricingRule = () => {
    const nextCount = getNextGuestCount();
    const newRule = { maxGuests: nextCount, price: 0 };
    const updatedRules = [...rules, newRule].sort((a, b) => a.maxGuests - b.maxGuests);
    onRulesChange(updatedRules);
    setNextGuestCount(nextCount + 1);
  };

  const removeRule = (index: number) => {
    if (rules.length === 1) {
      toast({
        title: "Cannot remove",
        description: "At least one pricing rule is required",
        variant: "destructive",
      });
      return;
    }
    
    const updatedRules = rules.filter((_, i) => i !== index);
    onRulesChange(updatedRules);
  };

  const updateRule = (index: number, field: 'maxGuests' | 'price', value: number) => {
    const updatedRules = rules.map((rule, i) => 
      i === index ? { ...rule, [field]: value } : rule
    );
    onRulesChange(updatedRules.sort((a, b) => a.maxGuests - b.maxGuests));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label className="text-base font-medium">Guest Pricing</Label>
        <p className="text-sm text-muted-foreground">
          Set prices for different guest counts per table
        </p>
        
        {rules.map((rule, index) => (
          <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">
                Price for {rule.maxGuests} guest{rule.maxGuests > 1 ? 's' : ''} (GEL)
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={rule.price}
                onChange={(e) => updateRule(index, 'price', parseFloat(e.target.value) || 0)}
                className="mt-1"
                placeholder="Enter price"
              />
            </div>
            {rules.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeRule(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <Button 
        onClick={addPricingRule} 
        variant="outline" 
        size="sm"
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Pricing for {getNextGuestCount()} Guests
      </Button>
      
      <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
        <p className="font-medium mb-1">How it works:</p>
        <p>The system selects the lowest rule that accommodates the guest count. For example, if you have rules for 2 guests (10 GEL) and 4 guests (15 GEL), a booking for 3 guests will use the 4-guest price.</p>
      </div>
    </div>
  );
};
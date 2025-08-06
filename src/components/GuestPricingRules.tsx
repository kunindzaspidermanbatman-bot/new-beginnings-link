import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';

export interface GuestPricingRule {
  maxGuests: number;
  price: number;
}

interface GuestPricingRulesProps {
  rules: GuestPricingRule[];
  onRulesChange: (rules: GuestPricingRule[]) => void;
}

export const GuestPricingRules: React.FC<GuestPricingRulesProps> = ({
  rules,
  onRulesChange,
}) => {
  const addRule = () => {
    const newRule: GuestPricingRule = {
      maxGuests: Math.max(...rules.map(r => r.maxGuests), 0) + 1,
      price: 0,
    };
    onRulesChange([...rules, newRule]);
  };

  const removeRule = (index: number) => {
    const newRules = rules.filter((_, i) => i !== index);
    onRulesChange(newRules);
  };

  const updateRule = (index: number, field: keyof GuestPricingRule, value: number) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    onRulesChange(newRules);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Guest Count Pricing</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRule}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Rule
        </Button>
      </div>
      
      {rules.length === 0 ? (
        <Card>
          <CardContent className="p-4 text-center text-muted-foreground">
            No pricing rules added yet. Click "Add Rule" to create guest count-based pricing.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-3 text-sm font-medium text-muted-foreground">
            <div className="col-span-5">Max Guest Count</div>
            <div className="col-span-5">Total Price (GEL)</div>
            <div className="col-span-2"></div>
          </div>
          
          {rules.map((rule, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-5">
                    <Input
                      type="number"
                      min="1"
                      value={rule.maxGuests === 0 ? '' : rule.maxGuests}
                      onChange={(e) => updateRule(index, 'maxGuests', parseInt(e.target.value) || 0)}
                      placeholder="Max guests"
                    />
                  </div>
                  <div className="col-span-5">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={rule.price || ''}
                      onChange={(e) => updateRule(index, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="Total price"
                    />
                  </div>
                  <div className="col-span-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeRule(index)}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {rules.length > 0 && (
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
          <p className="font-medium mb-1">How it works:</p>
          <p>• System finds the lowest rule where guest count ≤ max guest count</p>
          <p>• Example: For 3 guests with rules [3→5 GEL, 7→10 GEL], price is 5 GEL</p>
          <p>• If no rule matches, guests cannot book that count</p>
        </div>
      )}
    </div>
  );
};
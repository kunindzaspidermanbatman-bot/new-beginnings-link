import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, CreditCard, Star, Plus } from "lucide-react";
import { useSavedPaymentMethods, SavedPaymentMethod } from "@/hooks/useSavedPaymentMethods";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SavedPaymentMethodsProps {
  onPaymentMethodSelect?: (paymentMethod: SavedPaymentMethod | null) => void;
  selectedPaymentMethodId?: string;
  showAddNew?: boolean;
}

const SavedPaymentMethods = ({ 
  onPaymentMethodSelect, 
  selectedPaymentMethodId,
  showAddNew = true 
}: SavedPaymentMethodsProps) => {
  const { 
    paymentMethods, 
    loading, 
    deletePaymentMethod, 
    setDefaultPaymentMethod,
    savePaymentMethod,
    createSetupIntent
  } = useSavedPaymentMethods();
  
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [cardElementReady, setCardElementReady] = useState(false);

  const getCardIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      default:
        return '💳';
    }
  };

  const formatCardBrand = (brand: string) => {
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  const handlePaymentMethodClick = (paymentMethod: SavedPaymentMethod) => {
    onPaymentMethodSelect?.(paymentMethod);
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    await setDefaultPaymentMethod(paymentMethodId);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deletePaymentMethod(deleteId);
      setDeleteId(null);
    }
  };

  const handleAddPaymentMethod = async () => {
    if (!stripe || !elements || !cardElementReady) {
      toast({
        title: "Error",
        description: "Payment form is not ready. Please wait and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Create setup intent
      const setupData = await createSetupIntent();
      if (!setupData) {
        throw new Error('Failed to create setup intent');
      }

      const card = elements.getElement(CardElement);
      if (!card) {
        throw new Error('Card element not found');
      }

      // Confirm setup intent
      const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(
        setupData.clientSecret,
        {
          payment_method: {
            card: card,
            billing_details: {
              // Add billing details if needed
            },
          },
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (setupIntent.status === 'succeeded') {
        // Save payment method to our database
        await savePaymentMethod(setupIntent.payment_method as string, paymentMethods.length === 0);
        
        // Reset form state
        setShowAddForm(false);
        setCardElementReady(false);
        
        toast({
          title: "Success",
          description: "Payment method added successfully.",
        });
      }
    } catch (error: any) {
      console.error('Error adding payment method:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add payment method.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCardReady = () => {
    setCardElementReady(true);
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setCardElementReady(false);
  };

  // Auto-select default (or first) payment method when none is selected yet
  useEffect(() => {
    if (!onPaymentMethodSelect) return;
    if (selectedPaymentMethodId) return;
    if (paymentMethods.length === 0) return;
    const defaultMethod = paymentMethods.find((m) => m.is_default) || paymentMethods[0];
    onPaymentMethodSelect(defaultMethod);
  }, [paymentMethods, selectedPaymentMethodId, onPaymentMethodSelect]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-16 bg-muted/20 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {paymentMethods.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Saved Payment Methods</h4>
          {paymentMethods.map((method) => (
            <Card
              key={method.id}
              className={`cursor-pointer transition-all duration-200 ${
                selectedPaymentMethodId === method.stripe_payment_method_id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => handlePaymentMethodClick(method)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {getCardIcon(method.card_brand)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {formatCardBrand(method.card_brand)} •••• {method.card_last4}
                        </span>
                        {method.is_default && (
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Expires {method.card_exp_month.toString().padStart(2, '0')}/{method.card_exp_year}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!method.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetDefault(method.id);
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(method.id);
                      }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showAddNew && (
        <>
          {!showAddForm ? (
            <Button
              variant="outline"
              onClick={() => setShowAddForm(true)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Payment Method
            </Button>
          ) : (
            <Card className="border-primary/50">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <span className="font-medium">Add New Card</span>
                </div>
                 
                <div className="p-4 border border-border/50 rounded-xl bg-background/50">
                  <CardElement
                    onReady={handleCardReady}
                    options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: 'hsl(var(--foreground))',
                          '::placeholder': {
                            color: 'hsl(var(--muted-foreground))',
                          },
                        },
                      },
                    }}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddPaymentMethod}
                    disabled={!stripe || isProcessing || !cardElementReady}
                    className="flex-1"
                  >
                    {isProcessing ? "Adding..." : "Add Card"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelAdd}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment Method</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment method? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SavedPaymentMethods;
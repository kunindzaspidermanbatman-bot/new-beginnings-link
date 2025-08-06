import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import SavedPaymentMethods from "@/components/SavedPaymentMethods";
import { useAuth } from "@/hooks/useAuth";

const stripePromise = loadStripe("pk_test_51Rab7tAcy0JncB9qlWWNkyQxCYjs4RqFlY5OYSkBLfSVBqxv5q7d38jkbXVDmyE7jLxoCKxheJ95hc0f9atUVjBp00OmeyVbjo");

const PaymentMethods = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">Please sign in to manage your payment methods.</p>
          <Button onClick={() => navigate('/')}>Return to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold gradient-text">Payment Methods</h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle>Manage Your Payment Methods</CardTitle>
            <p className="text-sm text-muted-foreground">
              Add, remove, and manage your saved payment methods for faster checkout.
            </p>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise}>
              <SavedPaymentMethods showAddNew={true} />
            </Elements>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentMethods;
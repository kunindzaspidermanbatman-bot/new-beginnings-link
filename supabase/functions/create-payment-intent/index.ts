import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Create payment intent function started');

    // Get Stripe secret key
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error(`Authentication error: ${userError?.message || 'User not found'}`);
    }

    const user = userData.user;
    console.log('User authenticated:', user.id, user.email);

    // Parse request body
    const { amount, currency = 'usd', bookingData, paymentMethodId } = await req.json();
    
    if (!amount || amount <= 0) {
      throw new Error("Invalid amount provided");
    }

    console.log('Payment details:', { amount, currency, bookingData, paymentMethodId });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Find or create Stripe customer
    let customerId: string;
    
    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
      console.log('Existing customer found:', customerId);
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email || '',
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;
      console.log('New customer created:', customerId);
    }

    // Convert amount to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(amount * 100);

    // Create payment intent with customer
    const paymentIntentParams: any = {
      amount: amountInCents,
      currency: currency,
      customer: customerId, // This is crucial for saved payment methods
      metadata: {
        userId: user.id,
        userEmail: user.email || '',
        venueId: bookingData?.venueId || '',
        bookingDate: bookingData?.date || '',
        bookingTime: bookingData?.time || '',
        guests: bookingData?.guests?.toString() || '',
      },
    };

    // If a payment method is provided, ensure it's properly attached to the customer
    if (paymentMethodId) {
      console.log('Creating payment intent with saved payment method:', paymentMethodId);
      
      try {
        // Retrieve the payment method to check its status
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
        
        // If the payment method is not attached to our customer, attach it
        if (paymentMethod.customer !== customerId) {
          console.log('Payment method not attached to customer, attaching now...');
          await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customerId,
          });
          console.log('Payment method attached to customer:', customerId);
        } else {
          console.log('Payment method already attached to customer');
        }
        
        paymentIntentParams.payment_method = paymentMethodId;
      } catch (error) {
        console.error('Error handling payment method:', error);
        // If there's an error with the saved payment method, continue without it
        // This allows the user to enter a new payment method
        console.log('Continuing without saved payment method due to error');
      }
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    console.log('Payment intent created:', paymentIntent.id);

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in create-payment-intent:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
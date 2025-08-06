import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";
import { Resend } from "npm:resend@2.0.0";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingNotificationRequest {
  bookingId: string;
  userId: string;
  venueId: string;
  userEmail: string;
  venueName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId, userId, venueId, userEmail, venueName }: BookingNotificationRequest = await req.json();

    console.log(`Processing review notification for booking ${bookingId}`);

    // Create in-app notification
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        booking_id: bookingId,
        type: 'review_request',
        title: 'Rate Your Experience',
        message: `How was your experience at ${venueName}? Share your review to help other customers.`,
        scheduled_for: new Date().toISOString()
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
    } else {
      console.log('In-app notification created successfully');
    }

    // Send email notification
    const emailResponse = await resend.emails.send({
      from: "Venue Bookings <onboarding@resend.dev>",
      to: [userEmail],
      subject: `Rate your experience at ${venueName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">How was your experience?</h1>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">Thank you for visiting ${venueName}!</h2>
            <p style="color: #666; line-height: 1.6;">
              We hope you had a great time at ${venueName}. Your feedback is valuable to us and helps other customers make informed decisions.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovableproject.com') || 'https://your-app-url.com'}/venue/${venueId}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Write a Review
            </a>
          </div>

          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              This email was sent because you recently completed a booking. If you didn't make this booking, you can safely ignore this email.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Email notification sent:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationCreated: !notificationError,
        emailSent: emailResponse.data?.id ? true : false 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in review-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
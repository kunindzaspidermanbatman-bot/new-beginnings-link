import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Checking for completed bookings...");

    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format

    // Find bookings that should be completed (past booking date and departure time)
    const { data: completedBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        *,
        venues!inner(name),
        profiles!inner(email, full_name),
        booking_services(
          departure_time,
          arrival_time
        )
      `)
      .eq('status', 'confirmed')
      .or(`booking_date.lt.${currentDate},and(booking_date.eq.${currentDate},booking_time.lt.${currentTime})`);

    if (bookingsError) {
      throw new Error(`Error fetching bookings: ${bookingsError.message}`);
    }

    console.log(`Found ${completedBookings?.length || 0} potentially completed bookings`);

    const processedBookings = [];

    for (const booking of completedBookings || []) {
      try {
        // Check if booking is actually completed based on service departure times
        let isActuallyCompleted = false;
        
        if (booking.booking_services && booking.booking_services.length > 0) {
          // Check if all service departure times have passed
          const latestDepartureTime = booking.booking_services.reduce((latest, service) => {
            const serviceDepartureTime = new Date(`${booking.booking_date}T${service.departure_time}`);
            return serviceDepartureTime > latest ? serviceDepartureTime : latest;
          }, new Date(0));
          
          isActuallyCompleted = latestDepartureTime < now;
        } else {
          // Fallback to main booking time with 1 hour duration
          const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
          const bookingEndTime = new Date(bookingDateTime.getTime() + 60 * 60 * 1000); // 1 hour
          isActuallyCompleted = bookingEndTime < now;
        }
        
        if (!isActuallyCompleted) {
          console.log(`Booking ${booking.id} is not actually completed yet`);
          continue;
        }

        // Check if we already sent a review notification for this booking
        const { data: existingNotification } = await supabase
          .from('notifications')
          .select('id')
          .eq('booking_id', booking.id)
          .eq('type', 'review_request')
          .single();

        if (existingNotification) {
          console.log(`Review notification already sent for booking ${booking.id}`);
          continue;
        }

        // Update booking status to completed
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ status: 'completed' })
          .eq('id', booking.id);

        if (updateError) {
          console.error(`Error updating booking ${booking.id}:`, updateError);
          continue;
        }

        // Call the review notification function
        const notificationResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/review-notification`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            },
            body: JSON.stringify({
              bookingId: booking.id,
              userId: booking.user_id,
              venueId: booking.venue_id,
              userEmail: booking.profiles.email,
              venueName: booking.venues.name,
            }),
          }
        );

        if (notificationResponse.ok) {
          processedBookings.push(booking.id);
          console.log(`Review notification sent for booking ${booking.id}`);
        } else {
          console.error(`Failed to send notification for booking ${booking.id}`);
        }

      } catch (error) {
        console.error(`Error processing booking ${booking.id}:`, error);
      }
    }

    console.log(`Processed ${processedBookings.length} completed bookings`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processedBookings: processedBookings.length,
        totalChecked: completedBookings?.length || 0
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
    console.error("Error in check-completed-bookings function:", error);
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
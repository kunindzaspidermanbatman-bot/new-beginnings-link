import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  console.log('Booking confirmation function called, method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing booking confirmation request...');
    
    // Create Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasResendKey: !!resendApiKey
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    // Parse request body
    const requestBody = await req.text();
    console.log('Request body received:', requestBody);
    
    const { bookingId, action } = JSON.parse(requestBody);
    console.log('Parsed data:', { bookingId, action });

    if (!bookingId || !action) {
      throw new Error('Missing bookingId or action');
    }

    // Get booking details
    console.log('Fetching booking details...');
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        venues(name, partner_id)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError) {
      console.error('Error fetching booking:', bookingError);
      throw new Error(`Failed to fetch booking: ${bookingError.message}`);
    }

    if (!booking) {
      throw new Error('Booking not found');
    }

    console.log('Booking found:', booking);

    // Update booking status
    console.log('Updating booking status to:', action);
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        status: action,
        status_updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking status:', updateError);
      throw new Error(`Failed to update booking: ${updateError.message}`);
    }

    console.log('Booking status updated successfully');

    // Create in-app notification for the user
    console.log('Creating notification for user:', booking.user_id);
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: booking.user_id,
        booking_id: bookingId,
        type: 'booking_confirmation',
        title: action === 'confirmed' ? 'Booking Confirmed!' : 'Booking Rejected',
        message: action === 'confirmed' 
          ? `Your booking for ${booking.venues.name} has been confirmed.`
          : `Your booking for ${booking.venues.name} has been rejected.`,
        read: false
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't throw - this is not critical
    } else {
      console.log('Notification created successfully');
    }

    // Send email notification if Resend is available
    if (resend && booking.user_email) {
      console.log('Sending email notification to:', booking.user_email);
      
      const emailSubject = action === 'confirmed' 
        ? `Booking Confirmed - ${booking.venues.name}`
        : `Booking Update - ${booking.venues.name}`;

      const emailHtml = action === 'confirmed' 
        ? `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #22c55e;">Booking Confirmed!</h1>
            <p>Great news! Your booking has been confirmed.</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Booking Details:</h3>
              <p><strong>Venue:</strong> ${booking.venues.name}</p>
              <p><strong>Date:</strong> ${new Date(booking.booking_date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${booking.booking_time}</p>
              <p><strong>Guests:</strong> ${booking.guest_count}</p>
              <p><strong>Total:</strong> $${Number(booking.total_price).toFixed(2)}</p>
            </div>
            
            <p>We look forward to seeing you!</p>
            <p style="color: #6b7280; font-size: 14px;">Best regards,<br>Venue Booking Team</p>
          </div>
        `
        : `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ef4444;">Booking Update</h1>
            <p>We regret to inform you that your booking has been rejected.</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Booking Details:</h3>
              <p><strong>Venue:</strong> ${booking.venues.name}</p>
              <p><strong>Date:</strong> ${new Date(booking.booking_date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${booking.booking_time}</p>
            </div>
            
            <p>You can browse other available venues and try booking again.</p>
            <p style="color: #6b7280; font-size: 14px;">Best regards,<br>Venue Booking Team</p>
          </div>
        `;

      try {
        const emailResponse = await resend.emails.send({
          from: "Venue Booking <dajavshne@gmail.com>",
          to: ["dajavshne@gmail.com"], // Using verified email for testing
          subject: emailSubject,
          html: emailHtml,
        });

        console.log("Email sent successfully:", emailResponse);
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        // Don't throw error - email failure shouldn't break the booking confirmation
      }
    }

    console.log(`Booking ${action} processed successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Booking ${action} successfully`,
        bookingId 
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
    console.error("Error in booking-confirmation function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred processing the booking confirmation',
        stack: error.stack
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
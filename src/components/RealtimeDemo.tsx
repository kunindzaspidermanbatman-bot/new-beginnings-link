import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Demo component to test real-time notifications
export const RealtimeDemo = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const simulateVenueApproval = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to test notifications",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create a dummy booking first
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          venue_id: 'c1e1f1e1-1e1e-1e1e-1e1e-1e1e1e1e1e1e', // dummy venue id
          booking_date: new Date().toISOString().split('T')[0],
          booking_time: '14:00',
          guest_count: 2,
          total_price: 50.00,
          user_email: user.email
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Create a notification for venue approval
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          booking_id: booking.id,
          type: 'booking_confirmed',
          title: 'Venue Booking Confirmed!',
          message: 'Your venue booking has been approved by the partner.',
          read: false
        });

      if (notificationError) throw notificationError;

      toast({
        title: "Demo Notification Sent",
        description: "Check your notification bell to see the real-time update!",
      });
    } catch (error) {
      console.error('Error creating demo notification:', error);
      toast({
        title: "Error",
        description: "Failed to create demo notification",
        variant: "destructive"
      });
    }
  };

  const simulateVenueRejection = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to test notifications",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create a dummy booking first
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          venue_id: 'c1e1f1e1-1e1e-1e1e-1e1e-1e1e1e1e1e1e', // dummy venue id
          booking_date: new Date().toISOString().split('T')[0],
          booking_time: '16:00',
          guest_count: 3,
          total_price: 75.00,
          user_email: user.email
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Create a notification for venue rejection
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          booking_id: booking.id,
          type: 'booking_rejected',
          title: 'Venue Booking Rejected',
          message: 'Unfortunately, your venue booking was not approved.',
          read: false
        });

      if (notificationError) throw notificationError;

      toast({
        title: "Demo Notification Sent",
        description: "Check your notification bell to see the real-time update!",
      });
    } catch (error) {
      console.error('Error creating demo notification:', error);
      toast({
        title: "Error",
        description: "Failed to create demo notification",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Real-time Notifications Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please log in to test real-time notifications.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Real-time Notifications Demo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Test the real-time notification system. Click a button to simulate a venue approval/rejection notification. 
          Watch the notification bell for real-time updates with sound alerts!
        </p>
        <div className="flex gap-2">
          <Button onClick={simulateVenueApproval} className="bg-green-600 hover:bg-green-700">
            Simulate Approval
          </Button>
          <Button onClick={simulateVenueRejection} variant="destructive">
            Simulate Rejection
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
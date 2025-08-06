
import { Bell, CheckCheck, X, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead, useDeleteNotification, useDeleteAllNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface NotificationBellProps {
}

const NotificationBell = ({}: NotificationBellProps) => {
  const { data: notifications = [], isLoading } = useNotifications();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();
  const deleteAllNotifications = useDeleteAllNotifications();
  const navigate = useNavigate();
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "All notifications marked as read",
          description: "Your notifications have been cleared.",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to mark notifications as read",
          variant: "destructive"
        });
      }
    });
  };

  const handleDeleteAllNotifications = () => {
    deleteAllNotifications.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "All notifications deleted",
          description: "All your notifications have been removed.",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to delete all notifications",
          variant: "destructive"
        });
      }
    });
  };

  const handleNotificationClick = async (notification: any) => {
    // Mark as read first
    markAsRead.mutate(notification.id);
    
    // Handle different notification types
    if (notification.type === '1_hour_before' || notification.type.includes('booking_')) {
      try {
        // Fetch the booking to get venue_id
        const { data: booking, error } = await supabase
          .from('bookings')
          .select('venue_id')
          .eq('id', notification.booking_id)
          .single();

        if (error) {
          console.error('Error fetching booking:', error);
          toast({
            title: "Error",
            description: "Could not load venue information",
            variant: "destructive"
          });
          return;
        }

        if (booking?.venue_id) {
          // Navigate to the venue page
          navigate(`/venue/${booking.venue_id}`);
        }
      } catch (error) {
        console.error('Error navigating to venue:', error);
        toast({
          title: "Error", 
          description: "Could not navigate to venue",
          variant: "destructive"
        });
      }
    }
  };

  const handleDeleteNotification = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    deleteNotification.mutate(notificationId, {
      onSuccess: () => {
        toast({
          title: "Notification deleted",
          description: "The notification has been removed.",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to delete notification",
          variant: "destructive"
        });
      }
    });
  };

  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Bell className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="h-8 px-2 text-xs"
                disabled={markAllAsRead.isPending}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteAllNotifications}
                className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                disabled={deleteAllNotifications.isPending}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete all
              </Button>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-64">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-3 cursor-pointer relative group ${
                  !notification.read ? 'bg-muted/50' : ''
                } ${
                  notification.type === 'booking_confirmed' ? 'border-l-4 border-green-500' :
                  notification.type === 'booking_rejected' ? 'border-l-4 border-red-500' :
                  notification.type === '1_hour_before' ? 'border-l-4 border-blue-500' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex flex-col space-y-1 w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <p className={`font-medium text-sm ${
                         notification.type === 'booking_confirmed' ? 'text-green-700' :
                         notification.type === 'booking_rejected' ? 'text-red-700' :
                         notification.type === '1_hour_before' ? 'text-blue-700' : ''
                       }`}>
                         {notification.title}
                       </p>
                       {notification.type === 'booking_confirmed' && (
                         <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                       )}
                       {notification.type === 'booking_rejected' && (
                         <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                       )}
                       {notification.type === '1_hour_before' && (
                         <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse" />
                       )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.read && notification.type !== 'booking_confirmed' && notification.type !== 'booking_rejected' && (
                        <div className="h-2 w-2 bg-primary rounded-full" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDeleteNotification(e, notification.id)}
                        disabled={deleteNotification.isPending}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                   <p className={`text-xs ${
                     notification.type === 'booking_confirmed' ? 'text-green-600 font-medium' :
                     notification.type === 'booking_rejected' ? 'text-red-600 font-medium' :
                     notification.type === '1_hour_before' ? 'text-blue-600 font-medium' :
                     'text-muted-foreground'
                   }`}>
                     {notification.message}
                   </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                  {(notification.type.includes('before') || notification.type.includes('booking_')) && (
                    <p className="text-xs text-primary font-medium">
                      Click to view venue →
                    </p>
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;

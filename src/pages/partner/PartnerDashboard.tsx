import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { usePartnerAuth } from '@/hooks/usePartnerAuth';
import { usePartnerVenues } from '@/hooks/usePartnerVenues';
import { Plus, Building2, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import BookingNotifications from '@/components/BookingNotifications';
import PartnerLayout from '@/components/PartnerLayout';
import { SkeletonCard, SkeletonList } from '@/components/ui/loading';

const PartnerDashboard = () => {
  const { profile } = usePartnerAuth();
  const { data: venues, isLoading } = usePartnerVenues();
  const navigate = useNavigate();

  console.log('🏢 PartnerDashboard - Profile loaded:', {
    profileId: profile?.id,
    profileEmail: profile?.email,
    profileRole: profile?.role,
    isPartner: profile?.role === 'partner'
  });

  if (isLoading) {
    return (
      <PartnerLayout>
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonList count={3} />
        </div>
      </PartnerLayout>
    );
  }

  return (
    <PartnerLayout>
      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {profile?.full_name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your venues and track bookings from your dashboard
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Venues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{venues?.length || 0}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Active venues</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Venues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{venues?.length || 0}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Currently listed</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">0</div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Booking Notifications */}
        <BookingNotifications />

        {/* Venues Section */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl text-gray-900 dark:text-white">Your Venues</CardTitle>
            <Button 
              onClick={() => navigate('/partner/venues/add')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Venue
            </Button>
          </CardHeader>
          <CardContent>
            {venues && venues.length > 0 ? (
              <div className="grid gap-4">
                {venues.map((venue) => (
                  <div
                    key={venue.id}
                    className="flex items-center justify-between p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center space-x-6">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{venue.name}</h3>
                        <p className="text-gray-600 dark:text-gray-400">{venue.location}</p>
                        {/* Removed services availability line as requested */}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/partner/venues/${venue.id}/edit`)}
                        className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Manage
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">No venues yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  Start by adding your first venue to begin accepting bookings from customers.
                </p>
                <Button 
                  onClick={() => navigate('/partner/venues/add')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Venue
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PartnerLayout>
  );
};

export default PartnerDashboard;
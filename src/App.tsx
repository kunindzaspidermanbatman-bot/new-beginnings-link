
import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { useRealtimeBookings } from "@/hooks/useRealtimeBookings";
import EmailConfirmationGuard from "@/components/EmailConfirmationGuard";
import Header from "@/components/Header";
import { PostVisitReviewDialog } from "@/components/PostVisitReviewDialog";
import AppLoadingFallback from "@/components/AppLoadingFallback";

const Index = lazy(() => import("./pages/Index"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const VenuePage = lazy(() => import("./pages/VenuePage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const ConfirmAndPay = lazy(() => import("./pages/ConfirmAndPay"));
const PaymentMethods = lazy(() => import("./pages/PaymentMethods"));

const BookingHistoryPage = lazy(() => import("./pages/BookingHistoryPage"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Partner pages
const PartnerAuth = lazy(() => import("./pages/partner/PartnerAuth"));
const PartnerDashboard = lazy(() => import("./pages/partner/PartnerDashboard"));
const AddVenue = lazy(() => import("./pages/partner/AddVenue"));
const EditVenue = lazy(() => import("./pages/partner/EditVenue"));
const Analytics = lazy(() => import("./pages/partner/Analytics"));
const PartnerProtectedRoute = lazy(() => import("./components/PartnerProtectedRoute"));

// Admin pages
const AdminLayout = lazy(() => import("./components/AdminLayout"));
const AdminProtectedRoute = lazy(() => import("./components/AdminProtectedRoute"));
const VenueApprovals = lazy(() => import("./pages/admin/VenueApprovals"));
const VenueManagement = lazy(() => import("./pages/admin/VenueManagement"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const AdminBookings = lazy(() => import("./pages/admin/Bookings"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));

const queryClient = new QueryClient();

// Main app wrapper to include real-time functionality
const AppWrapper = () => {
  useRealtimeBookings(); // Enable real-time booking updates for consumers
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PostVisitReviewDialog />
      <Suspense fallback={<AppLoadingFallback />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/venue/:id" element={<VenuePage />} />
          <Route path="/category/:category" element={<CategoryPage />} />
          <Route path="/confirm-and-pay" element={<ConfirmAndPay />} />
          <Route path="/payment-methods" element={<PaymentMethods />} />
          
          <Route path="/booking-history" element={<BookingHistoryPage />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Partner routes */}
          <Route path="/partner/auth" element={<PartnerAuth />} />
          <Route path="/partner/dashboard" element={
            <PartnerProtectedRoute>
              <PartnerDashboard />
            </PartnerProtectedRoute>
          } />
          <Route path="/partner/venues/add" element={
            <PartnerProtectedRoute>
              <AddVenue />
            </PartnerProtectedRoute>
          } />
          <Route path="/partner/venues/:venueId/edit" element={
            <PartnerProtectedRoute>
              <EditVenue />
            </PartnerProtectedRoute>
          } />
          <Route path="/partner/analytics" element={
            <PartnerProtectedRoute>
              <Analytics />
            </PartnerProtectedRoute>
          } />
          
          {/* Admin routes */}
          <Route path="/admin" element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }>
            <Route index element={<VenueApprovals />} />
            <Route path="venues" element={<VenueManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <EmailConfirmationGuard>
            <AppWrapper />
          </EmailConfirmationGuard>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

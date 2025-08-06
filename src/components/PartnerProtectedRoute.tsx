import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePartnerAuth } from '@/hooks/usePartnerAuth';

interface PartnerProtectedRouteProps {
  children: React.ReactNode;
}

const PartnerProtectedRoute: React.FC<PartnerProtectedRouteProps> = ({ children }) => {
  const { user, profile, loading } = usePartnerAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !user.email_confirmed_at) {
    return <Navigate to="/partner/auth" replace />;
  }

  if (profile && profile.role !== 'partner') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You need a partner account to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PartnerProtectedRoute;
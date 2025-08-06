import React from 'react';
import { Outlet } from 'react-router-dom';
import { Building2, BarChart3, Plus, Bell, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePartnerAuth } from '@/hooks/usePartnerAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const PartnerLayout = ({ children }: { children: React.ReactNode }) => {
  const { profile, signOut } = usePartnerAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/partner/auth');
  };

  const navigationItems = [
    {
      title: 'Dashboard',
      href: '/partner/dashboard',
      icon: Building2,
    },
    {
      title: 'Analytics',
      href: '/partner/analytics', 
      icon: BarChart3,
    },
    {
      title: 'Add Venue',
      href: '/partner/venues/add',
      icon: Plus,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Partner Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">Partner Portal</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Venue Management System</p>
                </div>
              </div>
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{profile?.full_name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{profile?.email}</p>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Partner
              </Badge>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6">
          <div className="flex space-x-8">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href || 
                             (item.href !== '/partner/dashboard' && location.pathname.startsWith(item.href));
              
              return (
                <button
                  key={item.href}
                  onClick={() => navigate(item.href)}
                  className={cn(
                    "flex items-center space-x-2 py-4 border-b-2 transition-colors",
                    isActive 
                      ? "border-blue-600 text-blue-600 dark:text-blue-400" 
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default PartnerLayout;
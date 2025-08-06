import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, History, Building2, MapPin, CreditCard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useVenueSearch } from "@/hooks/useVenueSearch";
import NotificationBell from "./NotificationBell";
import ProfileDialog from "./ProfileDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [paymentsDialogOpen, setPaymentsDialogOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { searchQuery, searchResults, isSearching, handleSearch, clearSearch } = useVenueSearch();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        clearSearch();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [clearSearch]);

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Sign out error:', error);
      }
      navigate("/");
    } catch (error) {
      console.error('Sign out failed:', error);
      // Still navigate to clear the UI state
      navigate("/");
    }
  };

  const handleVenueSelect = (venueId: string) => {
    clearSearch();
    navigate(`/venue/${venueId}`);
  };

  const handleLogoClick = () => {
    // Clear search first
    clearSearch();
    // Force reload of home page to clear all filters
    window.location.href = '/';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <button 
            onClick={handleLogoClick}
            className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity"
          >
            Dajavshne
          </button>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8 relative">
            <div className="relative w-full bg-gray-50 rounded-full border border-gray-200 flex items-center p-1 shadow-sm h-10">
              <button 
                onClick={() => navigate('/search')}
                className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <div className="w-px h-5 bg-gray-300 mx-2"></div>
              <div className="flex-1 px-2">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Enter business name or location"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full text-gray-600 bg-transparent border-none outline-none placeholder-gray-400 text-sm"
                />
              </div>
              <button className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>

            {/* Search Results Dropdown */}
            {isSearching && (
              <div 
                ref={searchDropdownRef}
                className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto"
              >
                {searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((venue) => (
                      <button
                        key={venue.id}
                        onClick={() => handleVenueSelect(venue.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{venue.name}</div>
                          <div className="text-sm text-gray-500">{venue.location}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-blue-600">Services Available</div>
                          <div className="text-xs text-gray-400">⭐ {venue.rating}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 px-4 text-center text-gray-500">
                    <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <div>No venues found</div>
                    <div className="text-sm">Try adjusting your search terms</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Auth & User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/partner/auth">
              <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                <Building2 className="h-4 w-4 mr-2" />
                Partner Portal
              </Button>
            </Link>
            {user ? (
              <>
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <ProfileDialog 
                        defaultTab="profile"
                        open={profileDialogOpen}
                        onOpenChange={setProfileDialogOpen}
                        showPaymentsTab={false}
                      >
                        <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm">
                          <User className="h-4 w-4" />
                          Edit Profile
                        </button>
                      </ProfileDialog>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/booking-history" className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Booking History
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <ProfileDialog
                        defaultTab="payments"
                        open={paymentsDialogOpen}
                        onOpenChange={setPaymentsDialogOpen}
                        showPaymentsTab={false}
                      >
                        <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm">
                          <CreditCard className="h-4 w-4" />
                          Payment Methods
                        </button>
                      </ProfileDialog>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link to="/auth">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">Sign In</Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col space-y-4">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  window.location.href = '/';
                }}
                className="text-gray-700 hover:text-blue-600 transition-colors text-left"
              >
                Home
              </button>
              <Link
                to="/search"
                className="text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Browse Venues
              </Link>
              <Link
                to="/categories"
                className="text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Categories
              </Link>
              <Link
                to="/partner/auth"
                className="text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Partner Portal
              </Link>
              <div className="pt-4 border-t border-gray-200">
                {user ? (
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Signed in as {user.email}
                      </span>
                      <NotificationBell />
                    </div>
                    <ProfileDialog 
                      defaultTab="profile"
                      open={profileDialogOpen}
                      onOpenChange={setProfileDialogOpen}
                    >
                      <Button variant="ghost" className="justify-start">
                        <User className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    </ProfileDialog>
                    <ProfileDialog 
                      defaultTab="payments"
                      open={paymentsDialogOpen}
                      onOpenChange={setPaymentsDialogOpen}
                      showPaymentsTab={false}
                    >
                      <Button variant="ghost" className="justify-start w-full">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Payment Methods
                      </Button>
                    </ProfileDialog>
                    <Button
                      variant="ghost"
                      onClick={handleSignOut}
                      className="justify-start"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Link to="/auth" className="w-full">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Sign In</Button>
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

import { motion } from "framer-motion";
import EnhancedSearchFilters from "@/components/EnhancedSearchFilters";
import VenueCard from "@/components/VenueCard";
import CategoryCard from "@/components/CategoryCard";
import { SkeletonCard } from '@/components/ui/loading';
import Header from "@/components/Header";
import HomePageFilters from "@/components/HomePageFilters";
import { useVenues, useVenueServices } from "@/hooks/useVenues";
import { categories } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Zap, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PrivacyPolicyDialog from "@/components/PrivacyPolicyDialog";

const Index = () => {
  const { data: venues, isLoading } = useVenues();
  const [filteredVenues, setFilteredVenues] = useState(venues);
  const [currentFilters, setCurrentFilters] = useState({
    category: [],
    location: [],
    games: []
  });
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);

  // Fetch all venue services for filtering
  const { data: allVenueServices } = useQuery({
    queryKey: ['all-venue-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venue_services')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  });

  // Update filtered venues when venues data changes
  useEffect(() => {
    setFilteredVenues(venues);
  }, [venues]);

  const handleFiltersChange = (filters: any) => {
    if (!venues || !allVenueServices) {
      setFilteredVenues(venues);
      return;
    }

    // Store current filters
    setCurrentFilters(filters);

    let filtered = venues;

    console.log('Applying filters:', filters);
    console.log('Total venues:', venues.length);
    console.log('Total services:', allVenueServices.length);

    // Apply category filter (OR logic within categories)
    if (filters.category && filters.category.length > 0) {
      const venueIdsWithCategory = allVenueServices
        .filter(service => {
          const serviceType = (service as any).service_type || '';
          const serviceName = service.name || '';
          
          // Check if any selected category matches this service
          return filters.category.some((category: string) => 
            serviceType.toLowerCase().includes(category.toLowerCase()) ||
            serviceName.toLowerCase().includes(category.toLowerCase()) ||
            category.toLowerCase() === 'billiards' && serviceType.toLowerCase().includes('billiard')
          );
        })
        .map(service => service.venue_id);
      
      filtered = filtered.filter(venue => venueIdsWithCategory.includes(venue.id));
      console.log('After category filter:', filtered.length, 'venues', 'Categories:', filters.category);
    }

    // Apply location filter (OR logic within locations)
    if (filters.location && filters.location.length > 0) {
      filtered = filtered.filter(venue => 
        filters.location.some((location: string) =>
          venue.location.toLowerCase().includes(location.toLowerCase())
        )
      );
      console.log('After location filter:', filtered.length, 'venues', 'Locations:', filters.location);
    }

    // Apply games filter (OR logic within games)
    if (filters.games && filters.games.length > 0) {
      const venueIdsWithGames = allVenueServices
        .filter(service => {
          // Check if service has any of the selected games
          const serviceGames = (service as any).service_games || [];
          const serviceType = (service as any).service_type || '';
          const serviceName = service.name || '';
          
          return filters.games.some((game: string) => {
            const gameLower = game.toLowerCase();
            return serviceGames.some((sg: string) => sg.toLowerCase().includes(gameLower)) ||
                   serviceType.toLowerCase().includes(gameLower) ||
                   serviceName.toLowerCase().includes(gameLower) ||
                   // Special handling for billiards
                   (gameLower.includes('billiard') && (
                     serviceType.toLowerCase().includes('billiard') ||
                     serviceType.toLowerCase().includes('pool') ||
                     serviceName.toLowerCase().includes('billiard') ||
                     serviceName.toLowerCase().includes('pool')
                   ));
          });
        })
        .map(service => service.venue_id);
      
      filtered = filtered.filter(venue => venueIdsWithGames.includes(venue.id));
      console.log('After games filter:', filtered.length, 'venues', 'Games:', filters.games);
    }

    console.log('Final filtered venues:', filtered.length);
    setFilteredVenues(filtered);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Admin Access Button - Mobile responsive */}
      <div className="fixed top-20 right-2 sm:right-4 z-40">
        <Button 
          onClick={() => window.location.href = '/admin'}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
          size="sm"
        >
          <span className="hidden sm:inline">Admin Panel</span>
          <span className="sm:hidden">Admin</span>
        </Button>
      </div>
      


      {/* Enhanced Featured Venues Section */}
      <section className="section-padding bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filter Component - positioned on the left above venues */}
          <div className="flex justify-start mb-6 sm:mb-8">
            <HomePageFilters 
              onFiltersChange={handleFiltersChange} 
            />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (filteredVenues && filteredVenues.length === 0) ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-400 text-3xl">🔍</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Venues Found</h3>
                <p className="text-gray-600 mb-6">
                  No venues match your current filters. Try adjusting your search criteria or clear the filters to see all venues.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const emptyFilters = {
                      category: [],
                      location: [],
                      games: []
                    };
                    setCurrentFilters(emptyFilters);
                    setFilteredVenues(venues);
                  }}
                  className="mx-auto"
                >
                  Clear All Filters
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {(filteredVenues || venues)?.slice(0, 6).map((venue, index) => (
                <motion.div
                  key={venue.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="hover-lift"
                >
                  <VenueCard venue={venue} />
                </motion.div>
              ))}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <Button 
              variant="outline" 
              size="lg" 
              className="group"
              onClick={() => window.location.href = '/search'}
            >
              View All Venues
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Clean Minimal Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Logo and Description */}
            <div className="flex-1 max-w-md">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">D</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-gray-900">
                    Dajavshne
                  </span>
                  <span className="text-sm text-gray-500">
                    Gaming Hub
                  </span>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Your premier destination for discovering and booking exceptional gaming venues worldwide. Experience the future of gaming entertainment.
              </p>
            </div>
            
            {/* Social Media Icons */}
            <div className="flex items-center space-x-4">
              <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-pink-600 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z"/>
                </svg>
              </a>
            </div>
            
            {/* Contact Information */}
            <div className="flex items-center space-x-6 text-gray-600">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                </svg>
                <span className="font-medium">2 888 222</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <span className="font-medium">info@dajavshne.ge</span>
              </div>
            </div>
          </div>
          
          {/* Bottom Section */}
          <div className="flex flex-col sm:flex-row items-center justify-between mt-12 pt-8 border-t border-gray-200 text-sm text-gray-500">
            <PrivacyPolicyDialog open={privacyDialogOpen} onOpenChange={setPrivacyDialogOpen}>
              <button 
                onClick={() => setPrivacyDialogOpen(true)}
                className="hover:text-gray-700 transition-colors mb-4 sm:mb-0"
              >
                Privacy Policy
              </button>
            </PrivacyPolicyDialog>
            <p>&copy; 2025 Dajavshne Gaming Hub. All Rights Reserved</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

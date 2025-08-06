import { useState, useEffect, useMemo } from 'react';
import { useVenues, Venue } from './useVenues';
import { supabase } from '@/integrations/supabase/client';

export const useVenueSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [gameBasedResults, setGameBasedResults] = useState<Venue[]>([]);
  const { data: venues, isLoading } = useVenues(); // Get all venues

  // Search for venues by game names in services
  useEffect(() => {
    const searchByGames = async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setGameBasedResults([]);
        return;
      }

      try {
        const { data: serviceVenues, error } = await supabase
          .from('venue_services')
          .select(`
            venue_id,
            venues!inner(id, name, location, rating)
          `)
          .or(`service_games.cs.{${searchQuery}},name.ilike.%${searchQuery}%`);

        if (error) throw error;

        const venuesFromGames = serviceVenues?.map(service => ({
          id: service.venues.id,
          name: service.venues.name,
          location: service.venues.location,
          rating: service.venues.rating,
          review_count: 0,
          images: []
        })) || [];

        // Remove duplicates
        const uniqueVenues = venuesFromGames.filter((venue, index, arr) => 
          arr.findIndex(v => v.id === venue.id) === index
        );

        setGameBasedResults(uniqueVenues as any);
      } catch (error) {
        console.error('Game search error:', error);
        setGameBasedResults([]);
      }
    };

    const timeoutId = setTimeout(searchByGames, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !venues) return [];
    
    const query = searchQuery.toLowerCase().trim();
    console.log('Searching for:', query, 'in venues:', venues.length);
    
    // Search in venue names and locations
    const nameLocationResults = venues.filter((venue: Venue) => {
      const nameMatch = venue.name.toLowerCase().includes(query);
      const locationMatch = venue.location.toLowerCase().includes(query);
      
      if (nameMatch || locationMatch) {
        console.log('Name/Location match found:', venue.name, { nameMatch, locationMatch });
      }
      
      return nameMatch || locationMatch;
    });

    // Combine results and remove duplicates
    const allResults = [...nameLocationResults];
    
    gameBasedResults.forEach(gameVenue => {
      if (!allResults.find(v => v.id === gameVenue.id)) {
        allResults.push(gameVenue);
        console.log('Game match found:', gameVenue.name);
      }
    });

    // Sort by relevance (exact name matches first, then by rating)
    const sortedResults = allResults.sort((a, b) => {
      const aNameMatch = a.name.toLowerCase().includes(query);
      const bNameMatch = b.name.toLowerCase().includes(query);
      
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      
      return b.rating - a.rating;
    }).slice(0, 8);
    
    console.log('Total search results:', sortedResults.length);
    return sortedResults;
  }, [searchQuery, venues, gameBasedResults]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(query.length > 0);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    setGameBasedResults([]);
  };

  return {
    searchQuery,
    searchResults,
    isSearching,
    isLoading,
    handleSearch,
    clearSearch
  };
};
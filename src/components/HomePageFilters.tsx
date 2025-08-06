import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter, X, MapPin, Gamepad2, Tag, Search, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FilterState {
  category: string[];
  location: string[];
  games: string[];
}

interface HomePageFiltersProps {
  onFiltersChange?: (filters: FilterState) => void;
  className?: string;
}

const categories = [
  "PC Gaming",
  "PlayStation 5", 
  "Billiards",
  "Table Tennis",
  "Arcade",
  "VR Gaming"
];

const locations = [
  "Old Tbilisi",
  "Vake",
  "Saburtalo",
  "Didube",
  "Chugureti",
  "Mtatsminda",
  "Isani",
  "Samgori",
  "Gldani",
  "Nadzaladevi",
  "Didgori",
  "Krtsanisi"
];

const gameOptions = [
  "FIFA",
  "Call of Duty",
  "Fortnite",
  "Valorant",
  "CS:GO",
  "8-Ball Pool",
  "9-Ball Pool",
  "Billiards",
  "Pool",
  "Table Tennis",
  "Dota 2",
  "League of Legends",
  "Apex Legends",
  "Overwatch 2",
  "Rocket League",
  "Minecraft",
  "Grand Theft Auto V",
  "Among Us",
  "Fall Guys",
  "Rainbow Six Siege"
];

const HomePageFilters = ({ onFiltersChange, className = "" }: HomePageFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [gameSearchQuery, setGameSearchQuery] = useState("");
  const [tempFilters, setTempFilters] = useState<FilterState>({
    category: [],
    location: [],
    games: []
  });
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    category: [],
    location: [],
    games: []
  });
  const filterRef = useRef<HTMLDivElement>(null);

  // Load applied filters into temp filters when panel opens
  useEffect(() => {
    if (isExpanded) {
      setTempFilters({
        category: [...appliedFilters.category],
        location: [...appliedFilters.location], 
        games: [...appliedFilters.games]
      });
    }
  }, [isExpanded]);

  const handleTempFilterChange = (key: keyof FilterState, value: string | string[]) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleCategoryToggle = (category: string) => {
    const newCategories = tempFilters.category.includes(category)
      ? tempFilters.category.filter(c => c !== category)
      : [...tempFilters.category, category];
    handleTempFilterChange('category', newCategories);
  };

  const handleLocationToggle = (location: string) => {
    const newLocations = tempFilters.location.includes(location)
      ? tempFilters.location.filter(l => l !== location)
      : [...tempFilters.location, location];
    handleTempFilterChange('location', newLocations);
  };

  const handleGameToggle = (game: string) => {
    const newGames = tempFilters.games.includes(game)
      ? tempFilters.games.filter(g => g !== game)
      : [...tempFilters.games, game];
    handleTempFilterChange('games', newGames);
  };

  const applyFilters = () => {
    setAppliedFilters(tempFilters);
    onFiltersChange?.(tempFilters);
    setIsExpanded(false);
  };

  const clearAllFilters = () => {
    const emptyFilters = {
      category: [],
      location: [],
      games: []
    };
    setTempFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    onFiltersChange?.(emptyFilters);
    setIsExpanded(false);
  };

  const clearIndividualFilter = (filterType: keyof FilterState) => {
    const newTempFilters = { ...tempFilters, [filterType]: [] };
    setTempFilters(newTempFilters);
  };

  const hasActiveTempFilters = Object.values(tempFilters).some(value => 
    Array.isArray(value) ? value.length > 0 : false
  );

  const hasAppliedFilters = Object.values(appliedFilters).some(value => 
    Array.isArray(value) ? value.length > 0 : false
  );

  // Filter games based on search query
  const filteredGames = gameOptions.filter(game => 
    game.toLowerCase().includes(gameSearchQuery.toLowerCase())
  );
  const activeFilterCount = appliedFilters.category.length + appliedFilters.location.length + appliedFilters.games.length;

  return (
    <div className={`relative ${className}`} ref={filterRef}>
      {/* Filter Controls */}
      <div className="flex items-center gap-3">
        {/* Filter Toggle Button */}
        <Button
          variant="outline"
          size="lg"
          className={`group relative border-2 transition-all duration-300 bg-background text-foreground shadow-md z-10 ${
            isExpanded 
              ? 'border-primary bg-primary/5 shadow-lg' 
              : 'border-primary/30 hover:border-primary hover:bg-primary/5'
          }`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Filter className={`h-5 w-5 mr-2 transition-transform duration-300 ${
            isExpanded ? 'rotate-180' : ''
          }`} />
          <span className="font-medium">
            {isExpanded ? 'Hide Filters' : 'Show Filters'}
          </span>
          
          {/* Active Filter Count Badge */}
          <AnimatePresence>
            {activeFilterCount > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold"
              >
                {activeFilterCount}
              </motion.div>
            )}
          </AnimatePresence>
        </Button>

        {/* Clear Filters Button - Only show when filters are applied */}
        <AnimatePresence>
          {hasAppliedFilters && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Button
                variant="outline"
                size="lg"
                onClick={clearAllFilters}
                className="border-2 border-destructive/30 text-destructive hover:border-destructive hover:bg-destructive/5 transition-all duration-300 shadow-md"
              >
                <X className="h-5 w-5 mr-2" />
                <span className="font-medium">Clear Filters</span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Expandable Filter Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute top-full left-0 mt-4 z-50 w-full min-w-[280px] max-w-2xl right-0 sm:min-w-[400px] lg:min-w-[500px]"
          >
            <Card className="border border-primary/20 shadow-lg bg-white backdrop-blur-sm rounded-lg overflow-hidden mx-2 sm:mx-0">
              <CardContent className="p-3 sm:p-4 lg:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-5 gap-3">
                  <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                      <Filter className="h-4 w-4 text-primary" />
                    </div>
                    Filter Venues
                  </h3>
                  {hasActiveTempFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-muted-foreground hover:text-destructive transition-colors self-start sm:self-auto text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear All
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Category Filter */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                        <div className="p-1 bg-primary/10 rounded">
                          <Tag className="h-3 w-3 text-primary" />
                        </div>
                        Categories
                      </label>
                      {tempFilters.category.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => clearIndividualFilter('category')}
                          className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full h-9 border border-muted hover:border-primary/50 transition-colors justify-between text-left font-normal text-sm"
                        >
                          <span className="truncate">
                            {tempFilters.category.length === 0 
                              ? "Choose categories" 
                              : `${tempFilters.category.length} selected`
                            }
                          </span>
                          <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <div className="max-h-60 overflow-y-auto">
                          {categories.map((category) => (
                            <div
                              key={category}
                              className="flex items-center space-x-2 px-3 py-2 hover:bg-muted cursor-pointer"
                              onClick={() => handleCategoryToggle(category)}
                            >
                              <Checkbox 
                                checked={tempFilters.category.includes(category)}
                                onChange={() => {}} // Handled by onClick above
                              />
                              <span className="text-sm">{category}</span>
                              {tempFilters.category.includes(category) && (
                                <Check className="h-4 w-4 ml-auto text-primary" />
                              )}
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Location Filter */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                        <div className="p-1 bg-primary/10 rounded">
                          <MapPin className="h-3 w-3 text-primary" />
                        </div>
                        Locations
                      </label>
                      {tempFilters.location.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => clearIndividualFilter('location')}
                          className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full h-9 border border-muted hover:border-primary/50 transition-colors justify-between text-left font-normal text-sm"
                        >
                          <span className="truncate">
                            {tempFilters.location.length === 0 
                              ? "Choose locations" 
                              : `${tempFilters.location.length} selected`
                            }
                          </span>
                          <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <div className="max-h-60 overflow-y-auto">
                          {locations.map((location) => (
                            <div
                              key={location}
                              className="flex items-center space-x-2 px-3 py-2 hover:bg-muted cursor-pointer"
                              onClick={() => handleLocationToggle(location)}
                            >
                              <Checkbox 
                                checked={tempFilters.location.includes(location)}
                                onChange={() => {}} // Handled by onClick above
                              />
                              <span className="text-sm">{location}</span>
                              {tempFilters.location.includes(location) && (
                                <Check className="h-4 w-4 ml-auto text-primary" />
                              )}
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Games Filter */}
                <div className="mt-8 sm:mt-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                      <div className="p-1 bg-primary/10 rounded">
                        <Gamepad2 className="h-3 w-3 text-primary" />
                      </div>
                      Available Games
                    </label>
                    {tempFilters.games.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearIndividualFilter('games')}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  {/* Game Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search games..."
                      value={gameSearchQuery}
                      onChange={(e) => setGameSearchQuery(e.target.value)}
                      className="pl-10 h-11 border-2 border-muted hover:border-primary/50 transition-colors"
                    />
                  </div>
                  
                  <div className="flex flex-wrap gap-2 sm:gap-3 max-h-32 overflow-y-auto">
                    {filteredGames.length > 0 ? (
                      filteredGames.map((game) => (
                        <Badge
                          key={game}
                          variant={tempFilters.games.includes(game) ? "default" : "outline"}
                          className={`cursor-pointer transition-all duration-200 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium ${
                            tempFilters.games.includes(game)
                              ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md'
                              : 'hover:bg-primary/10 hover:border-primary border-2'
                          }`}
                          onClick={() => handleGameToggle(game)}
                        >
                          {game}
                        </Badge>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground py-4">
                        No games found matching "{gameSearchQuery}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Apply Filters Button */}
                <div className="mt-6 pt-4 border-t border-muted flex gap-3">
                  <Button
                    onClick={applyFilters}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    size="lg"
                  >
                    Apply Filters
                  </Button>
                  {hasActiveTempFilters && (
                    <Button
                      variant="outline"
                      onClick={clearAllFilters}
                      size="lg"
                    >
                      Clear All
                    </Button>
                  )}
                </div>

                {/* Active Filters Summary */}
                {hasAppliedFilters && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-6 pt-4 border-t border-muted"
                      >
                        <p className="text-sm text-muted-foreground mb-2">Applied Filters:</p>
                        <div className="flex flex-wrap gap-2">
                          {appliedFilters.category.map((category) => (
                            <Badge key={category} variant="secondary" className="bg-primary/10 text-primary">
                              Category: {category}
                            </Badge>
                          ))}
                          {appliedFilters.location.map((location) => (
                            <Badge key={location} variant="secondary" className="bg-primary/10 text-primary">
                              Location: {location}
                            </Badge>
                          ))}
                          {appliedFilters.games.map((game) => (
                            <Badge key={game} variant="secondary" className="bg-primary/10 text-primary">
                              {game}
                            </Badge>
                          ))}
                        </div>
                      </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomePageFilters;
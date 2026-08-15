import React, { createContext, useContext, useState, useMemo } from 'react';
import { Listing, Campus, TradeMode, ConditionGrade } from '../types';
import { SEED_LISTINGS } from '../data/seedData';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface MarketContextType {
  listings: Listing[];
  favorites: string[];
  isLoading: boolean;
  selectedCampus: 'All' | Campus;
  selectedCategory: string;
  selectedTradeMode: 'All' | TradeMode;
  selectedCondition: 'All' | ConditionGrade;
  searchQuery: string;
  sortBy: 'recent' | 'price_low' | 'price_high' | 'trust_high' | 'views_high';
  priceRange: [number, number];
  setSelectedCampus: (campus: 'All' | Campus) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedTradeMode: (mode: 'All' | TradeMode) => void;
  setSelectedCondition: (condition: 'All' | ConditionGrade) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: 'recent' | 'price_low' | 'price_high' | 'trust_high' | 'views_high') => void;
  setPriceRange: (range: [number, number]) => void;
  filteredListings: Listing[];
  addListing: (listingData: Omit<Listing, 'id' | 'createdAt' | 'views' | 'favoritesCount' | 'isSold'>) => Listing;
  updateListing: (id: string, updates: Partial<Listing>) => void;
  deleteListing: (id: string) => void;
  toggleFavorite: (id: string) => void;
  boostListing: (id: string) => void;
  markAsSold: (id: string, isSold: boolean) => void;
  incrementViews: (id: string) => void;
  clearFilters: () => void;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [listings, setListings] = useLocalStorage<Listing[]>('tradelink_listings_v2', SEED_LISTINGS);
  const [favorites, setFavorites] = useLocalStorage<string[]>('tradelink_favorites', ['list-1', 'list-2']);
  
  // Filter States
  const [selectedCampus, setSelectedCampus] = useState<'All' | Campus>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTradeMode, setSelectedTradeMode] = useState<'All' | TradeMode>('All');
  const [selectedCondition, setSelectedCondition] = useState<'All' | ConditionGrade>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'price_low' | 'price_high' | 'trust_high' | 'views_high'>('recent');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [isLoading] = useState(false);

  const clearFilters = () => {
    setSelectedCampus('All');
    setSelectedCategory('All');
    setSelectedTradeMode('All');
    setSelectedCondition('All');
    setSearchQuery('');
    setSortBy('recent');
    setPriceRange([0, 50000]);
  };

  const filteredListings = useMemo(() => {
    return listings
      .filter((item) => {
        // Campus filter
        if (selectedCampus !== 'All' && item.sellerCampus !== selectedCampus) {
          return false;
        }
        // Category filter
        if (selectedCategory !== 'All') {
          const matchCat = item.category.toLowerCase().includes(selectedCategory.toLowerCase());
          const matchTag = item.tags?.some(t => t.toLowerCase().includes(selectedCategory.toLowerCase()));
          if (!matchCat && !matchTag) return false;
        }
        // Trade mode filter
        if (selectedTradeMode !== 'All' && item.tradeMode !== selectedTradeMode) {
          return false;
        }
        // Condition filter
        if (selectedCondition !== 'All' && item.condition !== selectedCondition) {
          return false;
        }
        // Price range
        if (item.price < priceRange[0] || item.price > priceRange[1]) {
          return false;
        }
        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchDesc = item.description.toLowerCase().includes(q);
          const matchCourse = item.courseCode?.toLowerCase().includes(q) || false;
          const matchSeller = item.sellerName.toLowerCase().includes(q);
          const matchCategory = item.category.toLowerCase().includes(q);
          const matchTags = item.tags?.some(t => t.toLowerCase().includes(q)) || false;
          const matchCampus = item.sellerCampus.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchCourse && !matchSeller && !matchCategory && !matchTags && !matchCampus) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'recent') {
          if (a.isBoosted && !b.isBoosted) return -1;
          if (!a.isBoosted && b.isBoosted) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'price_low') {
          return a.price - b.price;
        }
        if (sortBy === 'price_high') {
          return b.price - a.price;
        }
        if (sortBy === 'trust_high') {
          return b.sellerTrustScore - a.sellerTrustScore;
        }
        if (sortBy === 'views_high') {
          return b.views - a.views;
        }
        return 0;
      });
  }, [listings, selectedCampus, selectedCategory, selectedTradeMode, selectedCondition, searchQuery, sortBy, priceRange]);

  const addListing = (
    listingData: Omit<Listing, 'id' | 'createdAt' | 'views' | 'favoritesCount' | 'isSold'>
  ): Listing => {
    const newListing: Listing = {
      ...listingData,
      id: `list-${Date.now()}`,
      createdAt: new Date().toISOString(),
      views: 1,
      favoritesCount: 0,
      isSold: false
    };

    setListings((prev) => {
      if (prev.some((l) => l.id === newListing.id)) return prev;
      return [newListing, ...prev];
    });
    return newListing;
  };

  const updateListing = (id: string, updates: Partial<Listing>) => {
    setListings((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteListing = (id: string) => {
    setListings((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const exists = prev.includes(id);
      const updated = exists ? prev.filter((favId) => favId !== id) : [...prev, id];
      
      setListings((prevListings) =>
        prevListings.map((l) =>
          l.id === id
            ? { ...l, favoritesCount: Math.max(0, l.favoritesCount + (exists ? -1 : 1)) }
            : l
        )
      );
      
      return updated;
    });
  };

  const boostListing = (id: string) => {
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isBoosted: true } : l))
    );
  };

  const markAsSold = (id: string, isSold: boolean) => {
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isSold } : l))
    );
  };

  const incrementViews = (id: string) => {
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, views: l.views + 1 } : l))
    );
  };

  return (
    <MarketContext.Provider
      value={{
        listings,
        favorites,
        isLoading,
        selectedCampus,
        selectedCategory,
        selectedTradeMode,
        selectedCondition,
        searchQuery,
        sortBy,
        priceRange,
        setSelectedCampus,
        setSelectedCategory,
        setSelectedTradeMode,
        setSelectedCondition,
        setSearchQuery,
        setSortBy,
        setPriceRange,
        filteredListings,
        addListing,
        updateListing,
        deleteListing,
        toggleFavorite,
        boostListing,
        markAsSold,
        incrementViews,
        clearFilters
      }}
    >
      {children}
    </MarketContext.Provider>
  );
};

export const useMarket = () => {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error('useMarket must be used within a MarketProvider');
  }
  return context;
};

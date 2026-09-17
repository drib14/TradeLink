import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Listing, Campus, TradeMode, ConditionGrade } from '../types';
import { listingsService } from '../services/listings.service';
import { getAccessToken } from '../services/api';

interface MarketContextType {
  listings: Listing[];
  favorites: string[];
  isLoading: boolean;
  isOffline: boolean;
  selectedCampus: 'All' | Campus;
  selectedCategory: string;
  selectedTradeMode: 'All' | TradeMode | 'flash_only';
  selectedCondition: 'All' | ConditionGrade;
  searchQuery: string;
  sortBy: 'recent' | 'price_low' | 'price_high' | 'trust_high' | 'views_high';
  priceRange: [number, number];
  setSelectedCampus: (campus: 'All' | Campus) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedTradeMode: (mode: 'All' | TradeMode | 'flash_only') => void;
  setSelectedCondition: (condition: 'All' | ConditionGrade) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: 'recent' | 'price_low' | 'price_high' | 'trust_high' | 'views_high') => void;
  setPriceRange: (range: [number, number]) => void;
  filteredListings: Listing[];
  addListing: (listingData: any) => Promise<Listing>;
  updateListing: (id: string, updates: Partial<Listing>) => Promise<void>;
  deleteListing: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => void;
  markAsSold: (id: string, isSold: boolean) => Promise<void>;
  updateListingQuantity: (id: string, quantity: number) => Promise<void>;
  incrementViews: (id: string) => void;
  clearFilters: () => void;
  refreshListings: () => Promise<void>;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  // Filter States
  const [selectedCampus, setSelectedCampus] = useState<'All' | Campus>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTradeMode, setSelectedTradeMode] = useState<'All' | TradeMode | 'flash_only'>('All');
  const [selectedCondition, setSelectedCondition] = useState<'All' | ConditionGrade>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'price_low' | 'price_high' | 'trust_high' | 'views_high'>('recent');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);

  // Fetch listings from backend on mount
  const refreshListings = useCallback(async () => {
    setIsLoading(true);
    try {
      const serverListings = await listingsService.getListings();
      if (Array.isArray(serverListings)) {
        setListings(serverListings);
        setIsOffline(false);
      }
    } catch {
      setIsOffline(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshListings();
  }, [refreshListings]);

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
          const matchTag = item.tags?.some((t) => t.toLowerCase().includes(selectedCategory.toLowerCase()));
          if (!matchCat && !matchTag) return false;
        }
        // Trade Mode filter
        if (selectedTradeMode !== 'All' && item.tradeMode !== selectedTradeMode) {
          return false;
        }
        // Condition filter
        if (selectedCondition !== 'All' && item.condition !== selectedCondition) {
          return false;
        }
        // Price Range filter
        if (item.price < priceRange[0] || item.price > priceRange[1]) {
          return false;
        }
        // Search Query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchDesc = item.description.toLowerCase().includes(q);
          const matchSeller = item.sellerName.toLowerCase().includes(q);
          const matchTag = item.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchDesc && !matchSeller && !matchTag) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'recent') {
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

  const addListing = async (
    listingData: Omit<Listing, 'id' | 'createdAt' | 'views' | 'favoritesCount' | 'isSold'>
  ): Promise<Listing> => {
    const created = await listingsService.createListing(listingData);
    setListings((prev) => [created, ...prev]);
    return created;
  };

  const updateListing = async (id: string, updates: Partial<Listing>) => {
    setListings((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    await listingsService.updateListing(id, updates);
  };

  const deleteListing = async (id: string) => {
    setListings((prev) => prev.filter((item) => item.id !== id));
    await listingsService.deleteListing(id);
  };

  const toggleFavorite = async (id: string) => {
    let wasFavorited = false;

    setFavorites((prev) => {
      wasFavorited = prev.includes(id);
      return wasFavorited ? prev.filter((favId) => favId !== id) : [...prev, id];
    });
  };

  const markAsSold = async (id: string, isSold: boolean) => {
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, isSold } : l)));
    await listingsService.markAsSold(id, isSold);
  };

  const updateListingQuantity = async (id: string, quantity: number) => {
    setListings((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity, isSold: quantity === 0 }
          : item
      )
    );
    await listingsService.updateListingQuantity(id, quantity);
  };

  const incrementViews = (id: string) => {
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, views: l.views + 1 } : l)));
    listingsService.incrementViews(id);
  };

  return (
    <MarketContext.Provider
      value={{
        listings,
        favorites,
        isLoading,
        isOffline,
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
        markAsSold,
        updateListingQuantity,
        incrementViews,
        clearFilters,
        refreshListings
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

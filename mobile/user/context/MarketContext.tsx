import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Listing, Campus, TradeMode, ConditionGrade, FlashRequest, WantedRequest, Conversation } from '../types';
import { mobileListingsService } from '../services/listings.service';
import { mobileFlashMarketService, mobileWantedService, mobileChatService } from '../services/flashMarket.service';

interface MarketContextType {
  listings: Listing[];
  favorites: string[];
  flashRequests: FlashRequest[];
  wantedRequests: FlashRequest[];
  conversations: Conversation[];
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
  addListing: (listingData: Partial<Listing>) => Promise<Listing | null>;
  updateListing: (id: string, updates: Partial<Listing>) => Promise<void>;
  deleteListing: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  isFavorite: (id: string) => boolean;
  markAsSold: (id: string, isSold: boolean) => Promise<void>;
  incrementViews: (id: string) => void;
  addFlashRequest: (data: Partial<FlashRequest>) => Promise<FlashRequest | null>;
  addWantedRequest: (data: Partial<WantedRequest>) => Promise<WantedRequest | null>;
  addMessageToConversation: (convId: string, message: string) => void;
  clearFilters: () => void;
  refreshListings: () => Promise<void>;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [flashRequests, setFlashRequests] = useState<FlashRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Filter States
  const [selectedCampus, setSelectedCampus] = useState<'All' | Campus>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTradeMode, setSelectedTradeMode] = useState<'All' | TradeMode>('All');
  const [selectedCondition, setSelectedCondition] = useState<'All' | ConditionGrade>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'price_low' | 'price_high' | 'trust_high' | 'views_high'>('recent');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);

  // Fetch listings from backend API
  const refreshListings = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedListings, fetchedFlash, fetchedFavs, fetchedConvs] = await Promise.allSettled([
        mobileListingsService.getListings({
          campus: selectedCampus,
          category: selectedCategory,
          tradeMode: selectedTradeMode,
          condition: selectedCondition,
          search: searchQuery,
          sortBy,
          priceMin: priceRange[0],
          priceMax: priceRange[1],
        }),
        mobileFlashMarketService.getFlashRequests({ campus: selectedCampus }),
        mobileListingsService.getFavorites(),
        mobileChatService.getConversations(),
      ]);

      if (fetchedListings.status === 'fulfilled') {
        setListings(fetchedListings.value || []);
      }
      if (fetchedFlash.status === 'fulfilled') {
        setFlashRequests(fetchedFlash.value || []);
      }
      if (fetchedFavs.status === 'fulfilled') {
        setFavorites(fetchedFavs.value || []);
      }
      if (fetchedConvs.status === 'fulfilled') {
        setConversations(fetchedConvs.value || []);
      }
    } catch (err) {
      console.warn('Failed to load market data from API:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCampus, selectedCategory, selectedTradeMode, selectedCondition, searchQuery, sortBy, priceRange]);

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
    setPriceRange([0, 100000]);
  };

  const filteredListings = useMemo(() => listings, [listings]);

  const addListing = async (listingData: Partial<Listing>): Promise<Listing | null> => {
    try {
      const created = await mobileListingsService.createListing(listingData);
      if (created) {
        setListings((prev) => [created, ...prev]);
        return created;
      }
      return null;
    } catch (err) {
      console.warn('Failed to create listing:', err);
      return null;
    }
  };

  const updateListing = async (id: string, updates: Partial<Listing>) => {
    try {
      await mobileListingsService.updateListing(id, updates);
      setListings((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
    } catch (err) {
      console.warn('Failed to update listing:', err);
    }
  };

  const deleteListing = async (id: string) => {
    try {
      await mobileListingsService.deleteListing(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.warn('Failed to delete listing:', err);
    }
  };

  const toggleFavorite = async (id: string) => {
    const isCurrentlyFav = favorites.includes(id);

    // Optimistically toggle favorites array
    setFavorites((prev) =>
      isCurrentlyFav ? prev.filter((fId) => fId !== id) : [...prev, id]
    );

    // Optimistically update favorites count on listings
    setListings((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              favoritesCount: Math.max(0, (l.favoritesCount || 0) + (isCurrentlyFav ? -1 : 1)),
            }
          : l
      )
    );

    try {
      await mobileListingsService.toggleFavorite(id);
    } catch (err) {
      console.warn('Failed to toggle favorite on server:', err);
      // Rollback on failure
      setFavorites((prev) =>
        isCurrentlyFav ? [...prev, id] : prev.filter((fId) => fId !== id)
      );
      setListings((prev) =>
        prev.map((l) =>
          l.id === id
            ? {
                ...l,
                favoritesCount: Math.max(0, (l.favoritesCount || 0) + (isCurrentlyFav ? 1 : -1)),
              }
            : l
        )
      );
    }
  };

  const isFavorite = (id: string): boolean => {
    return favorites.includes(id);
  };

  const markAsSold = async (id: string, isSold: boolean) => {
    try {
      await mobileListingsService.markAsSold(id, isSold);
      setListings((prev) => prev.map((l) => (l.id === id ? { ...l, isSold } : l)));
    } catch (err) {
      console.warn('Failed to mark listing as sold:', err);
    }
  };

  const incrementViews = (id: string) => {
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, views: (l.views || 0) + 1 } : l))
    );
  };

  const addFlashRequest = async (data: Partial<FlashRequest>): Promise<FlashRequest | null> => {
    try {
      const created = await mobileWantedService.createFlashRequest(data);
      if (created) {
        setFlashRequests((prev) => [created, ...prev]);
        return created;
      }
      return null;
    } catch (err) {
      console.warn('Failed to create flash request:', err);
      return null;
    }
  };

  const addWantedRequest = async (data: Partial<WantedRequest>): Promise<WantedRequest | null> => {
    try {
      const created = await mobileWantedService.createWantedRequest(data);
      if (created) {
        setFlashRequests((prev) => [created, ...prev]);
        return created;
      }
      return null;
    } catch (err) {
      console.warn('Failed to create wanted request:', err);
      return null;
    }
  };

  const addMessageToConversation = (convId: string, message: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              lastMessage: message,
              lastMessageTimestamp: 'Just now',
            }
          : c
      )
    );
  };

  return (
    <MarketContext.Provider
      value={{
        listings,
        favorites,
        flashRequests,
        wantedRequests: flashRequests,
        conversations,
        selectedCampus,
        selectedCategory,
        selectedTradeMode,
        selectedCondition,
        searchQuery,
        sortBy,
        priceRange,
        isLoading,
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
        isFavorite,
        markAsSold,
        incrementViews,
        addFlashRequest,
        addWantedRequest,
        addMessageToConversation,
        clearFilters,
        refreshListings,
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

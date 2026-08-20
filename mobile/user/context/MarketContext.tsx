import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Listing, Campus, TradeMode, ConditionGrade, WantedRequest, Conversation } from '../types';
import { SEED_LISTINGS, SEED_WANTED, SEED_CONVERSATIONS, normalizeListing } from '../data/seedData';

interface MarketContextType {
  listings: Listing[];
  favorites: string[];
  wantedRequests: WantedRequest[];
  conversations: Conversation[];
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
  isFavorite: (id: string) => boolean;
  boostListing: (id: string) => void;
  markAsSold: (id: string, isSold: boolean) => void;
  incrementViews: (id: string) => void;
  addWantedRequest: (data: Omit<WantedRequest, 'id' | 'createdAt' | 'offersCount' | 'status'>) => WantedRequest;
  addMessageToConversation: (convId: string, message: string) => void;
  clearFilters: () => void;
  refreshListings: () => Promise<void>;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

const LISTINGS_STORAGE_KEY = 'tradelink_mobile_listings_v1';
const FAVORITES_STORAGE_KEY = 'tradelink_mobile_favorites_v1';
const WANTED_STORAGE_KEY = 'tradelink_mobile_wanted_v1';

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [listings, setListings] = useState<Listing[]>(SEED_LISTINGS.map(normalizeListing));
  const [favorites, setFavorites] = useState<string[]>([]);
  const [wantedRequests, setWantedRequests] = useState<WantedRequest[]>(SEED_WANTED);
  const [conversations, setConversations] = useState<Conversation[]>(SEED_CONVERSATIONS);

  // Filter States
  const [selectedCampus, setSelectedCampus] = useState<'All' | Campus>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTradeMode, setSelectedTradeMode] = useState<'All' | TradeMode>('All');
  const [selectedCondition, setSelectedCondition] = useState<'All' | ConditionGrade>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'price_low' | 'price_high' | 'trust_high' | 'views_high'>('recent');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);

  // Load from AsyncStorage
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedListings = await AsyncStorage.getItem(LISTINGS_STORAGE_KEY);
        if (storedListings) {
          const parsed = JSON.parse(storedListings);
          if (Array.isArray(parsed) && parsed.length > 0) setListings(parsed);
        }
        const storedFavs = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
        if (storedFavs) {
          const parsedFavs = JSON.parse(storedFavs);
          if (Array.isArray(parsedFavs)) setFavorites(parsedFavs);
        }
        const storedWanted = await AsyncStorage.getItem(WANTED_STORAGE_KEY);
        if (storedWanted) {
          const parsedWanted = JSON.parse(storedWanted);
          if (Array.isArray(parsedWanted)) setWantedRequests(parsedWanted);
        }
      } catch {
        // Fallback to seed data
      }
    };
    loadStoredData();
  }, []);

  const saveListings = async (newListings: Listing[]) => {
    setListings(newListings);
    try {
      await AsyncStorage.setItem(LISTINGS_STORAGE_KEY, JSON.stringify(newListings));
    } catch {}
  };

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
          const matchSeller = (item.sellerName || item.seller?.name || '').toLowerCase().includes(q);
          const matchCategory = item.category.toLowerCase().includes(q);
          const matchTags = item.tags?.some(t => t.toLowerCase().includes(q)) || false;
          const matchCampus = (item.sellerCampus || item.campus || '').toLowerCase().includes(q);
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
          const scoreB = b.sellerTrustScore || (b.seller?.trustRating ? b.seller.trustRating * 20 : 90);
          const scoreA = a.sellerTrustScore || (a.seller?.trustRating ? a.seller.trustRating * 20 : 90);
          return scoreB - scoreA;
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
      isSold: false,
    };
    const updated = [newListing, ...listings];
    saveListings(updated);
    return newListing;
  };

  const updateListing = (id: string, updates: Partial<Listing>) => {
    const updated = listings.map((item) => (item.id === id ? { ...item, ...updates } : item));
    saveListings(updated);
  };

  const deleteListing = (id: string) => {
    const updated = listings.filter((item) => item.id !== id);
    saveListings(updated);
  };

  const toggleFavorite = async (id: string) => {
    const exists = favorites.includes(id);
    const updatedFavs = exists ? favorites.filter((favId) => favId !== id) : [...favorites, id];
    setFavorites(updatedFavs);
    try {
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updatedFavs));
    } catch {}

    const updatedListings = listings.map((l) =>
      l.id === id
        ? { ...l, favoritesCount: Math.max(0, (l.favoritesCount || 0) + (exists ? -1 : 1)) }
        : l
    );
    saveListings(updatedListings);
  };

  const boostListing = (id: string) => {
    const updated = listings.map((l) => (l.id === id ? { ...l, isBoosted: true } : l));
    saveListings(updated);
  };

  const markAsSold = (id: string, isSold: boolean) => {
    const updated = listings.map((l) => (l.id === id ? { ...l, isSold } : l));
    saveListings(updated);
  };

  const incrementViews = (id: string) => {
    const updated = listings.map((l) => (l.id === id ? { ...l, views: l.views + 1 } : l));
    saveListings(updated);
  };

  const addWantedRequest = (data: Omit<WantedRequest, 'id' | 'createdAt' | 'offersCount' | 'status'>): WantedRequest => {
    const newReq: WantedRequest = {
      ...data,
      id: `wanted-${Date.now()}`,
      createdAt: new Date().toISOString(),
      offersCount: 0,
      status: 'open',
    };
    const updated = [newReq, ...wantedRequests];
    setWantedRequests(updated);
    AsyncStorage.setItem(WANTED_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
    return newReq;
  };

  const addMessageToConversation = (convId: string, message: string) => {
    setConversations(prev =>
      prev.map(c =>
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

  const isFavorite = (id: string): boolean => {
    return favorites.includes(id);
  };

  const refreshListings = async () => {
    try {
      const stored = await AsyncStorage.getItem(LISTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setListings(parsed);
          return;
        }
      }
      setListings(SEED_LISTINGS.map(normalizeListing));
    } catch {}
  };

  return (
    <MarketContext.Provider
      value={{
        listings,
        favorites,
        wantedRequests,
        conversations,
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
        isFavorite,
        boostListing,
        markAsSold,
        incrementViews,
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

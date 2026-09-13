import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMarket } from '../../context/MarketContext';
import { Header } from '../../components/Header';
import { CampusCarouselBanner } from '../../components/CampusCarouselBanner';
import { CategoryChips } from '../../components/CategoryChips';
import { ListingCard } from '../../components/ListingCard';
import { SkeletonFeed, SkeletonBanner } from '../../components/SkeletonLoader';
import { TradeMode } from '../../types';

export default function HomeScreen() {
  const {
    filteredListings,
    selectedTradeMode,
    setSelectedTradeMode,
    searchQuery,
    selectedCategory,
    selectedCampus,
    refreshListings,
  } = useMarket();

  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshListings();
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  const tradeModeOptions: { label: string; value: TradeMode | 'ALL'; icon: any }[] = [
    { label: 'All Items', value: 'ALL', icon: 'grid-outline' },
    { label: 'Featured', value: 'ALL', icon: 'star' },
    { label: 'Swaps', value: 'SWAP', icon: 'repeat' },
    { label: 'Free Items', value: 'FREE', icon: 'gift-outline' },
  ];

  return (
    <View style={styles.container}>
      {/* 1. Header with Logo & Integrated SearchBar */}
      <Header />

      <ScrollView
        style={styles.scrollArea}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#002B7F" />
        }
      >
        {/* 2. Campus Carousel Banner or Skeleton */}
        {initialLoading ? <SkeletonBanner /> : <CampusCarouselBanner />}

        {/* 3. Quick Utilities Strip */}
        <View style={styles.utilitiesStrip}>
          <TouchableOpacity
            style={styles.utilityCard}
            onPress={() => router.push('/campus-map')}
            activeOpacity={0.8}
          >
            <View style={[styles.utilityIconBadge, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="shield-checkmark" size={16} color="#002B7F" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.utilityTitle}>Guarded Meetup Hubs</Text>
              <Text style={styles.utilitySub}>8 safe security checkpoints</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.utilityCard}
            onPress={() => router.push('/wanted')}
            activeOpacity={0.8}
          >
            <View style={[styles.utilityIconBadge, { backgroundColor: '#FEF9C3' }]}>
              <Ionicons name="flash" size={16} color="#B45309" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.utilityTitle}>⚡ Flash Market</Text>
              <Text style={styles.utilitySub}>Urgent buying, selling & trading</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* 4. Filter Pills (All, Featured, Swaps, Free) */}
        <View style={styles.tradeModeRow}>
          {tradeModeOptions.map((opt, idx) => {
            const isSelected = selectedTradeMode === opt.value && idx !== 1;
            return (
              <TouchableOpacity
                key={`${opt.label}-${idx}`}
                style={[styles.tradePill, isSelected && styles.tradePillActive]}
                onPress={() => setSelectedTradeMode(opt.value)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={opt.icon}
                  size={13}
                  color={isSelected ? '#FFFFFF' : '#475569'}
                />
                <Text style={[styles.tradePillText, isSelected && styles.tradePillTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 5. Category Chips */}
        <CategoryChips />

        {/* 6. Section Title & Results Count */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              {searchQuery ? `Search Results` : selectedCategory !== 'All' ? `${selectedCategory}` : `Active Listings`}
            </Text>
            <Text style={styles.sectionSub}>
              {selectedCampus === 'All' || selectedCampus === 'ALL' ? 'Across all 8 UC Campuses' : `At ${selectedCampus}`} •{' '}
              {filteredListings.length} {filteredListings.length === 1 ? 'item' : 'items'} available
            </Text>
          </View>

          <TouchableOpacity
            style={styles.seeAllButton}
            onPress={() => router.push('/marketplace')}
          >
            <Text style={styles.seeAllText}>View Catalog</Text>
            <Ionicons name="arrow-forward" size={12} color="#002B7F" />
          </TouchableOpacity>
        </View>

        {/* 7. Listings Grid or Skeleton */}
        {initialLoading ? (
          <SkeletonFeed count={6} />
        ) : filteredListings.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="search-outline" size={36} color="#002B7F" />
            </View>
            <Text style={styles.emptyTitle}>No items match your filter</Text>
            <Text style={styles.emptySubtitle}>
              Try searching with different keywords or switch campus filter to "All Campuses".
            </Text>
          </View>
        ) : (
          <View style={styles.feedGrid}>
            {filteredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </View>
        )}

        <View style={{ height: 28 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollArea: {
    flex: 1,
  },
  utilitiesStrip: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
    marginTop: 4,
    marginBottom: 6,
  },
  utilityCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  utilityIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  utilityTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  utilitySub: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '500',
  },
  tradeModeRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  tradePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 5,
  },
  tradePillActive: {
    backgroundColor: '#002B7F',
    borderColor: '#002B7F',
  },
  tradePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  tradePillTextActive: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
    fontWeight: '500',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  seeAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#002B7F',
  },
  feedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});

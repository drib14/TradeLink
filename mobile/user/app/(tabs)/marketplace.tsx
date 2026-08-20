import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMarket } from '../../context/MarketContext';
import { CategoryChips } from '../../components/CategoryChips';
import { ListingCard } from '../../components/ListingCard';

export default function MarketplaceScreen() {
  const {
    filteredListings,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedTradeMode,
    setSelectedTradeMode,
    sortBy,
    setSortBy,
    clearFilters,
  } = useMarket();

  const [isSortOpen, setIsSortOpen] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Search & Filter Bar */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items, books, calculators, gadgets..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Trade Mode Filter Row */}
        <View style={styles.tradeModeRow}>
          {[
            { id: 'All', label: 'All Modes' },
            { id: 'buy_sell', label: '💰 Buy & Sell' },
            { id: 'swap', label: '🔄 Swaps' },
            { id: 'free_donation', label: '🎁 Free' },
          ].map((mode) => {
            const isSelected = selectedTradeMode === mode.id;
            return (
              <TouchableOpacity
                key={mode.id}
                style={[styles.tradePill, isSelected && styles.tradePillActive]}
                onPress={() => setSelectedTradeMode(mode.id as any)}
              >
                <Text style={[styles.tradePillText, isSelected && styles.tradePillTextActive]}>
                  {mode.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Category Chips Scroller */}
      <View style={styles.categoryContainer}>
        <CategoryChips
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </View>

      {/* Catalog Status & Sort Bar */}
      <View style={styles.statusRow}>
        <Text style={styles.countText}>
          Found <Text style={{ fontWeight: '800', color: '#002B7F' }}>{filteredListings.length}</Text> listings
        </Text>

        <TouchableOpacity
          style={styles.sortBtn}
          onPress={() => setIsSortOpen(!isSortOpen)}
        >
          <Ionicons name="swap-vertical" size={14} color="#002B7F" />
          <Text style={styles.sortBtnText}>
            {sortBy === 'recent'
              ? 'Newest'
              : sortBy === 'price_low'
              ? 'Price: Low'
              : sortBy === 'price_high'
              ? 'Price: High'
              : 'Popular'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sort Dropdown Options */}
      {isSortOpen && (
        <View style={styles.sortMenu}>
          {[
            { id: 'recent', label: '⚡ Newest & Boosted' },
            { id: 'price_low', label: '📉 Price: Low to High' },
            { id: 'price_high', label: '📈 Price: High to Low' },
            { id: 'trust_high', label: '⭐ Seller Trust Rating' },
            { id: 'views_high', label: '🔥 Most Viewed' },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.id}
              style={[styles.sortItem, sortBy === opt.id && styles.sortItemActive]}
              onPress={() => {
                setSortBy(opt.id as any);
                setIsSortOpen(false);
              }}
            >
              <Text style={[styles.sortItemText, sortBy === opt.id && styles.sortItemTextActive]}>
                {opt.label}
              </Text>
              {sortBy === opt.id && <Ionicons name="checkmark" size={16} color="#002B7F" />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Main Listings FlatList */}
      <FlatList
        data={filteredListings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 4 }}>
            <ListingCard listing={item} />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No matching listings found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search terms, campus filter, or category.
            </Text>
            <TouchableOpacity style={styles.resetBtn} onPress={clearFilters}>
              <Text style={styles.resetBtnText}>Reset All Filters</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },
  tradeModeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tradePill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  tradePillActive: {
    backgroundColor: '#EBF1FC',
    borderColor: '#002B7F',
  },
  tradePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  tradePillTextActive: {
    color: '#002B7F',
    fontWeight: '800',
  },
  categoryContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
  },
  countText: {
    fontSize: 12,
    color: '#64748B',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sortBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#002B7F',
  },
  sortMenu: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 8,
  },
  sortItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  sortItemActive: {
    backgroundColor: '#EBF1FC',
  },
  sortItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  sortItemTextActive: {
    color: '#002B7F',
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: '#F8FAFC',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  resetBtn: {
    marginTop: 12,
    backgroundColor: '#002B7F',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

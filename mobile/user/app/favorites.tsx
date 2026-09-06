import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMarket } from '../context/MarketContext';
import { useAuth } from '../context/AuthContext';
import { ListingCard } from '../components/ListingCard';

export default function FavoritesScreen() {
  const router = useRouter();
  const { listings, favorites, refreshListings, setSelectedCategory } = useMarket();
  const { currentUser, openAuthModal } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshListings();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auth Gate
  if (!currentUser) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Saved Wishlist</Text>
          <Text style={styles.headerSub}>UC Student Marketplace</Text>
        </View>

        <View style={[styles.emptyContainer, { flex: 1, paddingHorizontal: 24 }]}>
          <View style={styles.authGateIconBox}>
            <Ionicons name="lock-closed" size={32} color="#002B7F" />
          </View>
          <Text style={styles.emptyTitle}>Sign In to Access Your Wishlist</Text>
          <Text style={styles.emptySub}>
            Saved items sync across devices so you can track price drops and secure campus meetups once logged in.
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={openAuthModal}
            activeOpacity={0.85}
          >
            <Ionicons name="log-in-outline" size={16} color="#FFFFFF" />
            <Text style={styles.browseBtnText}>Sign In with Student ID</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const savedListings = listings.filter((l) => favorites.includes(l.id));
  const totalSavedValue = savedListings.reduce((sum, item) => sum + (item.price || 0), 0);
  const swapCount = savedListings.filter((l) => (l.tradeMode || '').toLowerCase().includes('swap')).length;
  const freeCount = savedListings.filter((l) => (l.tradeMode || '').toLowerCase().includes('free')).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header with portfolio summary */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Text style={styles.headerTitle}>Saved Bookmarks ({savedListings.length})</Text>
            <Text style={styles.headerSub}>Items you're watching for price drops or meetups</Text>
          </div>
          {savedListings.length > 0 && (
            <View style={styles.valueBadge}>
              <Text style={styles.valueBadgeLabel}>Est. Total</Text>
              <Text style={styles.valueBadgeAmount}>₱{totalSavedValue.toLocaleString()}</Text>
            </View>
          )}
        </View>

        {savedListings.length > 0 && (swapCount > 0 || freeCount > 0) && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
            {swapCount > 0 && (
              <View style={[styles.miniPill, { backgroundColor: '#FFFBEB' }]}>
                <Text style={[styles.miniPillText, { color: '#D97706' }]}>{swapCount} Swap Offers</Text>
              </View>
            )}
            {freeCount > 0 && (
              <View style={[styles.miniPill, { backgroundColor: '#ECFDF5' }]}>
                <Text style={[styles.miniPillText, { color: '#059669' }]}>{freeCount} Free Donations</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <FlatList
        data={savedListings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#002B7F" />
        }
        renderItem={({ item }) => (
          <View style={{ marginBottom: 8 }}>
            <ListingCard listing={item} />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bookmark-outline" size={56} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Saved Items Yet</Text>
            <Text style={styles.emptySub}>
              Tap the heart bookmark icon on any item in the marketplace to monitor it here.
            </Text>
            <TouchableOpacity
              style={styles.browseBtn}
              onPress={() => router.push('/marketplace')}
              activeOpacity={0.85}
            >
              <Text style={styles.browseBtnText}>Explore Campus Marketplace</Text>
            </TouchableOpacity>

            {/* Discovery Pills */}
            <View style={{ marginTop: 24, width: '100%', alignItems: 'center' }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Popular Categories to Explore
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                {['Uniforms & Scrub Suits', 'Books & Reviewers', 'Tech & Engineering', 'Laboratory Supplies'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={styles.categoryPill}
                    onPress={() => {
                      setSelectedCategory(cat);
                      router.push('/marketplace');
                    }}
                  >
                    <Text style={styles.categoryPillText}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#002B7F',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  valueBadge: {
    backgroundColor: '#EBF1FC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: '#BCD1F7',
  },
  valueBadgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  valueBadgeAmount: {
    fontSize: 13,
    fontWeight: '900',
    color: '#002B7F',
  },
  miniPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  authGateIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#EBF1FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#BCD1F7',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 28,
    lineHeight: 18,
  },
  browseBtn: {
    backgroundColor: '#002B7F',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  browseBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  categoryPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryPillText: {
    fontSize: 11,
    color: '#002B7F',
    fontWeight: '700',
  },
});

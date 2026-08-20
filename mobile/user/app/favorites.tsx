import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMarket } from '../context/MarketContext';
import { ListingCard } from '../components/ListingCard';

export default function FavoritesScreen() {
  const router = useRouter();
  const { listings, favorites } = useMarket();

  const savedListings = listings.filter((l) => favorites.includes(l.id));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Bookmarks ({savedListings.length})</Text>
        <Text style={styles.headerSub}>Items you're watching for price drops or meetups</Text>
      </View>

      <FlatList
        data={savedListings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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
              Tap the bookmark icon on any item in the marketplace to save it here.
            </Text>
            <TouchableOpacity
              style={styles.browseBtn}
              onPress={() => router.push('/marketplace')}
            >
              <Text style={styles.browseBtnText}>Explore Campus Marketplace</Text>
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
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  browseBtn: {
    backgroundColor: '#002B7F',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  browseBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
});

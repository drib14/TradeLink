import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { ListingCard } from '../components/ListingCard';

export default function ProfileScreen() {
  const { currentUser, isAuthenticated, logout, openAuthModal } = useAuth();
  const { listings, favorites } = useMarket();
  const [activeTab, setActiveTab] = useState<'listings' | 'sold' | 'favorites'>('listings');

  const myListings = currentUser
    ? listings.filter((l) => (l.seller?.id || l.sellerId) === currentUser.id && !l.isSold)
    : [];
  const mySoldListings = currentUser
    ? listings.filter((l) => (l.seller?.id || l.sellerId) === currentUser.id && l.isSold)
    : [];
  const myFavoriteListings = listings.filter((l) => favorites.includes(l.id));
  const trustRating = Number(currentUser?.trustRating ?? currentUser?.rating ?? (currentUser?.trustScore != null ? currentUser.trustScore / 20 : 0));
  const reviewCount = Number(currentUser?.totalReviews ?? currentUser?.reviewCount ?? 0);
  const myListingHistory = currentUser
    ? listings.filter((l) => (l.seller?.id || l.sellerId) === currentUser.id)
    : [];
  const listingActivity = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const count = myListingHistory.filter((listing) => {
        const createdAt = new Date(listing.createdAt);
        return !Number.isNaN(createdAt.getTime()) &&
          createdAt.getFullYear() === date.getFullYear() &&
          createdAt.getMonth() === date.getMonth();
      }).length;
      return { label: date.toLocaleString('en', { month: 'short' }), count };
    });
  }, [myListingHistory]);
  const maxListingActivity = Math.max(1, ...listingActivity.map((item) => item.count));

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of your TradeLink account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  if (!isAuthenticated || !currentUser) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.guestContainer}>
        <View style={styles.guestCard}>
          <View style={styles.guestIconCircle}>
            <Ionicons name="person-circle-outline" size={64} color="#002B7F" />
          </View>
          <Text style={styles.guestTitle}>Welcome to TradeLink!</Text>
          <Text style={styles.guestSubtitle}>
            Log in with your UC Student ID Number or create an account to post listings, save favorite items, and chat directly with verified campus peers.
          </Text>

          <TouchableOpacity style={styles.loginButton} onPress={openAuthModal} activeOpacity={0.85}>
            <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
            <Text style={styles.loginButtonText}>Log In / Create Account</Text>
          </TouchableOpacity>
        </View>

        {/* Features Preview */}
        <View style={styles.featuresCard}>
          <Text style={styles.featuresHeader}>Why trade on TradeLink?</Text>
          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark" size={18} color="#002B7F" />
            <View style={{ flex: 1 }}>
              <Text style={styles.featureItemTitle}>100% UC Student Verified</Text>
              <Text style={styles.featureItemSub}>Only registered UC students can post and trade.</Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="location" size={18} color="#002B7F" />
            <View style={{ flex: 1 }}>
              <Text style={styles.featureItemTitle}>8 Guarded Meetup Hubs</Text>
              <Text style={styles.featureItemSub}>Safe on-campus exchanges with security guards.</Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="pricetag" size={18} color="#10B981" />
            <View style={{ flex: 1 }}>
              <Text style={styles.featureItemTitle}>0% Commission & Fees</Text>
              <Text style={styles.featureItemSub}>Keep 100% of your earnings on every sale.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Profile Header Card */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.profileMainRow}>
          <Image source={{ uri: currentUser.avatar }} style={styles.avatarLarge} />
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName}>{currentUser.name}</Text>
              {currentUser.isVerified && <VerifiedBadge size="sm" />}
            </View>
            <Text style={styles.studentId}>{currentUser.studentId}</Text>
            <Text style={styles.emailText}>{currentUser.email}</Text>
          </View>
        </View>

        {/* Campus & College Badges */}
        <View style={styles.metaBadgesRow}>
          <View style={styles.campusBadge}>
            <Ionicons name="location" size={12} color="#002B7F" />
            <Text style={styles.campusBadgeText}>{currentUser.campus}</Text>
          </View>
          <View style={styles.collegeBadge}>
            <Ionicons name="school" size={12} color="#475569" />
            <Text style={styles.collegeBadgeText} numberOfLines={1}>
              {currentUser.college}
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{myListings.length}</Text>
            <Text style={styles.statLabel}>Active Items</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Ionicons name="star" size={14} color="#FFC72C" />
              <Text style={styles.statNumber}>
                {reviewCount > 0 && trustRating > 0 ? trustRating.toFixed(1) : '—'}
              </Text>
            </View>
            <Text style={styles.statLabel}>Trust Score</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{Number(currentUser.successfulTrades ?? currentUser.completedTrades ?? 0)}</Text>
            <Text style={styles.statLabel}>Trades</Text>
          </View>
        </View>
      </View>

      {/* Live six-month listing activity; values come from this account's API listings. */}
      <View style={{ marginHorizontal: 16, marginTop: 14, padding: 16, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }}>Listing activity</Text>
          <Text style={{ fontSize: 11, color: '#64748B' }}>Last 6 months</Text>
        </View>
        {myListingHistory.length === 0 ? (
          <Text style={{ color: '#64748B', fontSize: 12 }}>Your listing activity will appear here when you publish an item.</Text>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 104, gap: 8 }}>
            {listingActivity.map((item) => (
              <View key={item.label} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                <Text style={{ fontSize: 10, color: '#475569', marginBottom: 5 }}>{item.count}</Text>
                <View style={{ width: '72%', height: Math.max(4, (item.count / maxListingActivity) * 68), backgroundColor: '#2563EB', borderRadius: 5 }} />
                <Text style={{ fontSize: 10, color: '#64748B', marginTop: 6 }}>{item.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 2. Tabs: Active / Fulfilled / Saved */}
      <View style={styles.tabSwitcher}>
        <TouchableOpacity
          style={[styles.switchTab, activeTab === 'listings' && styles.switchTabActive]}
          onPress={() => setActiveTab('listings')}
        >
          <Text style={[styles.switchTabText, activeTab === 'listings' && styles.switchTabTextActive]}>
            Active ({myListings.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.switchTab, activeTab === 'sold' && styles.switchTabActive]}
          onPress={() => setActiveTab('sold')}
        >
          <Text style={[styles.switchTabText, activeTab === 'sold' && styles.switchTabTextActive]}>
            Fulfilled ({mySoldListings.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.switchTab, activeTab === 'favorites' && styles.switchTabActive]}
          onPress={() => setActiveTab('favorites')}
        >
          <Text style={[styles.switchTabText, activeTab === 'favorites' && styles.switchTabTextActive]}>
            Saved ({myFavoriteListings.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Tab Content */}
      <View style={styles.tabContentArea}>
        {activeTab === 'listings' ? (
          myListings.length === 0 ? (
            <View style={styles.emptyItemsBox}>
              <Ionicons name="bag-handle-outline" size={42} color="#CBD5E1" />
              <Text style={styles.emptyItemsTitle}>No active listings yet</Text>
              <Text style={styles.emptyItemsSub}>
                Post pre-loved books, uniforms, calculators, or gadgets to start trading.
              </Text>
              <TouchableOpacity
                style={styles.postNowBtn}
                onPress={() => router.push('/create-listing')}
              >
                <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                <Text style={styles.postNowBtnText}>Post a New Listing</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.feedGrid}>
              {myListings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </View>
          )
        ) : activeTab === 'sold' ? (
          mySoldListings.length === 0 ? (
            <View style={styles.emptyItemsBox}>
              <Ionicons name="checkmark-circle-outline" size={42} color="#CBD5E1" />
              <Text style={styles.emptyItemsTitle}>No fulfilled trades yet</Text>
              <Text style={styles.emptyItemsSub}>
                Items you sell or swap will appear here once marked as fulfilled.
              </Text>
            </View>
          ) : (
            <View style={styles.feedGrid}>
              {mySoldListings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </View>
          )
        ) : myFavoriteListings.length === 0 ? (
          <View style={styles.emptyItemsBox}>
            <Ionicons name="heart-dislike-outline" size={42} color="#CBD5E1" />
            <Text style={styles.emptyItemsTitle}>No saved favorites</Text>
            <Text style={styles.emptyItemsSub}>
              Tap the heart icon on any listing to save it for later.
            </Text>
          </View>
        ) : (
          <View style={styles.feedGrid}>
            {myFavoriteListings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </View>
        )}
      </View>

      {/* 4. Action / Log Out Buttons */}
      <View style={styles.footerActions}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          <Text style={styles.logoutButtonText}>Log Out of Account</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  guestContainer: {
    padding: 18,
    alignItems: 'center',
  },
  guestCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#002B7F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 16,
  },
  guestIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  guestTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#002B7F',
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#002B7F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  featuresCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  featuresHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  featureItemSub: {
    fontSize: 11,
    color: '#64748B',
  },
  profileHeaderCard: {
    backgroundColor: '#FFFFFF',
    margin: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  profileMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#002B7F',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  studentId: {
    fontSize: 12,
    fontWeight: '700',
    color: '#002B7F',
    marginTop: 2,
  },
  emailText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  metaBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  campusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  campusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#002B7F',
  },
  collegeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    flex: 1,
  },
  collegeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginTop: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },
  tabSwitcher: {
    flexDirection: 'row',
    marginHorizontal: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 3,
  },
  switchTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  switchTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  switchTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  switchTabTextActive: {
    color: '#002B7F',
  },
  tabContentArea: {
    marginTop: 12,
  },
  emptyItemsBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyItemsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
    marginBottom: 4,
  },
  emptyItemsSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  postNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#002B7F',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  postNowBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  feedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  footerActions: {
    paddingHorizontal: 12,
    marginTop: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  logoutButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
});

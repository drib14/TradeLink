import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Dimensions,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMarket } from '../../context/MarketContext';
import { useAuth } from '../../context/AuthContext';
import { VerifiedBadge } from '../../components/VerifiedBadge';

import { mobileListingsService } from '../../services/listings.service';
import { Listing } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function formatRelativeTime(dateStr?: string) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { listings, favorites, toggleFavorite } = useMarket();
  const { currentUser, openAuthModal } = useAuth();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [asyncListing, setAsyncListing] = useState<Listing | null>(null);
  const [loadingItem, setLoadingItem] = useState(false);

  const listing = listings.find((l) => l.id === id) || asyncListing;

  useEffect(() => {
    if (!listings.find((l) => l.id === id) && id) {
      setLoadingItem(true);
      mobileListingsService
        .getListingById(id)
        .then((data) => setAsyncListing(data))
        .catch(() => setAsyncListing(null))
        .finally(() => setLoadingItem(false));
    }
  }, [id, listings]);

  if (!listing) {
    if (loadingItem) {
      return (
        <SafeAreaView style={styles.notFoundContainer}>
          <Text style={styles.notFoundSub}>Loading listing details...</Text>
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={styles.notFoundContainer}>
        <Ionicons name="alert-circle-outline" size={56} color="#DC2626" />
        <Text style={styles.notFoundTitle}>Item Not Found</Text>
        <Text style={styles.notFoundSub}>This listing may have been sold or removed.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Return to Catalog</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isFavorite = favorites.includes(listing.id);
  const isSold = listing.isSold || listing.status === 'sold';
  const savingsPct =
    listing.originalSrp && listing.price < listing.originalSrp
      ? Math.round(((listing.originalSrp - listing.price) / listing.originalSrp) * 100)
      : 0;

  const handleShare = async () => {
    if (!listing) return;
    try {
      await Share.share({
        title: listing.title,
        message: `Check out "${listing.title}" on TradeLink UC Marketplace: https://tradelink.uc.edu.ph/item/${listing.id}`,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  const submitReport = async (reason: string) => {
    if (!listing) return;
    try {
      await mobileListingsService.reportListing(listing.id, reason);
      Alert.alert('Report Received', 'Thank you. Campus moderators will review this listing promptly.');
    } catch (err: any) {
      Alert.alert('Report Status', err?.message || 'Listing report could not be submitted.');
    }
  };

  const handleReport = () => {
    if (!currentUser) {
      Alert.alert('Sign In Required', 'Please sign in to report a listing.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: openAuthModal },
      ]);
      return;
    }
    Alert.alert(
      'Report Listing',
      'Why are you reporting this listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Prohibited / Contraband',
          onPress: () => submitReport('Prohibited item, contraband, or unauthorized exam materials.'),
        },
        {
          text: 'Misleading / Condition Issue',
          onPress: () => submitReport('Misleading information, fake item, or condition discrepancy.'),
        },
        {
          text: 'Suspicious / Scam',
          onPress: () => submitReport('Suspicious seller activity, off-platform payment request, or scam.'),
        },
      ]
    );
  };

  const handleAction = () => {
    if (isSold) {
      Alert.alert('Item Sold', 'This item has already been purchased or completed.');
      return;
    }
    if (listing.tradeMode === 'swap') {
      Alert.alert(
        'Propose Swap',
        `Propose a trade for "${listing.title}" with ${listing.sellerName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start Proposal',
            onPress: () => {
              Alert.alert('Proposal Sent', 'Your swap proposal was submitted to the seller.');
            },
          },
        ]
      );
    } else if (listing.tradeMode === 'free_donation') {
      Alert.alert(
        'Claim Free Item',
        `Claim "${listing.title}" donated by ${listing.sellerName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Claim & Arrange Meetup',
            onPress: () => {
              Alert.alert('Claimed!', 'Please coordinate meetup at the campus guarded hub.');
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Buy & Safe Handshake',
        `Proceed to purchase "${listing.title}" for ₱${listing.price.toLocaleString()}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Schedule Guarded Meetup',
            onPress: () => {
              Alert.alert(
                'Meetup Initiated',
                'Your handshake code is generated. Coordinate in Messages to confirm the time.'
              );
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 1. Image Carousel */}
        <View style={styles.carouselContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setActiveImageIndex(newIndex);
            }}
          >
            {listing.images.map((imgUri, idx) => (
              <Image
                key={idx}
                source={{ uri: imgUri }}
                style={styles.carouselImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Dots Pagination */}
          {listing.images.length > 1 && (
            <View style={styles.paginationDots}>
              {listing.images.map((_, idx) => (
                <View
                  key={idx}
                  style={[styles.dot, activeImageIndex === idx && styles.dotActive]}
                />
              ))}
            </View>
          )}

          {/* Top Floating Navigation Overlay */}
          <View style={styles.topNavOverlay}>
            <TouchableOpacity
              style={styles.navCircleBtn}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.navRightButtons}>
              <TouchableOpacity
                style={styles.navCircleBtn}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navCircleBtn}
                onPress={handleReport}
                activeOpacity={0.8}
              >
                <Ionicons name="flag-outline" size={17} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navCircleBtn, isFavorite && { backgroundColor: '#FFFFFF' }]}
                onPress={() => toggleFavorite(listing.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={18}
                  color={isFavorite ? '#EF4444' : '#FFFFFF'}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Trade Mode Pill */}
          {isSold ? (
            <View style={[styles.swapBadge, { backgroundColor: '#64748B' }]}>
              <Ionicons name="lock-closed" size={12} color="#FFFFFF" />
              <Text style={[styles.swapBadgeText, { color: '#FFFFFF' }]}>SOLD</Text>
            </View>
          ) : listing.tradeMode === 'swap' ? (
            <View style={styles.swapBadge}>
              <Ionicons name="repeat" size={12} color="#FFC72C" />
              <Text style={styles.swapBadgeText}>SWAP OFFER</Text>
            </View>
          ) : listing.tradeMode === 'free_donation' ? (
            <View style={styles.freeBadge}>
              <Ionicons name="gift" size={12} color="#FFFFFF" />
              <Text style={styles.freeBadgeText}>FREE DONATION</Text>
            </View>
          ) : null}
        </View>

        {/* 2. Main Content Details */}
        <View style={styles.body}>
          {/* Price & Savings */}
          <View style={styles.priceRow}>
            {listing.tradeMode === 'free_donation' || listing.tradeMode === 'FREE' ? (
              <Text style={styles.freePriceText}>FREE DONATION</Text>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Text style={styles.priceText}>₱{listing.price.toLocaleString()}</Text>
                {(listing.originalSrp || listing.originalPrice || 0) > listing.price && (
                  <Text style={styles.srpText}>
                    ₱{(listing.originalSrp || listing.originalPrice || 0).toLocaleString()}
                  </Text>
                )}
              </View>
            )}

            {savingsPct > 0 && (
              <View style={styles.savingsTag}>
                <Text style={styles.savingsTagText}>{savingsPct}% Campus Savings</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={styles.title}>{listing.title}</Text>

          {/* Relative Time & Engagement Counter */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Ionicons name="time-outline" size={13} color="#64748B" />
              <Text style={{ fontSize: 11, color: '#64748B' }}>
                {listing.createdAt ? `Posted ${formatRelativeTime(listing.createdAt)}` : 'Recently listed'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="eye-outline" size={12} color="#64748B" />
                <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600' }}>{listing.views || 0} views</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="heart" size={12} color="#EF4444" />
                <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '700' }}>{listing.favoritesCount || 0} saved</Text>
              </View>
            </View>
          </View>

          {/* Tags & Metadata */}
          <View style={styles.metaBadges}>
            <View style={styles.badgeItem}>
              <Ionicons name="location-outline" size={13} color="#002B7F" />
              <Text style={styles.badgeText}>{listing.sellerCampus || listing.campus || 'UC Campus'}</Text>
            </View>
            <View style={styles.badgeItem}>
              <Ionicons name="sparkles-outline" size={13} color="#059669" />
              <Text style={styles.badgeText}>{listing.condition}</Text>
            </View>
            <View style={styles.badgeItem}>
              <Ionicons name="pricetag-outline" size={13} color="#64748B" />
              <Text style={styles.badgeText}>{listing.category}</Text>
            </View>
            {listing.courseCode && (
              <View style={[styles.badgeItem, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="book-outline" size={13} color="#B45309" />
                <Text style={[styles.badgeText, { color: '#B45309' }]}>{listing.courseCode}</Text>
              </View>
            )}
          </View>

          {/* Swap Preference Note */}
          {listing.tradeMode === 'swap' && listing.swapPreference && (
            <View style={styles.swapNoteBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="repeat" size={16} color="#002B7F" />
                <Text style={styles.swapNoteTitle}>Seller's Preferred Swap Exchange:</Text>
              </View>
              <Text style={styles.swapNoteDesc}>{listing.swapPreference}</Text>
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Description & Inclusions</Text>
            <Text style={styles.descText}>{listing.description}</Text>
          </View>

          {/* Guarded Meetup Spot */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Preferred Campus Meetup Hub</Text>
            <View style={styles.meetupBox}>
              <Ionicons name="shield-checkmark" size={20} color="#059669" />
              <View style={{ flex: 1 }}>
                <Text style={styles.meetupTitle}>
                  {listing.customMeetupSpot || (listing.preferredMeetupSpots && listing.preferredMeetupSpots[0]) || 'UC Guarded Station'}
                </Text>
                <Text style={styles.meetupSub}>
                  Monitored area with CCTV & campus security officers
                </Text>
              </View>
            </View>
          </View>

          {/* Verified Seller Profile Card */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Seller Information</Text>
            <View style={styles.sellerCard}>
              <Image source={{ uri: listing.sellerAvatar }} style={styles.sellerLargeAvatar} />
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.sellerLargeName}>{listing.sellerName}</Text>
                  {listing.sellerIsVerified && <VerifiedBadge size="sm" />}
                </View>
                <Text style={styles.sellerCollegeText}>
                  {listing.sellerCampus} • College of {listing.sellerCollege}
                </Text>
                <View style={{ marginTop: 4, gap: 4 }}>
                  <View style={styles.trustScoreRow}>
                    <View style={styles.scorePill}>
                      <Ionicons name="shield" size={11} color="#002B7F" />
                      <Text style={styles.scorePillText}>{listing.sellerTrustScore}% Trust Score</Text>
                    </View>
                  </View>
                  <View style={{ height: 5, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                    <View style={{ width: `${Math.min(100, Math.max(15, listing.sellerTrustScore || 90))}%`, height: '100%', backgroundColor: (listing.sellerTrustScore || 90) >= 80 ? '#059669' : '#D97706', borderRadius: 3 }} />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.chatIconBtn}
          onPress={() => router.push('/messages')}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={20} color="#002B7F" />
          <Text style={styles.chatIconText}>Chat</Text>
        </TouchableOpacity>

        {isSold ? (
          <View style={[styles.actionMainBtn, { backgroundColor: '#94A3B8' }]}>
            <Ionicons name="lock-closed" size={18} color="#FFFFFF" />
            <Text style={styles.actionMainBtnText}>Sold / Trade Completed</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.actionMainBtn} onPress={handleAction} activeOpacity={0.85}>
            {listing.tradeMode === 'swap' ? (
              <>
                <Ionicons name="repeat" size={18} color="#FFC72C" />
                <Text style={styles.actionMainBtnText}>Propose Swap</Text>
              </>
            ) : listing.tradeMode === 'free_donation' ? (
              <>
                <Ionicons name="gift" size={18} color="#FFFFFF" />
                <Text style={styles.actionMainBtnText}>Claim Free Item</Text>
              </>
            ) : (
              <>
                <Ionicons name="bag-check" size={18} color="#FFFFFF" />
                <Text style={styles.actionMainBtnText}>Buy Now • ₱{listing.price.toLocaleString()}</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  carouselContainer: {
    width: SCREEN_WIDTH,
    height: 280,
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  carouselImage: {
    width: SCREEN_WIDTH,
    height: 280,
  },
  paginationDots: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  dotActive: {
    backgroundColor: '#FFC72C',
    width: 16,
  },
  topNavOverlay: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },
  navCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navRightButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  swapBadge: {
    position: 'absolute',
    top: 62,
    left: 14,
    backgroundColor: '#002B7F',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  swapBadgeText: {
    color: '#FFC72C',
    fontSize: 10,
    fontWeight: '800',
  },
  freeBadge: {
    position: 'absolute',
    top: 62,
    left: 14,
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  freeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  body: {
    padding: 16,
    gap: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#002B7F',
  },
  srpText: {
    fontSize: 14,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  freePriceText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#059669',
  },
  savingsTag: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  savingsTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 24,
  },
  metaBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  swapNoteBox: {
    backgroundColor: '#EBF1FC',
    borderWidth: 1,
    borderColor: '#BCD1F7',
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  swapNoteTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#002B7F',
  },
  swapNoteDesc: {
    fontSize: 12,
    color: '#334155',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  descText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  meetupBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  meetupTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  meetupSub: {
    fontSize: 10,
    color: '#047857',
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
  },
  sellerLargeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  sellerLargeName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  sellerCollegeText: {
    fontSize: 11,
    color: '#64748B',
  },
  trustScoreRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EBF1FC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  scorePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#002B7F',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  chatIconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chatIconText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#002B7F',
  },
  actionMainBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#002B7F',
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionMainBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  notFoundSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  backBtn: {
    backgroundColor: '#002B7F',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

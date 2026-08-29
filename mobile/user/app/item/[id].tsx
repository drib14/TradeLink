import React, { useState } from 'react';
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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMarket } from '../../context/MarketContext';
import { useAuth } from '../../context/AuthContext';
import { VerifiedBadge } from '../../components/VerifiedBadge';

import { mobileListingsService } from '../../services/listings.service';
import { Listing } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { listings, favorites, toggleFavorite } = useMarket();
  const { currentUser } = useAuth();

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

  if (!listing && !loadingItem) {
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

  if (!listing && loadingItem) {
    return (
      <SafeAreaView style={styles.notFoundContainer}>
        <Text style={styles.notFoundSub}>Loading listing details...</Text>
      </SafeAreaView>
    );
  }

  const isFavorite = favorites.includes(listing.id);
  const savingsPct =
    listing.originalSrp && listing.price < listing.originalSrp
      ? Math.round(((listing.originalSrp - listing.price) / listing.originalSrp) * 100)
      : 0;

  const handleAction = () => {
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

          {/* Trade Mode Pill */}
          {listing.tradeMode === 'swap' ? (
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

          {/* Favorite Button */}
          <TouchableOpacity
            style={[styles.favoriteFab, isFavorite && styles.favoriteFabActive]}
            onPress={() => toggleFavorite(listing.id)}
          >
            <Ionicons
              name={isFavorite ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={isFavorite ? '#FFC72C' : '#0F172A'}
            />
          </TouchableOpacity>
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
                <View style={styles.trustScoreRow}>
                  <View style={styles.scorePill}>
                    <Ionicons name="shield" size={11} color="#002B7F" />
                    <Text style={styles.scorePillText}>{listing.sellerTrustScore}% Trust Score</Text>
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
  swapBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
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
    top: 16,
    left: 16,
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
  favoriteFab: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  favoriteFabActive: {
    backgroundColor: '#002B7F',
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

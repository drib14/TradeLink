import React, { useState, useEffect, useRef } from 'react';
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
import { mobileTransactionsService } from '../../services/transactions.service';
import { mobileSwapsService } from '../../services/swaps.service';
import { aiService, SafeMeetupSuggestion } from '../../services/ai.service';
import { Listing, ListingVariation } from '../../types';

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

  const carouselRef = useRef<ScrollView>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null);
  const [asyncListing, setAsyncListing] = useState<Listing | null>(null);
  const [loadingItem, setLoadingItem] = useState(false);
  const [safeMeetupModal, setSafeMeetupModal] = useState<SafeMeetupSuggestion | null>(null);
  const [loadingSafety, setLoadingSafety] = useState(false);

  const listing = listings.find((l) => l.id === id) || asyncListing;

  const variations = listing?.variations || [];
  const selectedVariation = variations.find((v) => v.id === selectedVariationId) || variations[0] || null;

  useEffect(() => {
    if (listing?.variations && listing.variations.length > 0 && !selectedVariationId) {
      setSelectedVariationId(listing.variations[0].id);
    }
  }, [listing?.variations, selectedVariationId]);

  const handleSelectVariation = (v: ListingVariation) => {
    setSelectedVariationId(v.id);
    if (typeof v.imageIndex === 'number' && v.imageIndex >= 0 && listing && v.imageIndex < listing.images.length) {
      setActiveImageIndex(v.imageIndex);
      carouselRef.current?.scrollTo({ x: v.imageIndex * SCREEN_WIDTH, animated: true });
    }
  };

  const activePrice = (selectedVariation?.price !== undefined && selectedVariation.price !== null)
    ? selectedVariation.price
    : (listing?.price || 0);

  const handleCheckSafeMeetup = async () => {
    if (safeMeetupModal) {
      setSafeMeetupModal(null);
      return;
    }
    setLoadingSafety(true);
    try {
      const res = await aiService.suggestSafeMeetup({
        buyerCampus: currentUser?.campus || 'UC Main',
        sellerCampus: listing?.sellerCampus || listing?.campus || 'UC Main',
        proposedTime: 'Daytime',
      });
      setSafeMeetupModal(res);
    } catch {
      Alert.alert('Campus Safety Tip', 'Always conduct handshakes during daylight hours at guarded main lobby checkpoints.');
    } finally {
      setLoadingSafety(false);
    }
  };

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

  const handleAction = async () => {
    if (!currentUser) {
      openAuthModal();
      return;
    }

    const sellerId = listing.seller?.id || listing.sellerId;
    if (sellerId === currentUser.id) {
      Alert.alert('Your Listing', 'You cannot purchase or swap for your own item.');
      return;
    }

    if (isSold) {
      Alert.alert('Item Sold', 'This item has already been purchased or completed.');
      return;
    }

    if (listing.tradeMode === 'swap') {
      const promptTitle = selectedVariation
        ? `Propose a peer-to-peer swap for "${listing.title}" (Option: ${selectedVariation.title}) with ${listing.sellerName}?`
        : `Propose a peer-to-peer swap for "${listing.title}" with ${listing.sellerName}?`;

      Alert.alert(
        'Propose Barter Swap',
        promptTitle,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Submit Proposal',
            onPress: async () => {
              try {
                await mobileSwapsService.proposeSwap({
                  targetListingId: listing.id,
                  offeredDescription: selectedVariation
                    ? `Swap proposed for ${listing.title} (Option: ${selectedVariation.title}) on campus.`
                    : `Swap proposed for ${listing.title} on campus.`,
                  cashTopUp: 0,
                  selectedVariation: selectedVariation?.title,
                });
                Alert.alert('Swap Proposed!', 'Your swap proposal has been sent to the seller. You can coordinate details in Messages.');
              } catch (err: any) {
                Alert.alert('Swap Error', err.message || 'Could not submit swap proposal.');
              }
            },
          },
        ]
      );
    } else if (listing.tradeMode === 'free_donation') {
      Alert.alert(
        'Claim Free Donation',
        `Claim "${listing.title}" donated by ${listing.sellerName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Claim Item',
            onPress: async () => {
              try {
                const res = await mobileTransactionsService.createTransaction({
                  listingId: listing.id,
                  sellerId,
                  amount: 0,
                  paymentMethod: 'free',
                  notes: 'Free donation claimed on TradeLink Mobile.',
                });
                const code = res?.handshakeCode;
                Alert.alert(
                  'Item Claimed!',
                  `Reference: ${res?.transaction?.referenceNo || 'Pending'}${code ? `\nHandshake Code: [ ${code} ]` : ''}\n\nCoordinate with the student in Messages to schedule handover.`
                );
              } catch (err: any) {
                Alert.alert('Claim Error', err.message || 'Could not claim free item.');
              }
            },
          },
        ]
      );
    } else {
      const promptTitle = selectedVariation
        ? `Proceed to purchase "${listing.title}" (${selectedVariation.title}) for ₱${activePrice.toLocaleString()} via Cash on Meetup?`
        : `Proceed to purchase "${listing.title}" for ₱${activePrice.toLocaleString()} via Cash on Meetup?`;

      Alert.alert(
        'Confirm Campus Order',
        promptTitle,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Place Order',
            onPress: async () => {
              try {
                const res = await mobileTransactionsService.createTransaction({
                  listingId: listing.id,
                  sellerId,
                  amount: activePrice,
                  paymentMethod: 'cash',
                  notes: selectedVariation
                    ? `Option: ${selectedVariation.title}. Cash on Meetup scheduled via TradeLink Mobile.`
                    : 'Cash on Meetup scheduled via TradeLink Mobile.',
                  selectedVariation: selectedVariation?.title,
                  variationId: selectedVariation?.id,
                });
                const code = res?.handshakeCode;
                Alert.alert(
                  'Order Confirmed!',
                  `Reference: ${res?.transaction?.referenceNo || 'Pending'}${code ? `\n\nVERIFICATION HANDSHAKE CODE:\n[ ${code} ]\n\nGive this 4-digit code to the seller only during your meetup after inspection.` : ''}`
                );
              } catch (err: any) {
                Alert.alert('Order Error', err.message || 'Could not place order.');
              }
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
            ref={carouselRef}
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
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                <Text style={styles.priceText}>₱{activePrice.toLocaleString()}</Text>
                {(listing.originalSrp || listing.originalPrice || 0) > activePrice && (
                  <Text style={styles.srpText}>
                    ₱{(listing.originalSrp || listing.originalPrice || 0).toLocaleString()}
                  </Text>
                )}
                {selectedVariation && (
                  <View style={styles.selectedVariationBadge}>
                    <Text style={styles.selectedVariationBadgeText}>{selectedVariation.title}</Text>
                  </View>
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

          {/* Item Variations Selector (Match of Image) */}
          {variations.length > 0 && (
            <View style={styles.variationsSection}>
              <View style={styles.variationsHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="albums" size={15} color="#002B7F" />
                  <Text style={styles.variationsTitle}>Available Options / Books</Text>
                </View>
                <Text style={styles.variationsSubtitle}>Tap to match photo</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.variationPillsList}>
                {variations.map((v) => {
                  const isSelected = selectedVariation?.id === v.id;
                  const vImg = v.imageUrl || (typeof v.imageIndex === 'number' && listing.images[v.imageIndex]);
                  return (
                    <TouchableOpacity
                      key={v.id}
                      style={[styles.variationPill, isSelected && styles.variationPillActive]}
                      onPress={() => handleSelectVariation(v)}
                      activeOpacity={0.8}
                    >
                      {vImg ? (
                        <Image source={{ uri: vImg }} style={styles.variationPillImg} />
                      ) : (
                        <Ionicons
                          name="book-outline"
                          size={14}
                          color={isSelected ? '#002B7F' : '#64748B'}
                          style={{ marginRight: 4 }}
                        />
                      )}
                      <View>
                        <Text style={[styles.variationPillText, isSelected && styles.variationPillTextActive]}>
                          {v.title}
                        </Text>
                        {v.price !== undefined && v.price !== null && (
                          <Text style={[styles.variationPillPrice, isSelected && styles.variationPillPriceActive]}>
                            ₱{v.price.toLocaleString()}
                          </Text>
                        )}
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={15} color="#002B7F" style={{ marginLeft: 6 }} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

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

            <TouchableOpacity
              onPress={handleCheckSafeMeetup}
              disabled={loadingSafety}
              style={{
                marginTop: 8,
                paddingVertical: 7,
                paddingHorizontal: 12,
                backgroundColor: '#F8FAFC',
                borderRadius: 8,
                alignSelf: 'flex-start',
                borderWidth: 1,
                borderColor: '#E2E8F0',
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#002B7F' }}>
                {loadingSafety ? 'Loading Safe Hubs...' : safeMeetupModal ? 'Hide Safety Advice' : 'Campus Safety & Safe Hubs (AI)'}
              </Text>
            </TouchableOpacity>

            {safeMeetupModal && (
              <View style={{ marginTop: 10, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#002B7F', marginBottom: 4 }}>
                  Verified UC Exchange Zones
                </Text>
                {safeMeetupModal.recommended_locations?.map((loc, idx) => (
                  <View key={idx} style={{ marginTop: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#1E293B' }}>
                      • {loc.name} ({loc.campus})
                    </Text>
                    <Text style={{ fontSize: 10, color: '#64748B', marginLeft: 8 }}>
                      {loc.landmark} — Best: {loc.best_hours}
                    </Text>
                  </View>
                ))}
                {safeMeetupModal.time_assessment?.advice && (
                  <Text style={{ fontSize: 10, color: '#059669', fontWeight: '600', marginTop: 8 }}>
                    {safeMeetupModal.time_assessment.advice}
                  </Text>
                )}
              </View>
            )}
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
                <Text style={styles.actionMainBtnText}>Buy Now • ₱{activePrice.toLocaleString()}</Text>
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
  selectedVariationBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 4,
  },
  selectedVariationBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#002B7F',
  },
  variationsSection: {
    marginTop: 14,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  variationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  variationsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  variationsSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  variationPillsList: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 10,
  },
  variationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  variationPillActive: {
    borderColor: '#002B7F',
    backgroundColor: '#EFF6FF',
  },
  variationPillImg: {
    width: 28,
    height: 28,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: '#F1F5F9',
  },
  variationPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  variationPillTextActive: {
    color: '#002B7F',
  },
  variationPillPrice: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  variationPillPriceActive: {
    color: '#002B7F',
  },
});

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Listing } from '../types';
import { useMarket } from '../context/MarketContext';
import { useAuth } from '../context/AuthContext';
import { VerifiedBadge } from './VerifiedBadge';

const { width } = Dimensions.get('window');

interface ListingCardProps {
  listing: Listing;
  widthPercent?: number;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  const { isFavorite, toggleFavorite } = useMarket();
  const { currentUser, openAuthModal } = useAuth();
  const fav = isFavorite(listing.id);

  const rawMode = (listing.tradeMode || '').toLowerCase();
  const isFree = rawMode === 'free' || rawMode === 'free_donation';
  const isSwap = rawMode === 'swap' || rawMode === 'barter';
  const isSold = listing.isSold || listing.status === 'sold';
  const isNew = !isSold && Boolean(listing.createdAt) && (Date.now() - new Date(listing.createdAt).getTime() < 24 * 60 * 60 * 1000);

  const discountPercent =
    listing.originalPrice && listing.price < listing.originalPrice
      ? Math.round(((listing.originalPrice - listing.price) / listing.originalPrice) * 100)
      : null;

  const handleFavoritePress = (e: any) => {
    e.stopPropagation?.();
    if (!currentUser) {
      openAuthModal();
    } else {
      toggleFavorite(listing.id);
    }
  };

  const getTradeModeLabel = () => {
    if (isSold) return 'SOLD';
    if (isSwap) return 'SWAP';
    if (isFree) return 'FREE';
    return 'FOR SALE';
  };

  const getTradeModeStyle = () => {
    if (isSold) return { bg: '#64748B', text: '#FFFFFF' };
    if (isSwap) return { bg: '#8B5CF6', text: '#FFFFFF' };
    if (isFree) return { bg: '#10B981', text: '#FFFFFF' };
    return { bg: '#002B7F', text: '#FFFFFF' };
  };

  const tradeStyle = getTradeModeStyle();
  const cardWidth = (width - 32) / 2;

  return (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth }, isSold && { opacity: 0.75 }]}
      activeOpacity={0.88}
      onPress={() => router.push(`/item/${listing.id}`)}
    >
      {/* 1. Image Container & Overlay Badges */}
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri:
              listing.images?.[0] ||
              'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80',
          }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Trade Mode Pill */}
        <View style={[styles.tradeModeBadge, { backgroundColor: tradeStyle.bg }]}>
          <Text style={[styles.tradeModeText, { color: tradeStyle.text }]}>
            {getTradeModeLabel()}
          </Text>
        </View>

        {/* New Badge */}
        {isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newText}>NEW</Text>
          </View>
        )}

        {/* Savings Pill */}
        {!isNew && discountPercent && discountPercent > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discountPercent}%</Text>
          </View>
        )}

        {/* Condition Tag */}
        <View style={styles.conditionBadge}>
          <Text style={styles.conditionText}>{listing.condition}</Text>
        </View>

        {/* Favorite Heart Button */}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleFavoritePress}
          activeOpacity={0.7}
        >
          <Ionicons
            name={fav ? 'heart' : 'heart-outline'}
            size={18}
            color={fav ? '#EF4444' : '#FFFFFF'}
          />
        </TouchableOpacity>
      </View>

      {/* 2. Content Info */}
      <View style={styles.content}>
        {/* Category Tag */}
        <Text style={styles.categoryText} numberOfLines={1}>
          {listing.category}
        </Text>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {listing.title}
        </Text>

        {/* Price & Savings Row */}
        <View style={styles.priceRow}>
          {isFree ? (
            <Text style={styles.freePrice}>₱0.00 (FREE)</Text>
          ) : isSwap ? (
            <Text style={styles.swapPrice}>Item Barter</Text>
          ) : (
            <View style={styles.priceGroup}>
              <Text style={styles.price}>₱{listing.price.toLocaleString()}</Text>
              {(listing.originalPrice || listing.originalSrp) && (
                <Text style={styles.originalPrice}>
                  ₱{(listing.originalPrice || listing.originalSrp || 0).toLocaleString()}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Campus Location */}
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color="#64748B" />
          <Text style={styles.locationText} numberOfLines={1}>
            {listing.campus || listing.sellerCampus || 'UC Campus'}
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Seller Info */}
        <View style={styles.sellerRow}>
          <View style={styles.sellerInfo}>
            <Image
              source={{
                uri:
                  listing.seller?.avatar ||
                  listing.sellerAvatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
              }}
              style={styles.sellerAvatar}
            />
            <Text style={styles.sellerName} numberOfLines={1}>
              {(listing.seller?.name || listing.sellerName || 'Student').split(' ')[0]}
            </Text>
            {(listing.seller?.isVerified ?? listing.sellerIsVerified) && <VerifiedBadge size="sm" />}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={styles.viewsRow}>
              <Ionicons name="eye-outline" size={11} color="#94A3B8" />
              <Text style={styles.viewsText}>{listing.views || 0}</Text>
            </View>
            {(listing.favoritesCount || 0) > 0 && (
              <View style={styles.viewsRow}>
                <Ionicons name="heart" size={10} color="#EF4444" />
                <Text style={[styles.viewsText, { color: '#EF4444' }]}>
                  {listing.favoritesCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    shadowColor: '#002B7F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  tradeModeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tradeModeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    right: 38,
    backgroundColor: '#FFC72C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#002B7F',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 36,
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  conditionBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  conditionText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  favoriteButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 10,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 17,
    minHeight: 34,
  },
  priceRow: {
    marginTop: 6,
    marginBottom: 4,
  },
  priceGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  price: {
    fontSize: 15,
    fontWeight: '900',
    color: '#002B7F',
  },
  originalPrice: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  freePrice: {
    fontSize: 13,
    fontWeight: '900',
    color: '#059669',
  },
  swapPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7C3AED',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 8,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  sellerAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  sellerName: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    maxWidth: 70,
  },
  viewsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewsText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
});

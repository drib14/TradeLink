import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const SkeletonBox: React.FC<{
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}> = ({ width: w = '100%', height = 16, borderRadius = 8, style }) => {
  const shimmerAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [shimmerAnim]);

  return (
    <Animated.View
      style={[
        styles.skeletonBase,
        {
          width: w as any,
          height,
          borderRadius,
          opacity: shimmerAnim,
        },
        style,
      ]}
    />
  );
};

export const SkeletonCard: React.FC = () => {
  const cardWidth = (width - 36) / 2;
  return (
    <View style={[styles.cardContainer, { width: cardWidth }]}>
      <SkeletonBox width="100%" height={140} borderRadius={14} />
      <View style={{ padding: 10, gap: 6 }}>
        <SkeletonBox width="60%" height={12} borderRadius={4} />
        <SkeletonBox width="90%" height={14} borderRadius={4} />
        <SkeletonBox width="50%" height={18} borderRadius={4} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <SkeletonBox width={20} height={20} borderRadius={10} />
          <SkeletonBox width="50%" height={10} borderRadius={4} />
        </View>
      </View>
    </View>
  );
};

export const SkeletonFeed: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <View style={styles.feedGrid}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
};

export const SkeletonBanner: React.FC = () => {
  return (
    <View style={styles.bannerContainer}>
      <SkeletonBox width="100%" height={210} borderRadius={18} />
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonBase: {
    backgroundColor: '#E2E8F0',
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 12,
  },
  feedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  bannerContainer: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});

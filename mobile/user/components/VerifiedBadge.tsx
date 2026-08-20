import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg' | number;
  showLabel?: boolean;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = 'sm',
  showLabel = false,
}) => {
  const iconPixelSize =
    typeof size === 'number'
      ? size
      : size === 'sm'
      ? 13
      : size === 'md'
      ? 16
      : 20;

  if (showLabel) {
    return (
      <View style={styles.pillContainer}>
        <View style={styles.badgeCircle}>
          <Ionicons name="checkmark" size={10} color="#FFFFFF" />
        </View>
        <Text style={styles.pillLabel}>Verified Student</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.iconBadge,
        {
          width: iconPixelSize + 4,
          height: iconPixelSize + 4,
          borderRadius: (iconPixelSize + 4) / 2,
        },
      ]}
    >
      <Ionicons name="checkmark" size={iconPixelSize - 2} color="#FFFFFF" />
    </View>
  );
};

const styles = StyleSheet.create({
  iconBadge: {
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 9999,
    gap: 4,
  },
  badgeCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
    letterSpacing: 0.2,
  },
});

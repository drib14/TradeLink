import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { CATEGORIES } from '../constants';
import { useMarket } from '../context/MarketContext';

interface CategoryChipsProps {
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

export const CategoryChips: React.FC<CategoryChipsProps> = ({
  selectedCategory: propCategory,
  onSelectCategory: propOnSelect,
}) => {
  const market = useMarket();
  const currentCategory = propCategory !== undefined ? propCategory : market.selectedCategory;
  const handleSelect = propOnSelect || market.setSelectedCategory;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {CATEGORIES.map((cat) => {
        const isSelected = currentCategory === cat;
        return (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, isSelected && styles.chipActive]}
            onPress={() => handleSelect(cat)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#002B7F',
    borderColor: '#002B7F',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

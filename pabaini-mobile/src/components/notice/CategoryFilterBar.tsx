import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Pill } from '../ui/Pill';
import { Category } from '../../types';
import { CATEGORIES } from '../../constants/categories';

interface CategoryFilterBarProps {
  selectedCategory: Category | 'all';
  onSelectCategory: (category: Category | 'all') => void;
}

export function CategoryFilterBar({ selectedCategory, onSelectCategory }: CategoryFilterBarProps) {
  const categories = ['all' as const, ...CATEGORIES];
  
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {categories.map((category) => (
          <Pill
            key={category}
            label={category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
            selected={selectedCategory === category}
            onPress={() => onSelectCategory(category)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  scrollContent: {
    gap: 8,
  },
});

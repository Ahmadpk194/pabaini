import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Pill } from '../ui/Pill';
import { Category } from '../../types';
import { CATEGORIES } from '../../constants/categories';
import { useTheme } from '../../context/ThemeContext';

interface CategoryFilterBarProps {
  selectedCategory: Category | 'all';
  onSelectCategory: (category: Category | 'all') => void;
}

export function CategoryFilterBar({ selectedCategory, onSelectCategory }: CategoryFilterBarProps) {
  const { theme } = useTheme();
  const categories = ['all' as const, ...CATEGORIES];
  
  return (
    <View style={[
      styles.container,
      {
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 0.5,
        borderBottomColor: theme.colors.border,
      }
    ]}>
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
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  scrollContent: {
    gap: 8,
  },
});

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface PillProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function Pill({ label, selected = false, onPress }: PillProps) {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.container,
        {
          backgroundColor: selected ? theme.colors.primary : theme.colors.elevated,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: selected ? theme.colors.onPrimary : theme.colors.textSecondary,
            fontWeight: selected ? '500' : 'normal',
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 0,
  },
  text: {
    fontSize: 13,
  },
});

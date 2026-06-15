import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface BadgeProps {
  label: string;
  bgColor?: string;
  textColor?: string;
}

export function Badge({ label, bgColor, textColor }: BadgeProps) {
  const { theme } = useTheme();
  
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bgColor || theme.colors.generalBg,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: textColor || theme.colors.generalText,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});

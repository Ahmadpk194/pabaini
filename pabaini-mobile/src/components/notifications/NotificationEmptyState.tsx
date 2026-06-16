import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export const NotificationEmptyState: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={styles.bellEmoji}>🔔</Text>
      <Text
        style={[
          styles.title,
          {
            color: theme.colors.textPrimary,
            fontSize: theme.typography.sizes.lg,
            fontWeight: theme.typography.weights.bold,
          },
        ]}
      >
        No notifications yet
      </Text>
      <Text
        style={[
          styles.subtitle,
          {
            color: theme.colors.textSecondary,
            fontSize: theme.typography.sizes.sm,
          },
        ]}
      >
        You'll see updates about your teams here
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  bellEmoji: {
    fontSize: 48,
    opacity: 0.4,
    marginBottom: 16,
    textAlign: 'center',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});

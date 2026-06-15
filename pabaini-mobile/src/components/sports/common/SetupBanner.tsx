import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { ArrowRight, Trophy } from 'lucide-react-native';

interface SetupBannerProps {
  onPress: () => void;
}

export function SetupBanner({ onPress }: SetupBannerProps) {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.primary,
          borderRadius: theme.radius.lg,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Trophy color={theme.colors.primary} size={22} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Register as a Player</Text>
          <Text style={styles.subtitle}>
            Set up your Cricket Profile to join matches, record stats, and be discovered by village squads.
          </Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.actionText}>Get Started</Text>
        <ArrowRight color="#FFFFFF" size={16} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    paddingTop: 10,
    gap: 6,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

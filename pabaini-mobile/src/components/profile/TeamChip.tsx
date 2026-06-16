import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ChevronRight } from 'lucide-react-native';
import { getTeamColor } from '../sports/teams/TeamCard';

interface TeamChipProps {
  team: { id: number; name: string; logo_url: string | null };
  subtitle?: string; // e.g. "Captain" or "left Jun 2026"
  muted?: boolean; // true for past teams
  onPress: () => void;
}

export function TeamChip({ team, subtitle, muted = false, onPress }: TeamChipProps) {
  const { theme } = useTheme();
  const initials = team.name ? team.name.charAt(0).toUpperCase() : '?';
  const fallbackBgColor = getTeamColor(team.name);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          opacity: muted ? 0.6 : 1,
        },
      ]}
    >
      {/* Team logo or fallback initials */}
      <View style={styles.logoContainer}>
        {team.logo_url ? (
          <Image source={{ uri: team.logo_url }} style={styles.logoImage} />
        ) : (
          <View style={[styles.logoFallback, { backgroundColor: fallbackBgColor }]}>
            <Text style={styles.logoFallbackText}>{initials}</Text>
          </View>
        )}
      </View>

      {/* Info Container */}
      <View style={styles.info}>
        <Text
          style={[
            styles.name,
            {
              color: theme.colors.textPrimary,
              fontWeight: muted ? '500' : '700',
            },
          ]}
          numberOfLines={1}
        >
          {team.name}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* Chevron indicator */}
      <View style={styles.chevron}>
        <ChevronRight size={18} color={theme.colors.border} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  logoContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  logoFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoFallbackText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    marginLeft: 10,
  },
  name: {
    fontSize: 14,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  chevron: {
    marginLeft: 8,
  },
});

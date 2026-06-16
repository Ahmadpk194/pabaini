import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { TeamSummary, MyTeamResponse } from '../../../types/sports.types';
import { MapPin, ChevronRight, Star } from 'lucide-react-native';

interface TeamCardProps {
  team: TeamSummary | MyTeamResponse;
  showCaptainBadge?: boolean;
  onPress: () => void;
}

// Deterministically generate a theme color from the team name hash
export function getTeamColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    '#1B4332', // Pabaini Deep Green
    '#2D6A4F', // Secondary Green
    '#184E77', // Indigo Blue
    '#5C3D2E', // Deep Bronze
    '#5E2B97', // Purple
    '#8B2635', // Crimson
    '#264653', // Teal
  ];
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export function TeamCard({ team, showCaptainBadge = false, onPress }: TeamCardProps) {
  const { theme } = useTheme();
  
  const initials = team.name ? team.name.charAt(0).toUpperCase() : '?';
  const fallbackBgColor = getTeamColor(team.name);

  // Check if member_count exists, otherwise check if role exists (which indicates joined status)
  const isMyTeam = 'role' in team;
  const subtitleText = isMyTeam 
    ? `${team.role.charAt(0).toUpperCase() + team.role.slice(1).replace('_', ' ')}`
    : `${(team as TeamSummary).member_count || 0} members`;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
        },
      ]}
      onPress={onPress}
    >
      {/* Left: Logo */}
      <View style={styles.logoContainer}>
        {team.logo_url ? (
          <Image source={{ uri: team.logo_url }} style={styles.logoImage} />
        ) : (
          <View style={[styles.logoFallback, { backgroundColor: fallbackBgColor }]}>
            <Text style={styles.logoFallbackText}>{initials}</Text>
          </View>
        )}
      </View>

      {/* Center: Info */}
      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: theme.colors.textPrimary }]} numberOfLines={1}>
            {team.name}
          </Text>
          {showCaptainBadge && (
            <Star size={16} color="#EAA81A" fill="#EAA81A" style={styles.captainStar} />
          )}
        </View>

        {team.home_ground && (
          <View style={styles.groundRow}>
            <MapPin size={12} color={theme.colors.textSecondary} />
            <Text style={[styles.groundText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {team.home_ground}
            </Text>
          </View>
        )}

        <Text style={[styles.membersText, { color: theme.colors.textSecondary }]}>
          {subtitleText}
        </Text>
      </View>

      {/* Right: Chevron */}
      <View style={styles.chevronContainer}>
        <ChevronRight size={20} color={theme.colors.border} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 16,
    borderWidth: 1,
    marginBottom: 10,
    alignItems: 'center',
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    fontSize: 20,
    fontWeight: '700',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    maxWidth: '90%',
  },
  captainStar: {
    marginLeft: 6,
  },
  groundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  groundText: {
    fontSize: 13,
  },
  membersText: {
    fontSize: 13,
    marginTop: 2,
  },
  chevronContainer: {
    marginLeft: 8,
  },
});

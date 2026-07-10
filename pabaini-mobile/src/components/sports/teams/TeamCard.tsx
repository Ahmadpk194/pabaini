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
  const { theme, mode } = useTheme();
  
  const initials = team.name ? team.name.charAt(0).toUpperCase() : '?';
  const fallbackBgColor = getTeamColor(team.name);

  // Check if member_count exists, otherwise check if role exists (which indicates joined status)
  const isMyTeam = 'role' in team;
  const myTeam = team as MyTeamResponse;

  const playersCount = team.member_count ?? 0;
  const matchesCount = isMyTeam ? (myTeam.matches_count ?? 0) : 0;
  const winsCount = isMyTeam ? (myTeam.wins_count ?? 0) : 0;

  // Premium, subtle role badge styles
  const getRoleBadgeStyle = (role: string) => {
    const isDark = mode === 'dark';
    switch (role.toLowerCase()) {
      case 'captain':
        return {
          text: 'Captain',
          color: isDark ? '#81C784' : '#1B4332',
          bg: isDark ? 'rgba(129, 199, 132, 0.15)' : 'rgba(27, 67, 50, 0.08)',
        };
      case 'vice_captain':
        return {
          text: 'Vice Captain',
          color: isDark ? '#64B5F6' : '#184E77',
          bg: isDark ? 'rgba(100, 181, 246, 0.15)' : 'rgba(24, 78, 119, 0.08)',
        };
      default:
        return {
          text: 'Player',
          color: theme.colors.textSecondary,
          bg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
        };
    }
  };

  const roleStyle = isMyTeam ? getRoleBadgeStyle(team.role) : null;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          paddingVertical: isMyTeam ? 12 : 10,
          paddingHorizontal: 12,
        },
      ]}
      onPress={onPress}
    >
      {/* Left: Logo */}
      <View style={[styles.logoContainer, { width: isMyTeam ? 44 : 40, height: isMyTeam ? 44 : 40, borderRadius: isMyTeam ? 22 : 20 }]}>
        {team.logo_url ? (
          <Image source={{ uri: team.logo_url }} style={styles.logoImage} />
        ) : (
          <View style={[styles.logoFallback, { backgroundColor: fallbackBgColor }]}>
            <Text style={[styles.logoFallbackText, { fontSize: isMyTeam ? 18 : 16 }]}>{initials}</Text>
          </View>
        )}
      </View>

      {/* Center: Info */}
      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: theme.colors.textPrimary, fontSize: isMyTeam ? 15 : 14 }]} numberOfLines={1}>
            {team.name}
          </Text>
          {roleStyle && (
            <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg }]}>
              <Text style={[styles.roleBadgeText, { color: roleStyle.color }]}>{roleStyle.text}</Text>
            </View>
          )}
        </View>

        {team.home_ground && (
          <View style={styles.groundRow}>
            <MapPin size={11} color={theme.colors.textSecondary} />
            <Text style={[styles.groundText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {team.home_ground}
            </Text>
          </View>
        )}

        {isMyTeam ? (
          <View style={[styles.statsRow, { borderTopColor: theme.colors.border }]}>
            <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
              👥 {playersCount} Players
            </Text>
            <Text style={[styles.statDivider, { color: theme.colors.border }]}>•</Text>
            <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
              🏏 {matchesCount} Matches
            </Text>
            <Text style={[styles.statDivider, { color: theme.colors.border }]}>•</Text>
            <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
              🏆 {winsCount} Wins
            </Text>
          </View>
        ) : (
          <Text style={[styles.membersText, { color: theme.colors.textSecondary }]}>
            👥 {playersCount} Players
          </Text>
        )}
      </View>

      {/* Right: Chevron */}
      <View style={styles.chevronContainer}>
        <ChevronRight size={18} color={theme.colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 12,
    borderWidth: 1,
    marginBottom: 10,
    alignItems: 'center',
  },
  logoContainer: {
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
    fontWeight: '700',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 2,
  },
  name: {
    fontWeight: '700',
    maxWidth: '70%',
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  groundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  groundText: {
    fontSize: 12,
  },
  membersText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    borderTopWidth: 0.5,
    paddingTop: 6,
    flexWrap: 'wrap',
  },
  statText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  statDivider: {
    marginHorizontal: 6,
    fontSize: 10,
  },
  chevronContainer: {
    marginLeft: 6,
  },
});

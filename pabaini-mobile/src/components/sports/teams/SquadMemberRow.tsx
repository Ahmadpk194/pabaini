import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { TeamMember } from '../../../types/sports.types';
import { Avatar } from '../../ui/Avatar';
import { Star, Award } from 'lucide-react-native';

interface SquadMemberRowProps {
  member: TeamMember;
  rightContent?: React.ReactNode;
}

const ROLE_LABELS: Record<string, string> = {
  batsman: 'Batsman',
  bowler: 'Bowler',
  allrounder: 'All-rounder',
  keeper: 'Wicket-keeper',
};

export function SquadMemberRow({ member, rightContent }: SquadMemberRowProps) {
  const { theme } = useTheme();
  const { role, player } = member;

  const isCaptain = role === 'captain';
  const isViceCaptain = role === 'vice_captain';

  const battingText = `${player.batting_hand === 'right' ? 'RHB' : 'LHB'}`;
  let bowlingText = '';
  if (player.bowling_arm && player.bowling_arm !== 'none' && player.bowling_type && player.bowling_type !== 'none') {
    bowlingText = ` • ${player.bowling_arm === 'right' ? 'R' : 'L'}-${player.bowling_type}`;
  }

  const stylesText = `${ROLE_LABELS[player.role]} • ${battingText}${bowlingText}`;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
        },
      ]}
    >
      {/* Left: Avatar */}
      <Avatar uri={player.user.avatar_url} size={44} name={player.user.name} />

      {/* Center: Info */}
      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: theme.colors.textPrimary }]} numberOfLines={1}>
            {player.user.name}
          </Text>
          {isCaptain && (
            <View style={[styles.badge, { backgroundColor: '#FDF2E2' }]}>
              <Star size={11} color="#EAA81A" fill="#EAA81A" />
              <Text style={[styles.badgeText, { color: '#B27600' }]}>CAPT</Text>
            </View>
          )}
          {isViceCaptain && (
            <View style={[styles.badge, { backgroundColor: '#E1F5EE' }]}>
              <Award size={11} color="#04342C" />
              <Text style={[styles.badgeText, { color: '#04342C' }]}>VC</Text>
            </View>
          )}
        </View>
        <Text style={[styles.stylesText, { color: theme.colors.textSecondary }]}>
          {stylesText}
        </Text>
      </View>

      {/* Right: Custom Action Slot */}
      {rightContent && <View style={styles.rightContent}>{rightContent}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 14,
    borderWidth: 1,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.01,
    shadowRadius: 2,
    elevation: 0.5,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    maxWidth: '65%',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  stylesText: {
    fontSize: 12,
  },
  rightContent: {
    marginLeft: 8,
  },
});

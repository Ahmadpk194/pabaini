import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { TeamMember } from '../../../types/sports.types';
import { Avatar } from '../../ui/Avatar';
import { Check, X } from 'lucide-react-native';

interface PendingMemberRowProps {
  member: TeamMember;
  type: 'request' | 'invite';
  onAccept?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
  loading?: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  batsman: 'Batsman',
  bowler: 'Bowler',
  allrounder: 'All-rounder',
  keeper: 'Wicket-keeper',
};

export function PendingMemberRow({
  member,
  type,
  onAccept,
  onReject,
  onCancel,
  loading = false,
}: PendingMemberRowProps) {
  const { theme } = useTheme();
  const { player } = member;

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
        <Text style={[styles.name, { color: theme.colors.textPrimary }]} numberOfLines={1}>
          {player.user.name}
        </Text>
        <Text style={[styles.stylesText, { color: theme.colors.textSecondary }]}>
          {stylesText}
        </Text>
      </View>

      {/* Right: Actions */}
      <View style={styles.actionsContainer}>
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : type === 'request' ? (
          <View style={styles.buttonRow}>
            {/* Accept Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.circularButton, { backgroundColor: '#E1F5EE', borderColor: '#A7E9D2' }]}
              onPress={onAccept}
            >
              <Check size={16} color="#04342C" />
            </TouchableOpacity>

            {/* Reject Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.circularButton, { backgroundColor: '#FCEBEB', borderColor: '#F7C5C5' }]}
              onPress={onReject}
            >
              <X size={16} color="#791F1F" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity activeOpacity={0.7} onPress={onCancel} style={styles.cancelBtn}>
            <Text style={[styles.cancelBtnText, { color: theme.colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
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
  name: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  stylesText: {
    fontSize: 12,
  },
  actionsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  circularButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

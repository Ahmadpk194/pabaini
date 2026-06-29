import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Award, Users, Trophy, Edit3 } from 'lucide-react-native';
import { CricketProfileBundle } from '../../types/profile.types';
import { TeamChip } from './TeamChip';

interface CricketSectionProps {
  cricket: CricketProfileBundle;
  isOwnProfile: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  batsman: 'Batsman',
  bowler: 'Bowler',
  allrounder: 'All-rounder',
  keeper: 'Wicket-keeper',
};

const ROLE_EMOJIS: Record<string, string> = {
  batsman: '🏏',
  bowler: '⚡',
  allrounder: '🌟',
  keeper: '🧤',
};

export function CricketSection({ cricket, isOwnProfile }: CricketSectionProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const [activeTier, setActiveTier] = useState<'competitive' | 'casual'>('competitive');

  const { player_profile, stats, current_teams, past_teams, trophies } = cricket;
  const currentTierStats = stats[activeTier];

  const battingText = `${player_profile.batting_hand === 'right' ? 'Right' : 'Left'}-hand bat`;
  let bowlingText = 'No Bowling';
  if (
    player_profile.bowling_arm &&
    player_profile.bowling_arm !== 'none' &&
    player_profile.bowling_type &&
    player_profile.bowling_type !== 'none'
  ) {
    const arm = player_profile.bowling_arm === 'right' ? 'Right-arm' : 'Left-arm';
    const bowlType = player_profile.bowling_type.charAt(0).toUpperCase() + player_profile.bowling_type.slice(1);
    bowlingText = `${arm} ${bowlType}`;
  }

  const roleLabel = ROLE_LABELS[player_profile.role] || 'Player';
  const roleEmoji = ROLE_EMOJIS[player_profile.role] || '🏏';

  const battingStatsList = [
    { label: 'MAT', value: currentTierStats.matches },
    { label: 'INN', value: currentTierStats.innings },
    { label: 'RUNS', value: currentTierStats.runs },
    { label: 'HS', value: currentTierStats.highest_score },
    { label: 'AVG', value: typeof currentTierStats.average === 'number' ? currentTierStats.average.toFixed(1) : currentTierStats.average },
    { label: 'SR', value: typeof currentTierStats.strike_rate === 'number' ? currentTierStats.strike_rate.toFixed(1) : currentTierStats.strike_rate },
    { label: '4s', value: currentTierStats.fours },
    { label: '6s', value: currentTierStats.sixes },
  ];

  const bowlingStatsList = [
    { label: 'WKTS', value: currentTierStats.wickets },
    { label: 'ECON', value: typeof currentTierStats.economy === 'number' ? currentTierStats.economy.toFixed(2) : currentTierStats.economy },
    { label: 'BEST', value: currentTierStats.best_bowling || '—' },
    { label: 'MAT', value: currentTierStats.matches },
  ];

  const hasTeams = current_teams.length > 0 || past_teams.length > 0;
  const hasTrophies = trophies && trophies.length > 0;

  return (
    <View style={styles.container}>

      {/* ── Player Identity Card ─────────────────────────── */}
      <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        {/* Card header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Award size={16} color={theme.colors.primary} />
            <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Cricket</Text>
          </View>
          {isOwnProfile && (
            <TouchableOpacity
              onPress={() => router.push('/sports/cricket/onboarding/role')}
              style={[styles.editChip, { borderColor: theme.colors.border }]}
            >
              <Edit3 size={13} color={theme.colors.primary} />
              <Text style={[styles.editChipText, { color: theme.colors.primary }]}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Role pill + style summary */}
        <View style={styles.identityRow}>
          <View style={[styles.rolePill, { backgroundColor: `${theme.colors.primary}12` }]}>
            <Text style={styles.roleEmoji}>{roleEmoji}</Text>
            <Text style={[styles.roleText, { color: theme.colors.primary }]}>{roleLabel}</Text>
          </View>
        </View>

        <View style={[styles.styleDivider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.styleRow}>
          <View style={styles.styleCol}>
            <Text style={styles.styleHeading}>BATTING</Text>
            <Text style={[styles.styleVal, { color: theme.colors.textPrimary }]}>{battingText}</Text>
          </View>
          <View style={[styles.styleColDivider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.styleCol}>
            <Text style={styles.styleHeading}>BOWLING</Text>
            <Text style={[styles.styleVal, { color: theme.colors.textPrimary }]}>{bowlingText}</Text>
          </View>
        </View>
      </View>

      {/* ── Statistics Card ──────────────────────────────── */}
      <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        {/* Stats header with tier toggle */}
        <View style={styles.statsHeader}>
          <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Statistics</Text>
          <View style={[styles.tierToggle, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
            <TouchableOpacity
              onPress={() => setActiveTier('competitive')}
              style={[
                styles.tierBtn,
                activeTier === 'competitive' && [styles.tierBtnActive, { backgroundColor: '#004D26' }],
              ]}
            >
              <Text style={[
                styles.tierBtnText,
                { color: activeTier === 'competitive' ? '#FFFFFF' : theme.colors.textSecondary },
              ]}>
                Competitive
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTier('casual')}
              style={[
                styles.tierBtn,
                activeTier === 'casual' && [styles.tierBtnActive, { backgroundColor: '#004D26' }],
              ]}
            >
              <Text style={[
                styles.tierBtnText,
                { color: activeTier === 'casual' ? '#FFFFFF' : theme.colors.textSecondary },
              ]}>
                Casual
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Batting grid */}
        <Text style={styles.statsTypeLabel}>BATTING</Text>
        <View style={[styles.statsGrid, { borderColor: theme.colors.border }]}>
          {battingStatsList.map((stat, idx) => (
            <View
              key={stat.label}
              style={[
                styles.statCell,
                idx >= 4 && { borderTopWidth: 0.5, borderTopColor: theme.colors.border },
                idx % 4 !== 0 && { borderLeftWidth: 0.5, borderLeftColor: theme.colors.border },
              ]}
            >
              <Text style={styles.statCellLabel}>{stat.label}</Text>
              <Text style={[styles.statCellValue, { color: theme.colors.textPrimary }]}>
                {stat.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Bowling grid */}
        <Text style={[styles.statsTypeLabel, { marginTop: 16 }]}>BOWLING</Text>
        <View style={[styles.statsGrid, { borderColor: theme.colors.border }]}>
          {bowlingStatsList.map((stat, idx) => (
            <View
              key={stat.label}
              style={[
                styles.statCell,
                styles.statCellWide,
                idx % 4 !== 0 && { borderLeftWidth: 0.5, borderLeftColor: theme.colors.border },
              ]}
            >
              <Text style={styles.statCellLabel}>{stat.label}</Text>
              <Text style={[styles.statCellValue, { color: theme.colors.textPrimary }]}>
                {stat.value}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Teams Card ───────────────────────────────────── */}
      <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Users size={16} color={theme.colors.primary} />
            <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Teams</Text>
          </View>
        </View>

        {!hasTeams ? (
          <Text style={[styles.noTeamsText, { color: theme.colors.textSecondary }]}>
            Not in any team currently
          </Text>
        ) : (
          <>
            {current_teams.length > 0 && (
              <>
                <Text style={[styles.teamSubHeading, { color: theme.colors.textSecondary }]}>ACTIVE</Text>
                {current_teams.map((t) => (
                  <TeamChip
                    key={`current-${t.id}`}
                    team={t}
                    subtitle={t.role === 'captain' ? 'Captain' : t.role === 'vice_captain' ? 'Vice Captain' : 'Player'}
                    onPress={() => router.push(`/sports/cricket/teams/${t.id}`)}
                  />
                ))}
              </>
            )}

            {past_teams.length > 0 && (
              <>
                <Text style={[styles.teamSubHeading, { color: theme.colors.textSecondary, marginTop: current_teams.length > 0 ? 14 : 0 }]}>
                  PAST
                </Text>
                {past_teams.map((t) => {
                  const leftDate = t.left_at ? new Date(t.left_at) : null;
                  const subtitle = leftDate && !isNaN(leftDate.getTime())
                    ? `Left ${leftDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`
                    : 'Left team';
                  return (
                    <TeamChip
                      key={`past-${t.id}`}
                      team={t}
                      subtitle={subtitle}
                      muted={true}
                      onPress={() => router.push(`/sports/cricket/teams/${t.id}`)}
                    />
                  );
                })}
              </>
            )}
          </>
        )}
      </View>

      {/* ── Trophies Card ────────────────────────────────── */}
      {hasTrophies && (
        <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Trophy size={16} color="#EAA81A" />
              <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Trophies</Text>
            </View>
          </View>
          {/* Trophy list — future expansion */}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 4,
  },
  sectionCard: {
    borderRadius: 12,
    borderWidth: 0.5,
    marginTop: 12,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    padding: 16,
  },

  // ── Card header ──────────────────────────────────────
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  editChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  editChipText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Player identity ───────────────────────────────────
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleEmoji: {
    fontSize: 16,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  styleDivider: {
    height: 0.5,
    marginBottom: 14,
  },
  styleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  styleCol: {
    flex: 1,
  },
  styleColDivider: {
    width: 0.5,
    marginHorizontal: 16,
    alignSelf: 'stretch',
  },
  styleHeading: {
    fontSize: 10,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  styleVal: {
    fontSize: 14,
    fontWeight: '600',
  },

  // ── Stats ─────────────────────────────────────────────
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tierToggle: {
    flexDirection: 'row',
    borderWidth: 0.5,
    borderRadius: 20,
    padding: 2,
    gap: 2,
  },
  tierBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 18,
  },
  tierBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tierBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statsTypeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 1,
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 0.5,
    borderRadius: 8,
    overflow: 'hidden',
  },
  statCell: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  statCellWide: {
    width: '25%',
  },
  statCellLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#888',
    marginBottom: 3,
    letterSpacing: 0.4,
  },
  statCellValue: {
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Teams ─────────────────────────────────────────────
  teamSubHeading: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  noTeamsText: {
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
});

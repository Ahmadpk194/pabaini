import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Trophy, Award } from 'lucide-react-native';
import { PabainiLogo } from '../../../ui/PabainiLogo';
import { Avatar } from '../../../ui/Avatar';
import { HighlightCardData } from './shareMappers';

interface HighlightCardProps {
  data: HighlightCardData;
}

const CARD_COLORS = {
  bg: '#0F0F0F',
  surface: '#1A1A1A',
  border: '#2A2A2A',
  elevated: '#242424',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  primary: '#16A34A',
  primaryDark: '#166534',
  primaryLight: '#DCFCE7',
  primaryText: '#86EFAC',
  danger: '#EF4444',
  warning: '#F59E0B',
};

/**
 * HighlightCard Component
 *
 * Renders a compact, visually rich dark-mode summary card designed for image export/sharing.
 * Displays match scores, final result, Player of the Match, and top batting/bowling performers.
 *
 * NOTE: Colors are intentionally hardcoded (independent of the active theme) to ensure
 * consistent dark-themed high-contrast rendering when converted into sharing images.
 */
export default function HighlightCard({ data }: HighlightCardProps) {
  return (
    <View style={styles.cardContainer}>
      {/* Green Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <PabainiLogo size={18} color="#FFFFFF" />
          <Text style={styles.headerWordmark}>Pabaini</Text>
        </View>
        <Text style={styles.headerRightText}>MATCH SCORECARD</Text>
      </View>

      {/* Match Title & Details */}
      <View style={styles.matchTitleSection}>
        <Text style={styles.matchTitle}>
          {data.teamAName} <Text style={{ color: CARD_COLORS.textMuted }}>vs</Text> {data.teamBName}
        </Text>
        <Text style={styles.matchMeta}>{data.matchMeta}</Text>
      </View>

      {/* Scores Row */}
      <View style={styles.scoresRow}>
        <View style={styles.scoreBlock}>
          <Text style={styles.teamLabel} numberOfLines={1}>{data.teamAName}</Text>
          <Text style={styles.scoreValue}>{data.teamAScore}</Text>
        </View>
        <View style={styles.vsCircle}>
          <Text style={styles.vsText}>vs</Text>
        </View>
        <View style={styles.scoreBlock}>
          <Text style={styles.teamLabel} numberOfLines={1}>{data.teamBName}</Text>
          <Text style={styles.scoreValue}>{data.teamBScore}</Text>
        </View>
      </View>

      {/* Winner Banner */}
      {data.winnerMessage && (
        <View style={styles.winnerBanner}>
          <Trophy size={14} color="#D4A700" />
          <Text style={styles.winnerBannerText}>{data.winnerMessage}</Text>
        </View>
      )}

      {/* Man of the Match Row */}
      {data.hasManOfMatch && data.momName && (
        <View style={styles.momRow}>
          <Award size={14} color={CARD_COLORS.warning} />
          <Text style={styles.momLabel}>PLAYER OF THE MATCH: </Text>
          <Text style={styles.momName}>{data.momName}</Text>
        </View>
      )}

      {/* Top Performers Divider */}
      <View style={styles.sectionDivider} />

      {/* Top Batting Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeading}>TOP BATTING</Text>
        <View style={styles.performersList}>
          <View style={styles.performerRow}>
            {data.topBatsmanA ? (
              <>
                <Avatar uri={data.topBatsmanA.avatarUrl} size={24} name={data.topBatsmanA.name} />
                <View style={styles.performerDetails}>
                  <Text style={styles.performerName} numberOfLines={1}>{data.topBatsmanA.name}</Text>
                  <Text style={styles.performerTeam} numberOfLines={1}>{data.topBatsmanA.teamName}</Text>
                </View>
                <View style={styles.performerStats}>
                  <Text style={styles.battingRuns}>{data.topBatsmanA.runs}</Text>
                  <Text style={styles.battingBalls}>({data.topBatsmanA.balls})</Text>
                </View>
              </>
            ) : (
              <Text style={styles.placeholderText}>-</Text>
            )}
          </View>

          <View style={styles.performerRow}>
            {data.topBatsmanB ? (
              <>
                <Avatar uri={data.topBatsmanB.avatarUrl} size={24} name={data.topBatsmanB.name} />
                <View style={styles.performerDetails}>
                  <Text style={styles.performerName} numberOfLines={1}>{data.topBatsmanB.name}</Text>
                  <Text style={styles.performerTeam} numberOfLines={1}>{data.topBatsmanB.teamName}</Text>
                </View>
                <View style={styles.performerStats}>
                  <Text style={styles.battingRuns}>{data.topBatsmanB.runs}</Text>
                  <Text style={styles.battingBalls}>({data.topBatsmanB.balls})</Text>
                </View>
              </>
            ) : (
              <Text style={styles.placeholderText}>-</Text>
            )}
          </View>
        </View>
      </View>

      {/* Top Bowling Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeading}>TOP BOWLING</Text>
        <View style={styles.performersList}>
          <View style={styles.performerRow}>
            {data.topBowlerA ? (
              <>
                <Avatar uri={data.topBowlerA.avatarUrl} size={24} name={data.topBowlerA.name} />
                <View style={styles.performerDetails}>
                  <Text style={styles.performerName} numberOfLines={1}>{data.topBowlerA.name}</Text>
                  <Text style={styles.performerTeam} numberOfLines={1}>{data.topBowlerA.teamName}</Text>
                </View>
                <View style={styles.performerStats}>
                  <Text style={styles.bowlingWickets}>{data.topBowlerA.wickets} Wkts</Text>
                  <Text style={styles.bowlingDetails}>
                    {data.topBowlerA.runsGiven} Runs • {data.topBowlerA.overs.toFixed(1)} Ov
                  </Text>
                </View>
              </>
            ) : (
              <Text style={styles.placeholderText}>-</Text>
            )}
          </View>

          <View style={styles.performerRow}>
            {data.topBowlerB ? (
              <>
                <Avatar uri={data.topBowlerB.avatarUrl} size={24} name={data.topBowlerB.name} />
                <View style={styles.performerDetails}>
                  <Text style={styles.performerName} numberOfLines={1}>{data.topBowlerB.name}</Text>
                  <Text style={styles.performerTeam} numberOfLines={1}>{data.topBowlerB.teamName}</Text>
                </View>
                <View style={styles.performerStats}>
                  <Text style={styles.bowlingWickets}>{data.topBowlerB.wickets} Wkts</Text>
                  <Text style={styles.bowlingDetails}>
                    {data.topBowlerB.runsGiven} Runs • {data.topBowlerB.overs.toFixed(1)} Ov
                  </Text>
                </View>
              </>
            ) : (
              <Text style={styles.placeholderText}>-</Text>
            )}
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footerRow}>
        <Text style={styles.footerLeft}>Recorded on Pabaini App</Text>
        <Text style={styles.footerRight}>pabaini.app</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: 360,
    backgroundColor: CARD_COLORS.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CARD_COLORS.border,
    overflow: 'hidden',
  },
  headerBar: {
    height: 32,
    backgroundColor: CARD_COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerWordmark: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  headerRightText: {
    color: '#E5E7EB',
    fontWeight: '600',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  matchTitleSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    alignItems: 'center',
  },
  matchTitle: {
    color: CARD_COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  matchMeta: {
    color: CARD_COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  scoresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginVertical: 10,
  },
  scoreBlock: {
    flex: 1,
    backgroundColor: CARD_COLORS.surface,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: CARD_COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  teamLabel: {
    color: CARD_COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  scoreValue: {
    color: CARD_COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  vsCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: CARD_COLORS.elevated,
    borderWidth: 0.5,
    borderColor: CARD_COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  vsText: {
    color: CARD_COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  winnerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CARD_COLORS.primaryDark,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    marginBottom: 10,
  },
  winnerBannerText: {
    color: CARD_COLORS.primaryText,
    fontSize: 12,
    fontWeight: '700',
  },
  momRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CARD_COLORS.surface,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: CARD_COLORS.border,
    gap: 6,
    marginBottom: 14,
  },
  momLabel: {
    color: CARD_COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '700',
  },
  momName: {
    color: CARD_COLORS.warning,
    fontSize: 11,
    fontWeight: '700',
  },
  sectionDivider: {
    height: 0.5,
    backgroundColor: CARD_COLORS.border,
    marginHorizontal: 16,
    marginBottom: 14,
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeading: {
    color: CARD_COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  performersList: {
    gap: 8,
  },
  performerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_COLORS.surface,
    padding: 8,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: CARD_COLORS.border,
  },
  performerDetails: {
    flex: 1,
    marginLeft: 8,
  },
  performerName: {
    color: CARD_COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  performerTeam: {
    color: CARD_COLORS.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
  performerStats: {
    alignItems: 'flex-end',
  },
  battingRuns: {
    color: CARD_COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  battingBalls: {
    color: CARD_COLORS.textSecondary,
    fontSize: 9,
    marginTop: 1,
  },
  bowlingWickets: {
    color: CARD_COLORS.primaryText,
    fontSize: 12,
    fontWeight: '700',
  },
  bowlingDetails: {
    color: CARD_COLORS.textSecondary,
    fontSize: 9,
    marginTop: 1,
  },
  placeholderText: {
    color: CARD_COLORS.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: CARD_COLORS.surface,
    borderTopWidth: 0.5,
    borderTopColor: CARD_COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  footerLeft: {
    color: CARD_COLORS.textMuted,
    fontSize: 9,
  },
  footerRight: {
    color: CARD_COLORS.primary,
    fontWeight: '600',
    fontSize: 9,
  },
});

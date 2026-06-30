import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Trophy, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PabainiLogo } from '../../../ui/PabainiLogo';
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

interface HighlightAvatarProps {
  uri?: string | null;
  size?: number;
  name?: string;
}

function HighlightAvatar({ uri, size = 24, name }: HighlightAvatarProps) {
  const initials = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#14532D',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            resizeMode: 'cover',
          }}
        />
      ) : (
        <Text
          style={{
            fontSize: size * 0.45,
            color: '#86EFAC',
            fontWeight: '700',
          }}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

const parseScoreAndOvers = (scoreStr: string) => {
  if (!scoreStr) return { score: '0/0', overs: '' };
  const match = scoreStr.match(/^([^\s(]+)(?:\s*\(([^)]+)\))?/);
  if (match) {
    const score = match[1];
    const overs = match[2] ? `${match[2]} ov` : '';
    return { score, overs };
  }
  return { score: scoreStr, overs: '' };
};

/**
 * HighlightCard Component
 *
 * Renders a compact, visually rich dark-mode summary card designed for image export/sharing.
 * Displays match scores, final result, Player of the Match, and top batting/bowling performers.
 */
export default function HighlightCard({ data }: HighlightCardProps) {
  const { score: scoreA, overs: oversA } = parseScoreAndOvers(data.teamAScore);
  const { score: scoreB, overs: oversB } = parseScoreAndOvers(data.teamBScore);

  const isTeamAWinner = data.winnerMessage?.includes(data.teamAName);
  const isTeamBWinner = data.winnerMessage?.includes(data.teamBName);

  const scoreAColor = isTeamBWinner ? CARD_COLORS.textSecondary : CARD_COLORS.textPrimary;
  const scoreBColor = isTeamAWinner ? CARD_COLORS.textSecondary : CARD_COLORS.textPrimary;

  return (
    <View style={styles.cardContainer}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <PabainiLogo size={22} />
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
        <View style={styles.scoreColumn}>
          <Text style={styles.teamLabel} numberOfLines={1}>{data.teamAName}</Text>
          <Text style={[styles.scoreValue, { color: scoreAColor }]}>{scoreA}</Text>
          {!!oversA && <Text style={styles.oversValue}>{oversA}</Text>}
        </View>
        <View style={styles.vsCircle}>
          <Text style={styles.vsText}>vs</Text>
        </View>
        <View style={styles.scoreColumn}>
          <Text style={styles.teamLabel} numberOfLines={1}>{data.teamBName}</Text>
          <Text style={[styles.scoreValue, { color: scoreBColor }]}>{scoreB}</Text>
          {!!oversB && <Text style={styles.oversValue}>{oversB}</Text>}
        </View>
      </View>

      {/* Winner Banner */}
      {data.winnerMessage && (
        <LinearGradient
          colors={['#14532D', '#166534']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.winnerBanner}
        >
          <Trophy size={14} color="#86EFAC" />
          <Text style={styles.winnerBannerText}>{data.winnerMessage}</Text>
        </LinearGradient>
      )}

      {/* Man of the Match Row */}
      {data.hasManOfMatch && data.momName && (
        <View style={styles.momRow}>
          <Star size={14} color="#F59E0B" fill="#F59E0B" />
          <Text style={styles.momLabel}>Player of the match: </Text>
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
                <HighlightAvatar uri={data.topBatsmanA.avatarUrl} size={24} name={data.topBatsmanA.name} />
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
                <HighlightAvatar uri={data.topBatsmanB.avatarUrl} size={24} name={data.topBatsmanB.name} />
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

      {/* Divider between sections */}
      <View style={styles.sectionDivider} />

      {/* Top Bowling Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeading}>TOP BOWLING</Text>
        <View style={styles.performersList}>
          <View style={styles.performerRow}>
            {data.topBowlerA ? (
              <>
                <HighlightAvatar uri={data.topBowlerA.avatarUrl} size={24} name={data.topBowlerA.name} />
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
                <HighlightAvatar uri={data.topBowlerB.avatarUrl} size={24} name={data.topBowlerB.name} />
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
    height: 44,
    backgroundColor: '#0F0F0F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1F1F1F',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerWordmark: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
  headerRightText: {
    color: '#9CA3AF',
    fontWeight: '500',
    fontSize: 10,
    letterSpacing: 1,
  },
  matchTitleSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  matchTitle: {
    color: CARD_COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '500',
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
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginVertical: 16,
  },
  scoreColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamLabel: {
    color: CARD_COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
    textAlign: 'center',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  oversValue: {
    color: CARD_COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  vsCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E1E1E',
    borderWidth: 0.5,
    borderColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  vsText: {
    color: CARD_COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  winnerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    marginBottom: 14,
  },
  winnerBannerText: {
    color: '#86EFAC',
    fontSize: 12,
    fontWeight: '700',
  },
  momRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  momLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '400',
  },
  momName: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
  },
  sectionDivider: {
    height: 0.5,
    backgroundColor: '#1F1F1F',
    marginHorizontal: 16,
    marginBottom: 16,
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
    gap: 10,
  },
  performerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
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


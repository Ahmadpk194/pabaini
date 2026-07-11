import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { CricketMatch } from '../../../types/sports.types';
import { MapPin, Calendar } from 'lucide-react-native';
import { getTeamColor } from '../teams/TeamCard';
import { formatMatchDate } from '../../../utils/format';

const parseScore = (scoreStr: string | null) => {
  if (!scoreStr) return { runs: 0, wickets: 0, overs: 0 };
  const match = scoreStr.match(/^(\d+)[-/](\d+)(?:\s*\((\d+(?:\.\d+)?)\))?/);
  if (match) {
    return {
      runs: parseInt(match[1], 10) || 0,
      wickets: parseInt(match[2], 10) || 0,
      overs: parseFloat(match[3]) || 0,
    };
  }
  return { runs: 0, wickets: 0, overs: 0 };
};

interface MatchCardProps {
  match: CricketMatch;
  onPress: () => void;
}

export function MatchCard({ match, onPress }: MatchCardProps) {
  const { theme, mode } = useTheme();

  const teamAInitials = match.team_a.name ? match.team_a.name.charAt(0).toUpperCase() : '?';
  const teamBInitials = match.team_b.name ? match.team_b.name.charAt(0).toUpperCase() : '?';

  const teamABgColor = getTeamColor(match.team_a.name);
  const teamBBgColor = getTeamColor(match.team_b.name);

  const getStatusStyles = () => {
    const isDark = mode === 'dark';
    switch (match.status) {
      case 'live':
        return {
          bg: isDark ? 'rgba(211, 47, 47, 0.18)' : '#FFEBEB',
          text: isDark ? '#FF8A80' : '#D32F2F',
          label: '🔴 LIVE',
        };
      case 'pending_request':
        return {
          bg: isDark ? 'rgba(255, 179, 0, 0.18)' : '#FFF8DC',
          text: isDark ? '#FFCA28' : '#A07800',
          label: '🟡 PENDING',
        };
      case 'scheduled':
        return {
          bg: isDark ? 'rgba(25, 118, 210, 0.18)' : '#EBF3FE',
          text: isDark ? '#64B5F6' : '#1976D2',
          label: '🟡 UPCOMING',
        };
      case 'completed':
        return {
          bg: isDark ? 'rgba(46, 125, 50, 0.18)' : '#EBFBEF',
          text: isDark ? '#81C784' : '#2E7D32',
          label: '🟢 COMPLETED',
        };
      case 'cancelled':
        return {
          bg: isDark ? 'rgba(121, 31, 31, 0.18)' : '#FCEBEB',
          text: isDark ? '#E57373' : '#791F1F',
          label: '⚪ CANCELLED',
        };
      case 'no_result':
        return {
          bg: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F5F5F5',
          text: isDark ? '#B0BEC5' : '#616161',
          label: '⚪ NO RESULT',
        };
      default:
        return {
          bg: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F5F5F5',
          text: isDark ? '#B0BEC5' : '#616161',
          label: `⚪ ${String(match.status).toUpperCase()}`,
        };
    }
  };

  const statusStyle = getStatusStyles();
  const isLive = match.status === 'live';
  const isCompleted = match.status === 'completed';
  const showScore = isLive || isCompleted;

  const winnerName = match.winner_team?.name || 
    (match.winner_team_id === match.team_a_id ? match.team_a.name : 
     match.winner_team_id === match.team_b_id ? match.team_b.name : null);

  const getWinnerMessage = () => {
    if (match.is_tie || (!match.winner_team_id && match.status === 'completed')) {
      return 'Match Tied';
    }
    const winner = winnerName;
    if (!winner) return 'Completed';

    const scoreA = parseScore(match.team_a_score);
    const scoreB = parseScore(match.team_b_score);

    if (match.batting_first_team_id) {
      const firstBattingId = match.batting_first_team_id;
      const secondBattingId = firstBattingId === match.team_a_id ? match.team_b_id : match.team_a_id;
      
      const scoreFirst = firstBattingId === match.team_a_id ? scoreA : scoreB;
      const scoreSecond = firstBattingId === match.team_a_id ? scoreB : scoreA;
      
      if (match.winner_team_id === firstBattingId) {
        const runsDiff = scoreFirst.runs - scoreSecond.runs;
        if (runsDiff > 0) {
          return `${winner} won by ${runsDiff} run${runsDiff > 1 ? 's' : ''}`;
        }
      } else if (match.winner_team_id === secondBattingId) {
        const storedMaxWickets = match.winner_team_id === match.team_a_id
          ? match.team_a_max_wickets
          : match.team_b_max_wickets;
        const maxWickets = storedMaxWickets ?? 10;
        const wicketsDiff = maxWickets - scoreSecond.wickets;
        if (wicketsDiff > 0) {
          return `${winner} won by ${wicketsDiff} wicket${wicketsDiff > 1 ? 's' : ''}`;
        }
      }
    } else {
      const runsDiff = Math.abs(scoreA.runs - scoreB.runs);
      if (runsDiff > 0) {
        return `${winner} won by ${runsDiff} run${runsDiff > 1 ? 's' : ''}`;
      }
    }

    return `${winner} won`;
  };

  const getPrimaryActionLabel = () => {
    switch (match.status) {
      case 'live':
        return 'Watch Live →';
      case 'completed':
        return 'View Scorecard →';
      default:
        return 'View Details →';
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: isLive ? theme.colors.primary : theme.colors.border,
          borderWidth: isLive ? 1.5 : 1,
          borderRadius: theme.radius.md,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.topRow}>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, flexShrink: 0 }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]} numberOfLines={1}>
            {statusStyle.label}
          </Text>
        </View>
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginLeft: 12 }}>
          {match.status === 'scheduled' ? (
            <Text style={{ fontSize: 11, fontWeight: '600', color: theme.colors.textSecondary, marginRight: 8 }} numberOfLines={1}>
              Lineups: {(match.team_a_lineup_set ? 1 : 0) + (match.team_b_lineup_set ? 1 : 0)}/2
            </Text>
          ) : null}
          <Text style={[styles.oversText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {match.overs} Overs • {match.scoring_mode === 'live' ? 'Live Scoring' : 'Simple Entry'}
          </Text>
        </View>
      </View>

      <View style={styles.teamsContainer}>
        <View style={styles.teamColumn}>
          <View style={styles.logoContainer}>
            {match.team_a.logo_url ? (
              <Image source={{ uri: match.team_a.logo_url }} style={styles.logoImage} />
            ) : (
              <View style={[styles.logoFallback, { backgroundColor: teamABgColor }]}>
                <Text style={styles.logoFallbackText}>{teamAInitials}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.teamName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
            {match.team_a.name}
          </Text>
          {showScore && match.team_a_score ? (
            <Text style={[styles.teamScore, { color: theme.colors.textPrimary }]}>
              {match.team_a_score}
            </Text>
          ) : null}
        </View>

        <View style={styles.vsContainer}>
          <Text style={[styles.vsText, { color: theme.colors.textSecondary }]}>VS</Text>
        </View>

        <View style={styles.teamColumn}>
          <View style={styles.logoContainer}>
            {match.team_b.logo_url ? (
              <Image source={{ uri: match.team_b.logo_url }} style={styles.logoImage} />
            ) : (
              <View style={[styles.logoFallback, { backgroundColor: teamBBgColor }]}>
                <Text style={styles.logoFallbackText}>{teamBInitials}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.teamName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
            {match.team_b.name}
          </Text>
          {showScore && match.team_b_score ? (
            <Text style={[styles.teamScore, { color: theme.colors.textPrimary }]}>
              {match.team_b_score}
            </Text>
          ) : null}
        </View>
      </View>

      {isCompleted && (
        <View
          style={[
            styles.winnerRow,
            {
              backgroundColor: theme.colors.primary + '08',
              borderColor: theme.colors.primary + '20',
            },
          ]}
        >
          <Text
            style={[
              styles.winnerText,
              { color: theme.colors.primary },
            ]}
            numberOfLines={1}
          >
            🏆 {getWinnerMessage()}
          </Text>
        </View>
      )}

      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

      <View style={styles.bottomRow}>
        <View style={styles.metaGroup}>
          <View style={styles.metaItem}>
            <Text style={[styles.metaText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              🕒 {formatMatchDate(match.scheduled_at)}
            </Text>
          </View>
          
          {match.venue ? (
            <View style={styles.metaItem}>
              <Text style={[styles.metaText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                📍 {match.venue}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={[styles.actionLink, { color: theme.colors.primary }]}>
          {getPrimaryActionLabel()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.01,
    shadowRadius: 1,
    elevation: 0,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  oversText: {
    fontSize: 11,
    fontWeight: '600',
    flexShrink: 1,
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  teamColumn: {
    flex: 1,
    alignItems: 'center',
  },
  vsContainer: {
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontSize: 11,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 4,
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
  teamName: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    width: '90%',
  },
  teamScore: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 11,
  },
  actionLink: {
    fontSize: 11,
    fontWeight: '700',
  },
  winnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 0.5,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  winnerText: {
    fontSize: 10,
    fontWeight: '700',
  },
});

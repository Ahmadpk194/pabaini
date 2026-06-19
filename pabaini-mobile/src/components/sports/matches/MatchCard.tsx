import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { CricketMatch } from '../../../types/sports.types';
import { MapPin, Calendar } from 'lucide-react-native';
import { getTeamColor } from '../teams/TeamCard';
import { formatMatchDate } from '../../../utils/format';

interface MatchCardProps {
  match: CricketMatch;
  onPress: () => void;
}

export function MatchCard({ match, onPress }: MatchCardProps) {
  const { theme } = useTheme();

  const teamAInitials = match.team_a.name ? match.team_a.name.charAt(0).toUpperCase() : '?';
  const teamBInitials = match.team_b.name ? match.team_b.name.charAt(0).toUpperCase() : '?';

  const teamABgColor = getTeamColor(match.team_a.name);
  const teamBBgColor = getTeamColor(match.team_b.name);

  const getStatusStyles = () => {
    switch (match.status) {
      case 'live':
        return {
          bg: '#FFEBEB',
          text: '#D32F2F',
          label: 'LIVE',
        };
      case 'pending_request':
        return {
          bg: '#FFF8DC',
          text: '#A07800',
          label: 'Challenge Pending',
        };
      case 'scheduled':
        return {
          bg: '#EBF3FE',
          text: '#1976D2',
          label: 'Scheduled',
        };
      case 'completed':
        return {
          bg: '#EBFBEF',
          text: '#2E7D32',
          label: 'Completed',
        };
      case 'cancelled':
        return {
          bg: '#FCEBEB',
          text: '#791F1F',
          label: 'Cancelled',
        };
      case 'no_result':
        return {
          bg: '#F5F5F5',
          text: '#616161',
          label: 'No Result',
        };
      default:
        return {
          bg: '#F5F5F5',
          text: '#616161',
          label: (match.status as string).toUpperCase(),
        };
    }
  };

  const statusStyle = getStatusStyles();
  const isLive = match.status === 'live';
  const isCompleted = match.status === 'completed';
  const showScore = isLive || isCompleted;

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
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          {isLive && <View style={styles.liveDot} />}
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {statusStyle.label}
          </Text>
        </View>
        {match.status === 'scheduled' ? (
          <Text style={{ fontSize: 11, fontWeight: '600', color: theme.colors.textSecondary }}>
            Lineups: {(match.team_a_lineup_set ? 1 : 0) + (match.team_b_lineup_set ? 1 : 0)}/2
          </Text>
        ) : null}
        <Text style={[styles.oversText, { color: theme.colors.textSecondary }]}>
          {match.overs} Overs • {match.scoring_mode === 'live' ? 'Live Scoring' : 'Simple Entry'}
        </Text>
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

      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

      <View style={styles.bottomRow}>
        <View style={styles.metaItem}>
          <Calendar size={13} color={theme.colors.textSecondary} />
          <Text style={[styles.metaText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {formatMatchDate(match.scheduled_at)}
          </Text>
        </View>
        
        {match.venue ? (
          <View style={[styles.metaItem, { marginLeft: 12, flex: 1 }]}>
            <MapPin size={13} color={theme.colors.textSecondary} />
            <Text style={[styles.metaText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {match.venue}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D32F2F',
    marginRight: 6,
  },
  oversText: {
    fontSize: 12,
    fontWeight: '600',
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
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
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 6,
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
    fontSize: 18,
    fontWeight: '700',
  },
  teamName: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    width: '90%',
  },
  teamScore: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
});

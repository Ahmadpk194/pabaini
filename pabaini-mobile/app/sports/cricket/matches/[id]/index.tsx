import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Calendar, MapPin, Trophy, Shield, Clock, Award, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useTheme } from '../../../../../src/context/ThemeContext';
import { useSportsStore } from '../../../../../src/store/sports/sportsStore';
import {
  useMatchDetail,
  useAcceptMatch,
  useDeclineMatch,
  useCancelMatch,
  useLineup,
} from '../../../../../src/hooks/useMatches';
import { getTeamColor } from '../../../../../src/components/sports/teams/TeamCard';
import { formatMatchDate } from '../../../../../src/utils/format';

export default function MatchDetailScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = Number(id);
  const insets = useSafeAreaInsets();

  // Get current user registration & profile from Zustand
  const isRegistered = useSportsStore((state) => state.isRegistered('cricket'));
  const myProfile = useSportsStore((state) => state.registrations['cricket']?.profile);

  // Queries & Mutations
  // Fetches match details with manual refetch support on screen focus.
  const { data: match, isLoading, error, refetch } = useMatchDetail(matchId);
  const { data: lineups, isLoading: isLoadingLineup } = useLineup(matchId);
  const acceptMutation = useAcceptMatch();
  const declineMutation = useDeclineMatch();
  const cancelMutation = useCancelMatch();

  const [teamAExpanded, setTeamAExpanded] = useState(false);
  const [teamBExpanded, setTeamBExpanded] = useState(false);

  // Refetches the match details every time the screen comes into focus
  // to reactively handle status and lineup updates.
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const getStatusStyles = (status?: string) => {
    switch (status) {
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
          label: status?.toUpperCase() || 'UNKNOWN',
        };
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !match) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color={theme.colors.textPrimary} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Match Details</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={{ color: theme.colors.textSecondary, marginBottom: 12 }}>
            Failed to load match details.
          </Text>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={{ color: theme.colors.onPrimary, fontWeight: '700' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Role Checks
  const isRequesterCaptain = myProfile && match.requested_by === myProfile.id;
  const isOpponentCaptain = myProfile && match.team_b.captain?.id === myProfile.id;
  const isTeamACaptain = myProfile && match.team_a.captain?.id === myProfile.id;
  const isTeamBCaptain = myProfile && match.team_b.captain?.id === myProfile.id;
  const isEitherCaptain =
    myProfile &&
    (match.team_a.captain?.id === myProfile.id || match.team_b.captain?.id === myProfile.id);

  const statusStyle = getStatusStyles(match.status);
  const isLive = match.status === 'live';
  const isCompleted = match.status === 'completed';
  const showScore = isLive || isCompleted;

  const teamAInitials = match.team_a.name ? match.team_a.name.charAt(0).toUpperCase() : '?';
  const teamBInitials = match.team_b.name ? match.team_b.name.charAt(0).toUpperCase() : '?';
  const teamABgColor = getTeamColor(match.team_a.name);
  const teamBBgColor = getTeamColor(match.team_b.name);

  // Handlers
  const handleAccept = () => {
    Alert.alert('Accept Challenge', 'Are you sure you want to accept this match request?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Accept',
        onPress: async () => {
          try {
            await acceptMutation.mutateAsync(matchId);
            Alert.alert('Success', 'Match challenge accepted!');
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to accept challenge');
          }
        },
      },
    ]);
  };

  const handleDecline = () => {
    Alert.alert('Decline Challenge', 'Are you sure you want to decline this match request?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: async () => {
          try {
            await declineMutation.mutateAsync(matchId);
            Alert.alert('Success', 'Match challenge declined');
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to decline challenge');
          }
        },
      },
    ]);
  };

  const handleCancel = () => {
    Alert.alert('Cancel Match', 'Are you sure you want to cancel this match? This cannot be undone.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancel Match',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelMutation.mutateAsync(matchId);
            Alert.alert('Success', 'Match cancelled successfully');
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to cancel match');
          }
        },
      },
    ]);
  };

  const handleEdit = () => {
    router.push(`/sports/cricket/matches/request?matchId=${match.id}`);
  };

  // Rendering Action Buttons based on status & role
  const renderActionArea = () => {
    const isMutating =
      acceptMutation.isPending || declineMutation.isPending || cancelMutation.isPending;

    if (isMutating) {
      return (
        <View style={styles.actionContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      );
    }

    // pending_request status
    if (match.status === 'pending_request') {
      if (isRequesterCaptain) {
        return (
          <View style={[styles.actionContainer, styles.rowButtons]}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.halfBtn, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm }]}
              onPress={handleEdit}
            >
              <Text style={[styles.actionBtnText, { color: theme.colors.onPrimary }]}>Edit Request</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.halfBtn, { backgroundColor: '#FCEBEB', borderColor: '#F7C5C5', borderWidth: 1, borderRadius: theme.radius.sm }]}
              onPress={handleCancel}
            >
              <Text style={[styles.actionBtnText, { color: '#791F1F' }]}>Cancel Request</Text>
            </TouchableOpacity>
          </View>
        );
      }
      if (isOpponentCaptain) {
        return (
          <View style={[styles.actionContainer, styles.rowButtons]}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.halfBtn, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm }]}
              onPress={handleAccept}
            >
              <Text style={[styles.actionBtnText, { color: theme.colors.onPrimary }]}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.halfBtn, { backgroundColor: '#FCEBEB', borderColor: '#F7C5C5', borderWidth: 1, borderRadius: theme.radius.sm }]}
              onPress={handleDecline}
            >
              <Text style={[styles.actionBtnText, { color: '#791F1F' }]}>Decline</Text>
            </TouchableOpacity>
          </View>
        );
      }
      
      // Registered player (non-captain) or guest view
      return (
        <View style={styles.actionContainer}>
          <View style={[styles.disabledBtn, { backgroundColor: theme.colors.border + '50', borderRadius: theme.radius.sm }]}>
            <Text style={[styles.disabledBtnText, { color: theme.colors.textSecondary }]}>
              Pending Challenger Response
            </Text>
          </View>
        </View>
      );
    }

    // scheduled status
    if (match.status === 'scheduled') {
      const bothLineupsDeclared = match.team_a_lineup_set && match.team_b_lineup_set;

      if (match.scoring_mode === 'live') {
        if (bothLineupsDeclared) {
          if (isEitherCaptain) {
            return (
              <View style={styles.actionContainer}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.actionBtn, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm }]}
                  onPress={() => router.push(`/sports/cricket/matches/${match.id}/start`)}
                >
                  <Text style={[styles.actionBtnText, { color: theme.colors.onPrimary }]}>Start Match</Text>
                </TouchableOpacity>
              </View>
            );
          } else {
            return (
              <View style={styles.actionContainer}>
                <View style={[styles.disabledBtn, { backgroundColor: theme.colors.border + '50', borderRadius: theme.radius.sm }]}>
                  <Text style={[styles.disabledBtnText, { color: theme.colors.textSecondary }]}>
                    Ready to Start (Awaiting Captain)
                  </Text>
                </View>
              </View>
            );
          }
        } else {
          return (
            <View style={styles.actionContainer}>
              <View style={[styles.disabledBtn, { backgroundColor: theme.colors.border + '50', borderRadius: theme.radius.sm }]}>
                <Text style={[styles.disabledBtnText, { color: theme.colors.textSecondary }]}>
                  Awaiting Lineup Declaration
                </Text>
              </View>
            </View>
          );
        }
      } else {
        // simple scoring mode
        if (bothLineupsDeclared) {
          if (isEitherCaptain) {
            return (
              <View style={styles.actionContainer}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.actionBtn, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm }]}
                  onPress={() => router.push(`/sports/cricket/matches/${match.id}/result`)}
                >
                  <Text style={[styles.actionBtnText, { color: theme.colors.onPrimary }]}>Submit Result</Text>
                </TouchableOpacity>
              </View>
            );
          } else {
            return (
              <View style={styles.actionContainer}>
                <View style={[styles.disabledBtn, { backgroundColor: theme.colors.border + '50', borderRadius: theme.radius.sm }]}>
                  <Text style={[styles.disabledBtnText, { color: theme.colors.textSecondary }]}>
                    Awaiting Result Submission
                  </Text>
                </View>
              </View>
            );
          }
        } else {
          return (
            <View style={styles.actionContainer}>
              <View style={[styles.disabledBtn, { backgroundColor: theme.colors.border + '50', borderRadius: theme.radius.sm }]}>
                <Text style={[styles.disabledBtnText, { color: theme.colors.textSecondary }]}>
                  Awaiting Lineup Declaration
                </Text>
              </View>
            </View>
          );
        }
      }
    }

    // live status
    if (match.status === 'live') {
      const isScorer = myProfile && match.scorer_id === myProfile.id;

      if (isScorer) {
        return (
          <View style={[styles.actionContainer, styles.rowButtons]}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.halfBtn, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm }]}
              onPress={() => router.push(`/sports/cricket/matches/${match.id}/score`)}
            >
              <Text style={[styles.actionBtnText, { color: theme.colors.onPrimary }]}>Continue Scoring</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.halfBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary, borderWidth: 1, borderRadius: theme.radius.sm }]}
              onPress={() => router.push(`/sports/cricket/matches/${match.id}/live`)}
            >
              <Text style={[styles.actionBtnText, { color: theme.colors.primary }]}>Watch Live</Text>
            </TouchableOpacity>
          </View>
        );
      } else {
        return (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.actionBtn, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm }]}
              onPress={() => router.push(`/sports/cricket/matches/${match.id}/live`)}
            >
              <Text style={[styles.actionBtnText, { color: theme.colors.onPrimary }]}>Watch Live</Text>
            </TouchableOpacity>
          </View>
        );
      }
    }

    // completed status
    if (match.status === 'completed') {
      if (match.is_result_editable && isEitherCaptain) {
        return (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.actionBtn, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm }]}
              onPress={() => router.push(`/sports/cricket/matches/${match.id}/result`)}
            >
              <Text style={[styles.actionBtnText, { color: theme.colors.onPrimary }]}>Edit Result</Text>
            </TouchableOpacity>
          </View>
        );
      }
    }

    return null;
  };

  const renderScorecard = () => {
    if (match.status !== 'completed') return null;

    const stats = match.player_stats || [];
    const teamAStats = stats.filter((s) => s.team_id === match.team_a_id);
    const teamBStats = stats.filter((s) => s.team_id === match.team_b_id);

    const winnerName = match.winner_team?.name || (match.winner_team_id === match.team_a_id ? match.team_a.name : match.team_b.name) || 'Unknown';
    const momName = match.man_of_match?.user?.name || 
      (match.man_of_match_guest_name ? `${match.man_of_match_guest_name} (Guest)` : 'Not Declared');

    const renderTeamStats = (
      teamName: string,
      teamStats: typeof stats,
      score: string | null,
      isExpanded: boolean,
      toggleExpand: () => void
    ) => {
      const batters = teamStats.filter((s) => s.runs > 0 || s.balls_faced > 0 || s.how_out || s.is_not_out);
      const bowlers = teamStats.filter((s) => s.overs_bowled > 0);

      return (
        <View style={{ marginBottom: 12 }}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 12,
              paddingHorizontal: 12,
              backgroundColor: theme.colors.border + '15',
              borderRadius: theme.radius.sm,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
            onPress={toggleExpand}
          >
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary }} numberOfLines={1}>
                {teamName}
              </Text>
              {score && (
                <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 }}>{score}</Text>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 12, color: theme.colors.primary, fontWeight: '600' }}>
                {isExpanded ? 'Hide' : 'Details'}
              </Text>
              {isExpanded ? (
                <ChevronUp size={16} color={theme.colors.primary} />
              ) : (
                <ChevronDown size={16} color={theme.colors.primary} />
              )}
            </View>
          </TouchableOpacity>

          {isExpanded && (
            <View style={{ marginTop: 12 }}>
              {/* Batting Header */}
              <Text style={[styles.scorecardSubHeader, { color: theme.colors.textSecondary }]}>Batting</Text>
              {batters.length === 0 ? (
                <Text style={[styles.emptyStatsText, { color: theme.colors.textSecondary }]}>No batting stats recorded.</Text>
              ) : (
                <View style={[styles.statsTable, { borderColor: theme.colors.border }]}>
                  {batters.map((player, idx) => {
                    const displayName = player.name || player.guest_name || 'Guest';
                    const dismissalText = player.is_not_out ? 'not out' : (player.how_out ? player.how_out.replace(/_/g, ' ') : 'out');
                    
                    return (
                      <View key={player.id || idx} style={[styles.statsRow, { borderBottomWidth: idx === batters.length - 1 ? 0 : 0.5, borderBottomColor: theme.colors.border }]}>
                        <View style={{ flex: 2 }}>
                          <Text style={[styles.statsPlayerName, { color: theme.colors.textPrimary }]} numberOfLines={1}>{displayName}</Text>
                          <Text style={[styles.statsDismissal, { color: theme.colors.textSecondary }]} numberOfLines={1}>{dismissalText}</Text>
                        </View>
                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                          <Text style={[styles.statsRuns, { color: theme.colors.textPrimary }]}>
                            {player.runs}
                            <Text style={{ fontSize: 11, fontWeight: 'normal', color: theme.colors.textSecondary }}> ({player.balls_faced})</Text>
                          </Text>
                          <Text style={[styles.statsBoundary, { color: theme.colors.textSecondary }]}>
                            4s: {player.fours} • 6s: {player.sixes}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Bowling Header */}
              <Text style={[styles.scorecardSubHeader, { color: theme.colors.textSecondary, marginTop: 16 }]}>Bowling</Text>
              {bowlers.length === 0 ? (
                <Text style={[styles.emptyStatsText, { color: theme.colors.textSecondary }]}>No bowling stats recorded.</Text>
              ) : (
                <View style={[styles.statsTable, { borderColor: theme.colors.border }]}>
                  {bowlers.map((player, idx) => {
                    const displayName = player.name || player.guest_name || 'Guest';
                    const econ = player.overs_bowled > 0 ? (player.runs_given / player.overs_bowled).toFixed(2) : '0.00';
                    
                    return (
                      <View key={player.id || idx} style={[styles.statsRow, { borderBottomWidth: idx === bowlers.length - 1 ? 0 : 0.5, borderBottomColor: theme.colors.border }]}>
                        <View style={{ flex: 2 }}>
                          <Text style={[styles.statsPlayerName, { color: theme.colors.textPrimary }]} numberOfLines={1}>{displayName}</Text>
                          <Text style={[styles.statsDismissal, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                            Wides: {player.wides} • NB: {player.no_balls}
                          </Text>
                        </View>
                        <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
                          <Text style={[styles.statsRuns, { color: theme.colors.textPrimary }]}>
                            {player.wickets} - {player.runs_given}
                          </Text>
                          <Text style={[styles.statsBoundary, { color: theme.colors.textSecondary }]}>
                            {player.overs_bowled} ov • Econ: {econ}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </View>
      );
    };

    return (
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.md }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, marginBottom: 0 }]}>Match Scorecard</Text>
          {!match.is_result_editable ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 11, color: theme.colors.textSecondary, fontWeight: '600' }}>Locked</Text>
              <Text style={{ fontSize: 11 }}>🔒</Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 11, color: theme.colors.primary, fontWeight: '600' }}>Editable (24h)</Text>
              <Text style={{ fontSize: 11 }}>✏️</Text>
            </View>
          )}
        </View>

        {/* Winner Banner */}
        <View style={[styles.winnerBanner, { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary }]}>
          <Trophy size={18} color="#D4A700" />
          <Text style={[styles.winnerBannerText, { color: theme.colors.textPrimary }]}>
            Winner: <Text style={{ fontWeight: '700' }}>{winnerName}</Text>
          </Text>
        </View>

        {/* Man of the Match */}
        <View style={[styles.momBanner, { backgroundColor: theme.colors.border + '30', borderColor: theme.colors.border, marginTop: 8 }]}>
          <Award size={18} color={theme.colors.primary} />
          <Text style={[styles.momBannerText, { color: theme.colors.textPrimary }]}>
            Man of the Match: <Text style={{ fontWeight: '700' }}>{momName}</Text>
          </Text>
        </View>

        <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 16 }} />

        {/* Team A stats */}
        {renderTeamStats(match.team_a.name, teamAStats, match.team_a_score, teamAExpanded, () => setTeamAExpanded(!teamAExpanded))}
        
        {/* Team B stats */}
        {renderTeamStats(match.team_b.name, teamBStats, match.team_b_score, teamBExpanded, () => setTeamBExpanded(!teamBExpanded))}
      </View>
    );
  };

  // Configure SafeAreaView to only protect top, left, and right.
  // The bottom edge is padded dynamically inside the ScrollView using insets.bottom
  // to ensure bottom action buttons clear the phone's navigation gesture bar.
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={theme.colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Match Details</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Scrollable content extending under the bottom safe area navigation bar */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 40 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card Banner */}
        <View style={[styles.statusCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.md }]}>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            {isLive && <View style={styles.liveDot} />}
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
          </View>
          <Text style={[styles.statusSub, { color: theme.colors.textSecondary }]}>
            {match.overs} Overs Match • {match.scoring_mode === 'live' ? 'Live Scoring Mode' : 'Simple Entry Mode'}
          </Text>
        </View>

        {/* Versus Teams block */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.md }]}>
          <View style={styles.vsContainer}>
            {/* Team A */}
            <View style={styles.teamBlock}>
              <View style={styles.logoWrapper}>
                {match.team_a.logo_url ? (
                  <Image source={{ uri: match.team_a.logo_url }} style={styles.teamLogo} />
                ) : (
                  <View style={[styles.logoFallback, { backgroundColor: teamABgColor }]}>
                    <Text style={styles.logoFallbackText}>{teamAInitials}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.teamName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                {match.team_a.name}
              </Text>
              <Text style={[styles.captainLabel, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                Capt: {match.team_a.captain?.user.name}
              </Text>
              {showScore && match.team_a_score ? (
                <Text style={[styles.teamScore, { color: theme.colors.textPrimary }]}>
                  {match.team_a_score}
                </Text>
              ) : null}
            </View>

            {/* VS Divider */}
            <View style={styles.vsMiddle}>
              <Text style={[styles.vsText, { color: theme.colors.textSecondary }]}>VS</Text>
            </View>

            {/* Team B */}
            <View style={styles.teamBlock}>
              <View style={styles.logoWrapper}>
                {match.team_b.logo_url ? (
                  <Image source={{ uri: match.team_b.logo_url }} style={styles.teamLogo} />
                ) : (
                  <View style={[styles.logoFallback, { backgroundColor: teamBBgColor }]}>
                    <Text style={styles.logoFallbackText}>{teamBInitials}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.teamName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                {match.team_b.name}
              </Text>
              <Text style={[styles.captainLabel, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                Capt: {match.team_b.captain?.user.name}
              </Text>
              {showScore && match.team_b_score ? (
                <Text style={[styles.teamScore, { color: theme.colors.textPrimary }]}>
                  {match.team_b_score}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Lineups Status Card (only show if scheduled or live) */}
        {(match.status === 'scheduled' || match.status === 'live') && (
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.md }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Playing XI Lineups</Text>
            
            <View style={styles.lineupStatusRow}>
              <View style={styles.lineupStatusItem}>
                <Text style={[styles.lineupTeamName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                  {match.team_a.name}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: match.team_a_lineup_set ? '#EBFBEF' : '#FFF8DC', marginTop: 6, alignSelf: 'center' }]}>
                  <Text style={[styles.statusText, { color: match.team_a_lineup_set ? '#2E7D32' : '#A07800' }]}>
                    {match.team_a_lineup_set ? 'Declared' : 'Not Declared'}
                  </Text>
                </View>
              </View>

              <View style={[styles.verticalDivider, { backgroundColor: theme.colors.border }]} />

              <View style={styles.lineupStatusItem}>
                <Text style={[styles.lineupTeamName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                  {match.team_b.name}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: match.team_b_lineup_set ? '#EBFBEF' : '#FFF8DC', marginTop: 6, alignSelf: 'center' }]}>
                  <Text style={[styles.statusText, { color: match.team_b_lineup_set ? '#2E7D32' : '#A07800' }]}>
                    {match.team_b_lineup_set ? 'Declared' : 'Not Declared'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Lineup Buttons for Captains */}
            {match.status === 'scheduled' && isEitherCaptain && (
              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.lineupActionBtn, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm, marginTop: 16 }]}
                onPress={() => router.push(`/sports/cricket/matches/${match.id}/lineup`)}
              >
                <Text style={{ color: theme.colors.onPrimary, fontWeight: '700', fontSize: 14 }}>
                  {isTeamACaptain
                    ? match.team_a_lineup_set ? 'Edit Playing XI' : 'Declare Playing XI'
                    : match.team_b_lineup_set ? 'Edit Playing XI' : 'Declare Playing XI'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {renderScorecard()}

        {/* Schedule & Information Details */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.md }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Match Information</Text>

          <View style={styles.infoRow}>
            <Calendar size={18} color={theme.colors.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Date & Time</Text>
              <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
                {formatMatchDate(match.scheduled_at)}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          <View style={styles.infoRow}>
            <MapPin size={18} color={theme.colors.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Venue</Text>
              <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
                {match.venue || 'Venue to be decided'}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          <View style={styles.infoRow}>
            <Clock size={18} color={theme.colors.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Scoring Mode</Text>
              <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
                {match.scoring_mode === 'live'
                  ? 'Real-time Live ball-by-ball'
                  : 'Simple Post-match results entry'}
              </Text>
            </View>
          </View>

          {match.scorer && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.infoRow}>
                <Shield size={18} color={theme.colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Designated Scorer</Text>
                  <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
                    {match.scorer.user.name}
                  </Text>
                </View>
              </View>
            </>
          )}

          {match.winner_team && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.infoRow}>
                <Trophy size={18} color="#D4A700" />
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Winner</Text>
                  <Text style={[styles.infoValue, { color: '#D4A700', fontWeight: '700' }]}>
                    {match.winner_team.name}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Action button area */}
        {renderActionArea()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  statusCard: {
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D32F2F',
    marginRight: 6,
  },
  statusSub: {
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    padding: 16,
    borderWidth: 1,
  },
  vsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamBlock: {
    flex: 1.2,
    alignItems: 'center',
  },
  logoWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 10,
  },
  teamLogo: {
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
    fontSize: 24,
    fontWeight: '700',
  },
  teamName: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  captainLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  teamScore: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  vsMiddle: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vsText: {
    fontSize: 18,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  actionContainer: {
    marginTop: 8,
    width: '100%',
  },
  rowButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  halfBtn: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  disabledBtn: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  disabledBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  lineupStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  lineupStatusItem: {
    flex: 1,
    alignItems: 'center',
  },
  lineupTeamName: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  verticalDivider: {
    width: 1,
    height: 40,
  },
  lineupActionBtn: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  winnerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 6,
    gap: 8,
  },
  winnerBannerText: {
    fontSize: 14,
  },
  momBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 6,
    gap: 8,
  },
  momBannerText: {
    fontSize: 14,
  },
  scorecardTeamHeader: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  scorecardSubHeader: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  emptyStatsText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  statsTable: {
    borderWidth: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statsPlayerName: {
    fontSize: 13,
    fontWeight: '600',
  },
  statsDismissal: {
    fontSize: 11,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  statsRuns: {
    fontSize: 13,
    fontWeight: '700',
  },
  statsBoundary: {
    fontSize: 11,
    marginTop: 2,
  },
});

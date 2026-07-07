import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Calendar, MapPin, Trophy, Shield, Clock, Award, ChevronDown, ChevronUp, Share2 } from 'lucide-react-native';
import { useTheme } from '../../../../../src/context/ThemeContext';
import { safeRouterPush } from '../../../../../src/navigation/safeNavigation';
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
import { MatchScorecard } from '../../../../../src/components/sports/matches/MatchScorecard';
import { MatchDetailSkeleton } from '../../../../../src/components/skeletons';
import ShareBottomSheet from '../../../../../src/components/sports/matches/share/ShareBottomSheet';

export default function MatchDetailScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = Number(id);
  const insets = useSafeAreaInsets();

  // Share states
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);
  const [lineupsModalVisible, setLineupsModalVisible] = useState(false);
  // Loading overlay shown immediately after option selection while sheet dismisses
  const [isSharePreparing, setIsSharePreparing] = useState(false);
  // Holds pending navigation target so we can navigate after sheet is dismissed
  const sharePendingRef = useRef<{ optionId: string; teamId: number } | null>(null);

  // Get current user registration & profile from Zustand
  const isRegistered = useSportsStore((state) => state.isRegistered('cricket'));
  const myProfile = useSportsStore((state) => state.registrations['cricket']?.profile);

  // Queries & Mutations
  // Fetches match details with manual refetch support on screen focus.
  const { data: match, isLoading, error, refetch } = useMatchDetail(matchId);
  const { data: lineups, isLoading: isLoadingLineup } = useLineup(matchId);
  const acceptMutation = useAcceptMatch();

  // Find user's team ID for share scorecard
  let userTeamId: number | null = null;
  if (myProfile && match) {
    const myStat = match.player_stats?.find((s) => s.player_id === myProfile.id);
    if (myStat) {
      userTeamId = myStat.team_id;
    } else if (lineups) {
      const inTeamA = lineups.team_a.players.some((p) => p.player_id === myProfile.id);
      if (inTeamA) {
        userTeamId = match.team_a_id;
      } else {
        const inTeamB = lineups.team_b.players.some((p) => p.player_id === myProfile.id);
        if (inTeamB) userTeamId = match.team_b_id;
      }
    }
  }

  const handleShareOptionSelect = (optionId: string) => {
    // Stash the pending target and show overlay immediately for instant feedback
    sharePendingRef.current = {
      optionId,
      teamId: userTeamId || match?.team_a_id || 0,
    };
    setIsShareSheetOpen(false);
    setIsSharePreparing(true);
  };

  // Navigate once the bottom sheet has had time to dismiss (avoids animation clash)
  useEffect(() => {
    if (!isSharePreparing || isShareSheetOpen) return;
    const pending = sharePendingRef.current;
    if (!pending) return;
    const timer = setTimeout(() => {
      safeRouterPush(router, {
        pathname: '/sports/cricket/matches/[id]/share-preview',
        params: {
          id: matchId,
          optionId: pending.optionId,
          teamId: pending.teamId,
        },
      });
      sharePendingRef.current = null;
      setIsSharePreparing(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [isSharePreparing, isShareSheetOpen]);
  const declineMutation = useDeclineMatch();
  const cancelMutation = useCancelMatch();

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
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.surface }]} edges={['top', 'left', 'right']}>
        {/* Header Bar */}
        <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color={theme.colors.textPrimary} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary, flex: 1, textAlign: 'center' }]}>Match Details</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <MatchDetailSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !match) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.surface }]} edges={['top', 'left', 'right']}>
        <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color={theme.colors.textPrimary} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary, flex: 1, textAlign: 'center' }]}>Match Details</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={[styles.centerContainer, { flex: 1, backgroundColor: theme.colors.background }]}>
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
    safeRouterPush(router, `/sports/cricket/matches/request?matchId=${match.id}`);
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
                  onPress={() => safeRouterPush(router, `/sports/cricket/matches/${match.id}/start`)}
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
                  onPress={() => safeRouterPush(router, `/sports/cricket/matches/${match.id}/result`)}
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
              onPress={() => safeRouterPush(router, `/sports/cricket/matches/${match.id}/score`)}
            >
              <Text style={[styles.actionBtnText, { color: theme.colors.onPrimary }]}>Continue Scoring</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.halfBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary, borderWidth: 1, borderRadius: theme.radius.sm }]}
              onPress={() => safeRouterPush(router, `/sports/cricket/matches/${match.id}/live`)}
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
              onPress={() => safeRouterPush(router, `/sports/cricket/matches/${match.id}/live`)}
            >
              <Text style={[styles.actionBtnText, { color: theme.colors.onPrimary }]}>Watch Live</Text>
            </TouchableOpacity>
          </View>
        );
      }
    }

    // completed status
    if (match.status === 'completed') {
      if (isEitherCaptain) {
        return (
          <View style={[styles.actionContainer, styles.rowButtons]}>
            {match.is_result_editable && (
              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.halfBtn, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm }]}
                onPress={() => safeRouterPush(router, `/sports/cricket/matches/${match.id}/result`)}
              >
                <Text style={[styles.actionBtnText, { color: theme.colors.onPrimary }]}>Edit Result</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                match.is_result_editable ? styles.halfBtn : styles.actionBtn,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary, borderWidth: 1, borderRadius: theme.radius.sm }
              ]}
              onPress={() => safeRouterPush(router, {
                pathname: '/announcement/create',
                params: { matchId: match.id },
              })}
            >
              <Text style={[styles.actionBtnText, { color: theme.colors.primary }]}>Share Match Update</Text>
            </TouchableOpacity>
          </View>
        );
      }
    }

    return null;
  };

  // Configure SafeAreaView to only protect top, left, and right.
  // The bottom edge is padded dynamically inside the ScrollView using insets.bottom
  // to ensure bottom action buttons clear the phone's navigation gesture bar.
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.surface }]} edges={['top', 'left', 'right']}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={theme.colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary, flex: 1, textAlign: 'center' }]} numberOfLines={1}>
          {match.team_a.name} vs {match.team_b.name}
        </Text>
        {isCompleted ? (
          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: theme.colors.elevated }]}
            onPress={() => setIsShareSheetOpen(true)}
          >
            <Share2 color={theme.colors.textPrimary} size={20} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      {/* Scrollable content extending under the bottom safe area navigation bar */}
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
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
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.teamBlock}
              onPress={() => safeRouterPush(router, `/sports/cricket/teams/${match.team_a.id}`)}
            >
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
            </TouchableOpacity>

            {/* VS Divider */}
            <View style={styles.vsMiddle}>
              <Text style={[styles.vsText, { color: theme.colors.textSecondary }]}>VS</Text>
            </View>

            {/* Team B */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.teamBlock}
              onPress={() => safeRouterPush(router, `/sports/cricket/teams/${match.team_b.id}`)}
            >
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
            </TouchableOpacity>
          </View>
        </View>

        {/* Lineups Status Card (only show if scheduled or live) */}
        {(match.status === 'scheduled' || match.status === 'live') && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.md }]}
            onPress={() => setLineupsModalVisible(true)}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: theme.colors.textPrimary }}>Playing XI Lineups</Text>
              <Text style={{ fontSize: 10, color: theme.colors.textSecondary, fontWeight: '600' }}>Tap to view</Text>
            </View>
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary }}>{match.team_a.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {match.team_a_lineup_set && lineups?.team_a?.players && (
                    <Text style={{ fontSize: 10, color: theme.colors.textSecondary }}>
                      ({lineups?.team_a?.players?.length ?? 0} Selected)
                    </Text>
                  )}
                  <View style={{ backgroundColor: match.team_a_lineup_set ? '#EBFBEF' : '#FFF8DC', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: match.team_a_lineup_set ? '#2E7D32' : '#A07800' }}>
                      {match.team_a_lineup_set ? '✓ Declared' : '✗ Pending'}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary }}>{match.team_b.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {match.team_b_lineup_set && lineups?.team_b?.players && (
                    <Text style={{ fontSize: 10, color: theme.colors.textSecondary }}>
                      ({lineups?.team_b?.players?.length ?? 0} Selected)
                    </Text>
                  )}
                  <View style={{ backgroundColor: match.team_b_lineup_set ? '#EBFBEF' : '#FFF8DC', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: match.team_b_lineup_set ? '#2E7D32' : '#A07800' }}>
                      {match.team_b_lineup_set ? '✓ Declared' : '✗ Pending'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Lineup Buttons for Captains */}
            {match.status === 'scheduled' && isEitherCaptain && (
              <TouchableOpacity
                activeOpacity={0.8}
                style={{
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.radius.sm,
                  paddingVertical: 6,
                  alignItems: 'center',
                  marginTop: 8,
                  width: '100%',
                }}
                onPress={() => router.push(`/sports/cricket/matches/${match.id}/lineup`)}
              >
                <Text style={{ color: theme.colors.onPrimary, fontWeight: '700', fontSize: 12 }}>
                  {isTeamACaptain
                    ? match.team_a_lineup_set ? 'Edit My Playing XI' : 'Declare My Playing XI'
                    : match.team_b_lineup_set ? 'Edit My Playing XI' : 'Declare My Playing XI'}
                </Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        )}

        {match.status === 'completed' && (
          <MatchScorecard match={match} lineups={lineups} />
        )}

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

          {match.status === 'completed' && match.result_submitted_at && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.infoRow}>
                <Clock size={18} color={theme.colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Completed At</Text>
                  <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
                    {formatMatchDate(match.result_submitted_at)}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Action button area */}
        {renderActionArea()}
      </ScrollView>

      {/* MODAL: Read-only Lineups Viewer (Bottom Sheet style) */}
      <Modal
        visible={lineupsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setLineupsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.drawerBackdrop}
          activeOpacity={1}
          onPress={() => setLineupsModalVisible(false)}
        >
          <View style={[styles.drawerContentContainer, { backgroundColor: theme.colors.surface, paddingBottom: Math.max(24, insets.bottom + 12) }]}>
            <View style={styles.drawerDragHandle} />
            <Text style={[styles.drawerTitleText, { color: theme.colors.textPrimary }]}>
              Declared Playing XI Lineups
            </Text>

            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              {/* Team A Lineup */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.primary, marginBottom: 8 }}>
                  {match.team_a.name}
                </Text>
                {(match.team_a_lineup_set && (lineups?.team_a?.players?.length ?? 0) > 0) ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {lineups?.team_a?.players?.map((player: any, idx: number) => (
                      <View
                        key={idx}
                        style={{
                          backgroundColor: theme.colors.background,
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                          borderRadius: 16,
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                        }}
                      >
                        <Text style={{ fontSize: 12, color: theme.colors.textPrimary, fontWeight: '500' }}>
                          {player.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={{ fontStyle: 'italic', fontSize: 13, color: theme.colors.textSecondary }}>
                    No lineup declared yet.
                  </Text>
                )}
              </View>

              {/* Team B Lineup */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.primary, marginBottom: 8 }}>
                  {match.team_b.name}
                </Text>
                {(match.team_b_lineup_set && (lineups?.team_b?.players?.length ?? 0) > 0) ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {lineups?.team_b?.players?.map((player: any, idx: number) => (
                      <View
                        key={idx}
                        style={{
                          backgroundColor: theme.colors.background,
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                          borderRadius: 16,
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                        }}
                      >
                        <Text style={{ fontSize: 12, color: theme.colors.textPrimary, fontWeight: '500' }}>
                          {player.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={{ fontStyle: 'italic', fontSize: 13, color: theme.colors.textSecondary }}>
                    No lineup declared yet.
                  </Text>
                )}
              </View>
            </ScrollView>

            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.drawerCloseBtn, { borderColor: theme.colors.border }]}
              onPress={() => setLineupsModalVisible(false)}
            >
              <Text style={{ color: theme.colors.textPrimary, fontWeight: '600', fontSize: 15 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <ShareBottomSheet
        isOpen={isShareSheetOpen}
        onClose={() => setIsShareSheetOpen(false)}
        onSelect={handleShareOptionSelect}
        matchTitle={`${match.team_a.name} vs ${match.team_b.name}`}
      />

      {/* Share preparation loading overlay — shown immediately after option selection */}
      <Modal
        transparent
        visible={isSharePreparing}
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.shareOverlay}>
          <View style={[styles.shareOverlayCard, { backgroundColor: theme.colors.elevated }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.shareOverlayTitle, { color: theme.colors.textPrimary }]}>
              Preparing scorecard...
            </Text>
            <Text style={[styles.shareOverlaySubtitle, { color: theme.colors.textSecondary }]}>
              Creating your shareable image
            </Text>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
    paddingBottom: 20,
  },
  statusCard: {
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 4,
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
  statusSub: {
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    padding: 8,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 4,
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
    fontSize: 18,
    fontWeight: '700',
  },
  teamName: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 1,
  },
  captainLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  teamScore: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  vsMiddle: {
    flex: 0.4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vsText: {
    fontSize: 14,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 3,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    marginBottom: 1,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 6,
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
    paddingVertical: 4,
  },
  lineupStatusItem: {
    flex: 1,
    alignItems: 'center',
  },
  lineupTeamName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  verticalDivider: {
    width: 1,
    height: 28,
  },
  lineupActionBtn: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Full-screen overlay shown while share preview is being prepared
  shareOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareOverlayCard: {
    borderRadius: 20,
    paddingVertical: 36,
    paddingHorizontal: 40,
    alignItems: 'center',
    gap: 14,
    minWidth: 220,
  },
  shareOverlayTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  shareOverlaySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: -6,
  },
  lineupCard: {
    padding: 10,
    borderWidth: 1,
  },
  sectionTitleCompact: {
    fontSize: 13,
    fontWeight: '700',
  },
  lineupStatusCompactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  lineupStatusCompactCol: {
    flex: 1,
    alignItems: 'center',
  },
  lineupTeamNameCompact: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  verticalDividerCompact: {
    width: 1,
    height: 32,
  },
  lineupActionBtnCompact: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  drawerContentContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  drawerDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCCCCC',
    alignSelf: 'center',
    marginBottom: 16,
  },
  drawerTitleText: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  drawerCloseBtn: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
});

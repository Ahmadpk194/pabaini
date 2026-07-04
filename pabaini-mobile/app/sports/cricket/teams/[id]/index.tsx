import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Shield, Trophy, Calendar, Users } from 'lucide-react-native';
import { useTheme } from '../../../../../src/context/ThemeContext';
import { safeRouterPush } from '../../../../../src/navigation/safeNavigation';
import { useSportsStore } from '../../../../../src/store/sports/sportsStore';
import { useTeamsStore } from '../../../../../src/store/sports/teamsStore';
import {
  getTeamById,
  requestToJoinTeam,
  acceptMembership,
  rejectMembership,
  removeMember,
} from '../../../../../src/services/sports/cricketTeamsApi';
import { TeamFull, TeamMember } from '../../../../../src/types/sports.types';
import { TeamHeroHeader } from '../../../../../src/components/sports/teams/TeamHeroHeader';
import { SquadMemberRow } from '../../../../../src/components/sports/teams/SquadMemberRow';
import { useAuth } from '../../../../../src/hooks/useAuth';
import { useAuthPromptStore } from '../../../../../src/store/authPromptStore';
import { LoginRequiredGate } from '../../../../../src/components/ui/LoginRequiredGate';
import { useMatches } from '../../../../../src/hooks/useMatches';
import { MatchCard } from '../../../../../src/components/sports/matches/MatchCard';
import { TeamProfileSkeleton } from '../../../../../src/components/skeletons';

type ProfileTab = 'squad' | 'stats' | 'matches';

export default function TeamProfileScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const teamId = typeof id === 'string' ? parseInt(id, 10) : parseInt(id?.[0] || '0', 10);
  const fetchMyTeams = useTeamsStore((state) => state.fetchMyTeams);
  const { isGuest } = useAuth();
  const insets = useSafeAreaInsets();

  // Get current user registration & profile from Zustand
  const isRegistered = useSportsStore((state) => state.isRegistered('cricket'));
  const myProfile = useSportsStore((state) => state.registrations['cricket']?.profile);

  // Screen state
  const [team, setTeam] = useState<TeamFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>('squad');

  // Queries
  const { data: teamMatchesResponse, isLoading: isLoadingMatches } = useMatches({ team_id: teamId });
  const teamMatches = Array.isArray(teamMatchesResponse)
    ? teamMatchesResponse
    : (teamMatchesResponse?.data || []);

  const loadTeamDetails = useCallback(async (showLoader = true) => {
    if (isGuest) return;
    if (showLoader) setLoading(true);
    try {
      const data = await getTeamById(teamId);
      setTeam(data);
    } catch (error) {
      console.error('Failed to load team details:', error);
      Alert.alert('Error', 'Failed to retrieve team details');
    } finally {
      setLoading(false);
    }
  }, [teamId, isGuest]);

  useEffect(() => {
    if (teamId && !isGuest) {
      loadTeamDetails();
    }
  }, [teamId, isGuest]);

  // Determine viewer relationship state
  const getViewerState = () => {
    if (loading || !team) return 'loading';
    if (!isRegistered || !myProfile) return 'unregistered';

    const myMember = team.members.find((m) => m.player.id === myProfile.id);
    if (!myMember) return 'non_member';

    if (myMember.status === 'active') {
      return myMember.role === 'captain' ? 'captain' : 'member';
    }
    if (myMember.status === 'pending_request') return 'pending_request';
    if (myMember.status === 'pending_invite') return 'pending_invite';

    return 'non_member';
  };

  const viewerState = getViewerState();
  const myMemberRecord = team?.members.find((m) => m.player.id === myProfile?.id);

  // Action Handlers
  const handleRequestToJoin = async () => {
    setActionLoading(true);
    try {
      await requestToJoinTeam(teamId);
      Alert.alert('Request Sent', 'Your request to join the team has been submitted to the captain.');
      await loadTeamDetails(false);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit join request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!myMemberRecord) return;
    setActionLoading(true);
    try {
      await acceptMembership(teamId, myMemberRecord.id);
      Alert.alert('Success', `You have joined ${team?.name}!`);
      await fetchMyTeams();
      await loadTeamDetails(false);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to accept invitation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineInvite = async () => {
    if (!myMemberRecord) return;
    setActionLoading(true);
    try {
      await rejectMembership(teamId, myMemberRecord.id);
      Alert.alert('Declined', 'Invitation declined.');
      await loadTeamDetails(false);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to decline invitation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveTeam = () => {
    if (!myMemberRecord) return;
    Alert.alert(
      'Leave Team',
      `Are you sure you want to leave ${team?.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await removeMember(teamId, myMemberRecord.id);
              Alert.alert('Left Team', `You are no longer a member of ${team?.name}.`);
              await fetchMyTeams();
              await loadTeamDetails(false);
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to leave the team.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // Render Action Area
  const renderActionArea = () => {
    if (loading || actionLoading) {
      return (
        <View style={styles.actionContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      );
    }

    switch (viewerState) {
      case 'unregistered':
        return (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.colors.primary, borderRadius: 24 }]}
              onPress={() => {
                if (isGuest) {
                  useAuthPromptStore.getState().showPrompt({
                    title: 'Player Profile Required',
                    description: 'You must log in to create a player profile and join a team.',
                  });
                  return;
                }
                safeRouterPush(router, '/sports/cricket/onboarding/role');
              }}
            >
              <Text style={[styles.actionBtnText, { color: theme.colors.onPrimary }]}>
                Complete Player Profile to Join
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'captain':
        return (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.colors.primary, borderRadius: 24 }]}
              onPress={() => safeRouterPush(router, `/sports/cricket/teams/${teamId}/manage`)}
            >
              <Text style={[styles.actionBtnText, { color: theme.colors.onPrimary }]}>
                Manage Team (Captain)
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'member':
        return (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: theme.colors.urgentBg,
                  borderColor: theme.colors.border,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderRadius: 24,
                },
              ]}
              onPress={handleLeaveTeam}
            >
              <Text style={[styles.actionBtnText, { color: theme.colors.urgentText }]}>
                Leave Team
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'pending_request':
        return (
          <View style={styles.actionContainer}>
            <View style={[styles.disabledBtn, { backgroundColor: theme.colors.border, borderRadius: 24 }]}>
              <Text style={[styles.disabledBtnText, { color: theme.colors.textSecondary }]}>
                Join Request Pending
              </Text>
            </View>
          </View>
        );

      case 'pending_invite':
        return (
          <View style={[styles.actionContainer, styles.rowButtons]}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.halfBtn, { backgroundColor: theme.colors.primary, borderRadius: 24 }]}
              onPress={handleAcceptInvite}
            >
              <Text style={[styles.actionBtnText, { color: theme.colors.onPrimary }]}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.halfBtn,
                {
                  backgroundColor: theme.colors.urgentBg,
                  borderColor: theme.colors.border,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderRadius: 24,
                },
              ]}
              onPress={handleDeclineInvite}
            >
              <Text style={[styles.actionBtnText, { color: theme.colors.urgentText }]}>Decline</Text>
            </TouchableOpacity>
          </View>
        );

      case 'non_member':
        return (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.colors.primary, borderRadius: 24 }]}
              onPress={handleRequestToJoin}
            >
              <Text style={[styles.actionBtnText, { color: theme.colors.onPrimary }]}>
                Request to Join Team
              </Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  if (isGuest) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.surface }]}>
        {/* Header Bar */}
        <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color={theme.colors.textPrimary} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Team Profile</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <LoginRequiredGate title="Team Profile" description="Please log in to view team profiles and player rosters." fullscreen={false} />
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return <TeamProfileSkeleton />;
  }

  if (!team) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContainer}>
          <Text style={{ color: theme.colors.textSecondary }}>Team not found or has been deleted.</Text>
        </View>
      </SafeAreaView>
    );
  }



  const getTabButtonStyle = (tab: ProfileTab) => {
    const isActive = activeTab === tab;
    return [
      styles.tabButton,
      isActive ? {
        backgroundColor: theme.colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 1.5,
      } : {
        backgroundColor: theme.colors.border,
      },
    ];
  };

  const getTabIconColor = (tab: ProfileTab) => {
    return activeTab === tab ? theme.colors.primary : theme.colors.textSecondary;
  };

  const getTabTextColor = (tab: ProfileTab) => {
    return activeTab === tab ? theme.colors.textPrimary : theme.colors.textSecondary;
  };

  // Active squad list filtering
  const activeMembers = team.members.filter((m) => m.status === 'active');

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />

      <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Team Hero Header */}
        <TeamHeroHeader team={team} />

        {/* Team Description */}
        {team.description && (
          <View style={styles.descriptionSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>About the Team</Text>
            <Text style={[styles.descriptionText, { color: theme.colors.textSecondary }]}>
              {team.description}
            </Text>
          </View>
        )}

        {/* Action Button Area */}
        {renderActionArea()}

        {/* Tab Pills (Segmented Control) */}
        <View style={[styles.tabsContainer, { backgroundColor: theme.colors.elevated }]}>
          <TouchableOpacity
            style={getTabButtonStyle('squad')}
            onPress={() => setActiveTab('squad')}
            activeOpacity={0.8}
          >
            <Users size={15} color={getTabIconColor('squad')} />
            <Text style={[styles.tabText, { color: getTabTextColor('squad') }]}>
              Squad
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={getTabButtonStyle('stats')}
            onPress={() => setActiveTab('stats')}
            activeOpacity={0.8}
          >
            <Trophy size={15} color={getTabIconColor('stats')} />
            <Text style={[styles.tabText, { color: getTabTextColor('stats') }]}>
              Stats
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={getTabButtonStyle('matches')}
            onPress={() => setActiveTab('matches')}
            activeOpacity={0.8}
          >
            <Calendar size={15} color={getTabIconColor('matches')} />
            <Text style={[styles.tabText, { color: getTabTextColor('matches') }]}>
              Matches
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContentContainer}>
          {activeTab === 'squad' && (
            <View style={[styles.listCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              {activeMembers.map((member, index) => (
                <React.Fragment key={member.id}>
                  <SquadMemberRow member={member} borderless={true} />
                  {index < activeMembers.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                  )}
                </React.Fragment>
              ))}
            </View>
          )}

          {activeTab === 'stats' && (() => {
            if (isLoadingMatches) {
              return (
                <View style={styles.centerContainer}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                </View>
              );
            }

            const completed = teamMatches.filter(m => m.status === 'completed');
            const wins = completed.filter(m => m.winner_team_id === teamId).length;
            const losses = completed.filter(m => m.winner_team_id && m.winner_team_id !== teamId).length;
            const played = completed.length;
            const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;

            const live = teamMatches.filter(m => m.status === 'live').length;
            const upcoming = teamMatches.filter(m => m.status === 'scheduled' || m.status === 'pending_request').length;

            return (
              <View style={styles.statsContainer}>
                {/* Summary Grid */}
                <View style={styles.statsGrid}>
                  <View style={[styles.statBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>{played}</Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Played</Text>
                  </View>
                  <View style={[styles.statBox, { backgroundColor: theme.colors.eventBg, borderColor: theme.colors.border, borderWidth: StyleSheet.hairlineWidth }]}>
                    <Text style={[styles.statValue, { color: theme.colors.eventText }]}>{wins}</Text>
                    <Text style={[styles.statLabel, { color: theme.colors.eventText }]}>Wins</Text>
                  </View>
                  <View style={[styles.statBox, { backgroundColor: theme.colors.urgentBg, borderColor: theme.colors.border, borderWidth: StyleSheet.hairlineWidth }]}>
                    <Text style={[styles.statValue, { color: theme.colors.urgentText }]}>{losses}</Text>
                    <Text style={[styles.statLabel, { color: theme.colors.urgentText }]}>Losses</Text>
                  </View>
                </View>

                {/* Win Rate Banner */}
                <View style={[styles.statsRowBanner, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <View style={[styles.trophyIconContainer, { backgroundColor: theme.colors.warningLight }]}>
                    <Trophy size={16} color={theme.colors.warningText} fill={theme.colors.warningText} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.bannerTitle, { color: theme.colors.textPrimary }]}>Win Ratio: {winRate}%</Text>
                    <Text style={[styles.bannerSub, { color: theme.colors.textSecondary }]}>
                      Based on {played} completed matches
                    </Text>
                  </View>
                </View>

                {/* Additional Stats Details */}
                <View style={[styles.statsDetailsCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <View style={styles.detailsRow}>
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>Live Matches Right Now</Text>
                    <Text style={{ color: theme.colors.textPrimary, fontWeight: '700', fontSize: 14 }}>{live}</Text>
                  </View>
                  <View style={[styles.detailsDivider, { backgroundColor: theme.colors.border }]} />
                  <View style={styles.detailsRow}>
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>Upcoming Scheduled Challenges</Text>
                    <Text style={{ color: theme.colors.textPrimary, fontWeight: '700', fontSize: 14 }}>{upcoming}</Text>
                  </View>
                </View>
              </View>
            );
          })()}

          {activeTab === 'matches' && (() => {
            if (isLoadingMatches) {
              return (
                <View style={styles.centerContainer}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                </View>
              );
            }

            if (teamMatches.length === 0) {
              return (
                <View style={styles.comingSoon}>
                  <Calendar size={36} color={theme.colors.border} style={{ marginBottom: 8 }} />
                  <Text style={[styles.comingSoonTitle, { color: theme.colors.textPrimary }]}>No matches scheduled</Text>
                  <Text style={[styles.comingSoonDesc, { color: theme.colors.textSecondary }]}>
                    This team has no active, scheduled, or past challenges recorded yet.
                  </Text>
                </View>
              );
            }

            const liveMatches = teamMatches.filter(m => m.status === 'live');
            const upcomingMatches = teamMatches.filter(m => m.status === 'scheduled' || m.status === 'pending_request');
            const completedMatches = teamMatches.filter(m => m.status === 'completed' || m.status === 'cancelled' || m.status === 'no_result');

            return (
              <View style={{ gap: 20 }}>
                {liveMatches.length > 0 && (
                  <View style={{ gap: 10 }}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontSize: 15, marginBottom: 0 }]}>Live Matches</Text>
                    {liveMatches.map(m => (
                      <MatchCard key={m.id} match={m} onPress={() => safeRouterPush(router, `/sports/cricket/matches/${m.id}`)} />
                    ))}
                  </View>
                )}

                <View style={{ gap: 10 }}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontSize: 15, marginBottom: 0 }]}>Upcoming Matches</Text>
                  {upcomingMatches.length === 0 ? (
                    <Text style={{ color: theme.colors.textSecondary, fontStyle: 'italic', fontSize: 13 }}>No upcoming challenges scheduled.</Text>
                  ) : (
                    upcomingMatches.map(m => (
                      <MatchCard key={m.id} match={m} onPress={() => safeRouterPush(router, `/sports/cricket/matches/${m.id}`)} />
                    ))
                  )}
                </View>

                {completedMatches.length > 0 && (
                  <View style={{ gap: 10 }}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontSize: 15, marginBottom: 0 }]}>Past Match Results</Text>
                    {completedMatches.map(m => (
                      <MatchCard key={m.id} match={m} onPress={() => safeRouterPush(router, `/sports/cricket/matches/${m.id}`)} />
                    ))}
                  </View>
                )}
              </View>
            );
          })()}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollBody: {
    flex: 1,
  },
  descriptionSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 6,
  },
  actionContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
    justifyContent: 'center',
  },
  actionBtn: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  disabledBtn: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  halfBtn: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 4,
    marginHorizontal: 20,
    marginTop: 24,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  tabContentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  listCard: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 12,
  },
  comingSoon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  comingSoonDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  statsContainer: {
    gap: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsRowBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  bannerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  statsDetailsCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsDivider: {
    height: 0.5,
    marginVertical: 12,
  },
  trophyIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

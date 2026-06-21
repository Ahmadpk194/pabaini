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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Shield, Trophy, Calendar, Users } from 'lucide-react-native';
import { useTheme } from '../../../../../src/context/ThemeContext';
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

type ProfileTab = 'squad' | 'stats' | 'matches';

export default function TeamProfileScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const teamId = typeof id === 'string' ? parseInt(id, 10) : parseInt(id?.[0] || '0', 10);
  const fetchMyTeams = useTeamsStore((state) => state.fetchMyTeams);
  const { isGuest } = useAuth();

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
              style={[styles.actionBtn, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm }]}
              onPress={() => {
                if (isGuest) {
                  useAuthPromptStore.getState().showPrompt({
                    title: 'Player Profile Required',
                    description: 'You must log in to create a player profile and join a team.',
                  });
                  return;
                }
                router.push('/sports/cricket/onboarding/role');
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
              style={[styles.actionBtn, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm }]}
              onPress={() => router.push(`/sports/cricket/teams/${teamId}/manage`)}
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
              style={[styles.actionBtn, { backgroundColor: '#FCEBEB', borderColor: '#F7C5C5', borderWidth: 1, borderRadius: theme.radius.sm }]}
              onPress={handleLeaveTeam}
            >
              <Text style={[styles.actionBtnText, { color: '#791F1F' }]}>
                Leave Team
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'pending_request':
        return (
          <View style={styles.actionContainer}>
            <View style={[styles.disabledBtn, { backgroundColor: theme.colors.border, borderRadius: theme.radius.sm }]}>
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
              style={[styles.halfBtn, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm }]}
              onPress={handleAcceptInvite}
            >
              <Text style={[styles.actionBtnText, { color: theme.colors.onPrimary }]}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.halfBtn, { backgroundColor: '#FCEBEB', borderColor: '#F7C5C5', borderWidth: 1, borderRadius: theme.radius.sm }]}
              onPress={handleDeclineInvite}
            >
              <Text style={[styles.actionBtnText, { color: '#791F1F' }]}>Decline</Text>
            </TouchableOpacity>
          </View>
        );

      case 'non_member':
        return (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm }]}
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
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        {/* Header Bar */}
        <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color={theme.colors.textPrimary} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Team Profile</Text>
          <View style={{ width: 36 }} />
        </View>
        <LoginRequiredGate title="Team Profile" description="Please log in to view team profiles and player rosters." fullscreen={false} />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
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

  // Active squad list filtering
  const activeMembers = team.members.filter((m) => m.status === 'active');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={theme.colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Team Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Team Hero Header */}
        <TeamHeroHeader team={team} />

        {/* Team Description */}
        {team.description && (
          <View style={[styles.descriptionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.descriptionText, { color: theme.colors.textPrimary }]}>
              {team.description}
            </Text>
          </View>
        )}

        {/* Action Button Area */}
        {renderActionArea()}

        {/* Tab Pills */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabPill,
              activeTab === 'squad'
                ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                : { borderColor: theme.colors.border },
            ]}
            onPress={() => setActiveTab('squad')}
          >
            <Users size={16} color={activeTab === 'squad' ? '#FFFFFF' : theme.colors.textSecondary} />
            <Text style={[styles.tabText, { color: activeTab === 'squad' ? '#FFFFFF' : theme.colors.textSecondary }]}>
              Squad
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabPill,
              activeTab === 'stats'
                ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                : { borderColor: theme.colors.border },
            ]}
            onPress={() => setActiveTab('stats')}
          >
            <Trophy size={16} color={activeTab === 'stats' ? '#FFFFFF' : theme.colors.textSecondary} />
            <Text style={[styles.tabText, { color: activeTab === 'stats' ? '#FFFFFF' : theme.colors.textSecondary }]}>
              Stats
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabPill,
              activeTab === 'matches'
                ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                : { borderColor: theme.colors.border },
            ]}
            onPress={() => setActiveTab('matches')}
          >
            <Calendar size={16} color={activeTab === 'matches' ? '#FFFFFF' : theme.colors.textSecondary} />
            <Text style={[styles.tabText, { color: activeTab === 'matches' ? '#FFFFFF' : theme.colors.textSecondary }]}>
              Matches
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContentContainer}>
          {activeTab === 'squad' && (
            <View>
              {activeMembers.map((member) => (
                <SquadMemberRow key={member.id} member={member} />
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
                  <View style={[styles.statBox, { backgroundColor: '#EBFBEF', borderColor: '#C8E6C9' }]}>
                    <Text style={[styles.statValue, { color: '#2E7D32' }]}>{wins}</Text>
                    <Text style={[styles.statLabel, { color: '#2E7D32' }]}>Wins</Text>
                  </View>
                  <View style={[styles.statBox, { backgroundColor: '#FCEBEB', borderColor: '#F5C6CB' }]}>
                    <Text style={[styles.statValue, { color: '#C62828' }]}>{losses}</Text>
                    <Text style={[styles.statLabel, { color: '#C62828' }]}>Losses</Text>
                  </View>
                </View>

                {/* Win Rate Banner */}
                <View style={[styles.statsRowBanner, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <Trophy size={20} color="#D4A700" />
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
                      <MatchCard key={m.id} match={m} onPress={() => router.push(`/sports/cricket/matches/${m.id}`)} />
                    ))}
                  </View>
                )}

                <View style={{ gap: 10 }}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontSize: 15, marginBottom: 0 }]}>Upcoming Matches</Text>
                  {upcomingMatches.length === 0 ? (
                    <Text style={{ color: theme.colors.textSecondary, fontStyle: 'italic', fontSize: 13 }}>No upcoming challenges scheduled.</Text>
                  ) : (
                    upcomingMatches.map(m => (
                      <MatchCard key={m.id} match={m} onPress={() => router.push(`/sports/cricket/matches/${m.id}`)} />
                    ))
                  )}
                </View>

                {completedMatches.length > 0 && (
                  <View style={{ gap: 10 }}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontSize: 15, marginBottom: 0 }]}>Past Match Results</Text>
                    {completedMatches.map(m => (
                      <MatchCard key={m.id} match={m} onPress={() => router.push(`/sports/cricket/matches/${m.id}`)} />
                    ))}
                  </View>
                )}
              </View>
            );
          })()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  descriptionCard: {
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionContainer: {
    height: 48,
    marginHorizontal: 16,
    marginTop: 16,
    justifyContent: 'center',
  },
  actionBtn: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  disabledBtn: {
    height: '100%',
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
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 24,
    gap: 10,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  tabContentContainer: {
    padding: 16,
    paddingBottom: 40,
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
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
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
    borderRadius: 12,
    borderWidth: 1,
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
    borderRadius: 12,
    borderWidth: 1,
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
});

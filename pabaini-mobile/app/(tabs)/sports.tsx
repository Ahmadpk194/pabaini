import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/context/ThemeContext';
import { safeRouterPush } from '../../src/navigation/safeNavigation';
import { useAuth } from '../../src/hooks/useAuth';
import { useAuthPromptStore } from '../../src/store/authPromptStore';
import { useSportsStore } from '../../src/store/sports/sportsStore';
import { useTeamsStore } from '../../src/store/sports/teamsStore';
import { useNotificationsStore } from '../../src/store/notificationsStore';
import { getAllTeams } from '../../src/services/sports/cricketTeamsApi';
import { TeamCard, getTeamColor } from '../../src/components/sports/teams/TeamCard';
import { NotificationBell } from '../../src/components/notifications';
import { SportsOptIn } from '../../src/components/sports/common/SportsOptIn';
import { SetupBanner } from '../../src/components/sports/common/SetupBanner';
import { ComingSoonState } from '../../src/components/sports/common/ComingSoonState';
import { CricketPlayerCard } from '../../src/components/sports/cricket/CricketPlayerCard';
import {
  PlayerCardSkeleton,
  TeamCardSkeleton,
  DiscoverTeamCardSkeleton,
  SkeletonCircle,
  SkeletonBox,
} from '../../src/components/skeletons';
import { Avatar } from '../../src/components/ui/Avatar';
import client from '../../src/api/client';
import { CricketPlayerProfile, TeamSummary } from '../../src/types/sports.types';
import { Shield, Trophy, Calendar, Users, Award, MapPin } from 'lucide-react-native';
import { useMatches } from '../../src/hooks/useMatches';
import { MatchCard } from '../../src/components/sports/matches/MatchCard';
import Ionicons from '@expo/vector-icons/Ionicons';

function RegularPlayerSkeleton() {
  const { theme } = useTheme();
  return (
    <View
      style={{
        padding: 12,
        marginBottom: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <SkeletonCircle size={44} />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <SkeletonBox width={100} height={14} borderRadius={4} />
          <SkeletonBox width={60} height={16} borderRadius={4} />
        </View>
        <SkeletonBox width={150} height={12} borderRadius={3} />
      </View>
    </View>
  );
}

const TABS = [
  { id: 'players', name: 'Players', icon: Users },
  { id: 'teams', name: 'Teams', icon: Shield },
  { id: 'matches', name: 'Matches', icon: Calendar },
  { id: 'leaderboard', name: 'Leaders', icon: Trophy },
];

const ROLE_LABELS: Record<string, string> = {
  batsman: 'Batsman',
  bowler: 'Bowler',
  allrounder: 'All-rounder',
  keeper: 'Wicket-keeper',
};

export default function SportsScreen() {
  const { theme, mode } = useTheme();
  const { user, isGuest } = useAuth();
  const router = useRouter();
  const teamsScrollViewRef = useRef<ScrollView>(null);
  const { width: screenWidth } = useWindowDimensions();
  const discoverCardWidth = (screenWidth - 32 - 12) / 2.3;

  // Zustand Store
  const seenOptIn = useSportsStore((state) => state.seenOptIn['cricket']);
  const markOptInSeen = useSportsStore((state) => state.markOptInSeen);
  const registrations = useSportsStore((state) => state.registrations['cricket']);
  const setRegistration = useSportsStore((state) => state.setRegistration);
  const clearRegistration = useSportsStore((state) => state.clearRegistration);

  const isRegistered = !!(registrations && registrations.isRegistered && registrations.profile);
  const myProfile = registrations?.profile;

  // Local state
  const [activeTab, setActiveTab] = useState('players');
  const [players, setPlayers] = useState<CricketPlayerProfile[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // Tracks whether the user's sports profile is currently syncing from the backend
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Teams local state & store bindings
  const myTeams = useTeamsStore((state) => state.myTeams);
  const captainedTeamsCount = myTeams.filter((t) => t.role === 'captain').length;
  const isAtCaptainLimit = captainedTeamsCount >= 2;
  const [allTeams, setAllTeams] = useState<TeamSummary[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [refreshingTeams, setRefreshingTeams] = useState(false);

  // Notifications unread count polling
  const fetchUnreadCount = useNotificationsStore((state) => state.fetchUnreadCount);
  const unreadCount = useNotificationsStore((state) => state.unreadCount);

  const handleBellPress = () => {
    if (isGuest) {
      useAuthPromptStore.getState().showPrompt({
        title: 'Notifications Required',
        description: 'You must log in to view notifications.',
      });
      return;
    }
    safeRouterPush(router, '/notifications');
  };

  // Matches query hook
  const {
    data: matchesResponse,
    isLoading: isLoadingMatches,
    refetch: refetchMatches,
    isRefetching: isRefetchingMatches,
  } = useMatches();

  useFocusEffect(
    useCallback(() => {
      if (isGuest) return;
      fetchUnreadCount();
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 35000); // light poll every ~35s, only while Sports tab is focused

      return () => clearInterval(interval);
    }, [fetchUnreadCount, isGuest])
  );

  const fetchTeamsData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoadingTeams(true);
    try {
      const data = await getAllTeams();
      setAllTeams(data || []);

      if (isRegistered) {
        await useTeamsStore.getState().fetchMyTeams();
      }
    } catch (error) {
      console.error('Error fetching teams data:', error);
    } finally {
      setLoadingTeams(false);
    }
  }, [isRegistered]);

  useEffect(() => {
    if (activeTab === 'teams') {
      fetchTeamsData(true);
    }
  }, [activeTab, fetchTeamsData]);

  const handleRefreshTeams = async () => {
    setRefreshingTeams(true);
    await fetchTeamsData(false);
    setRefreshingTeams(false);
  };

  // Sync user profile with backend
  // Shows a full screen loader on initial sync to prevent UI onboarding flash
  const syncProfile = useCallback(async (showLoader = false) => {
    if (isGuest || !user) {
      setLoadingProfile(false);
      return;
    }
    if (showLoader) {
      setLoadingProfile(true);
    }
    try {
      const response = await client.get('/sports/cricket/players/me');
      if (response.data?.data) {
        setRegistration('cricket', response.data.data);
      } else {
        clearRegistration('cricket');
      }
    } catch (err) {
      const error = err as { response?: { status: number } };
      if (error.response?.status === 404) {
        clearRegistration('cricket');
      } else {
        console.error('Error syncing profile:', err);
      }
    } finally {
      if (showLoader) {
        setLoadingProfile(false);
      }
    }
  }, [isGuest, user, setRegistration, clearRegistration]);

  // Fetch all players list
  const fetchPlayers = useCallback(
    async (targetPage: number, isRefresh: boolean = false) => {
      if (loading || (targetPage > totalPages && !isRefresh)) return;

      try {
        if (isRefresh) {
          setPage(1);
        }

        if (targetPage === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const response = await client.get('/sports/cricket/players', {
          params: { page: targetPage, limit: 15 },
        });

        const result = response.data?.data;
        if (result) {
          if (isRefresh) {
            setPlayers(result.data || []);
          } else {
            setPlayers((prev) => [...prev, ...(result.data || [])]);
          }
          setTotalPages(result.lastPage || 1);
          setPage(targetPage);
        }
      } catch (err) {
        console.error('Error fetching players list:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [loading, totalPages]
  );

  // Initial load
  // Synchronizes profile from backend on mount, showing full screen loader
  useEffect(() => {
    if (isGuest) {
      setLoadingProfile(false);
      return;
    }
    syncProfile(true);
    fetchPlayers(1, true);
  }, [isGuest]);

  // Refresh feed and profile data
  // Does not trigger full screen profile loader to maintain pull-to-refresh context
  const handleRefresh = async () => {
    setRefreshing(true);
    await syncProfile(false);
    await fetchPlayers(1, true);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore && !loading) {
      fetchPlayers(page + 1);
    }
  };

  const handleRegisterPress = () => {
    if (isGuest) {
      useAuthPromptStore.getState().showPrompt({
        title: 'Player Setup Required',
        description: 'You must log in to register as a cricket player, manage teams, and declare lineups.',
      });
      return;
    }
    safeRouterPush(router, '/sports/cricket/onboarding/role');
  };

  const handleJustBrowsing = () => {
    markOptInSeen('cricket');
  };

  // 1. Render Opt-in Overlay Screen
  if (!loadingProfile && !seenOptIn && !isRegistered && !isGuest) {
    return (
      <SportsOptIn
        onRegisterCricket={handleRegisterPress}
        onJustBrowsing={handleJustBrowsing}
      />
    );
  }

  // Helper render for single other player item
  const renderPlayerItem = ({ item }: { item: CricketPlayerProfile }) => {
    // Skip rendering self in list if already displayed at the top
    if (isRegistered && myProfile && item.user.id === myProfile.user.id) {
      return null;
    }

    const battingText = `${item.batting_hand === 'right' ? 'Right' : 'Left'}-hand`;
    let bowlingText = 'No bowling';
    if (item.bowling_arm && item.bowling_arm !== 'none' && item.bowling_type && item.bowling_type !== 'none') {
      const arm = item.bowling_arm === 'right' ? 'Right-arm' : 'Left-arm';
      const type = item.bowling_type.charAt(0).toUpperCase() + item.bowling_type.slice(1);
      bowlingText = `${arm} ${type}`;
    }

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => safeRouterPush(router, `/profile/${item.user.id}`)}
        style={[styles.playerCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      >
        <Avatar uri={item.user.avatar_url} size={44} name={item.user.name} />
        <View style={styles.playerInfo}>
          <View style={styles.playerMetaHeader}>
            <Text style={[styles.playerName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
              {item.user.name}
            </Text>
            <View style={[styles.playerRoleBadge, { backgroundColor: `${theme.colors.primary}15`, borderColor: `${theme.colors.primary}30`, borderWidth: 1 }]}>
              <Text style={[styles.playerRoleText, { color: theme.colors.primary }]}>
                {ROLE_LABELS[item.role]}
              </Text>
            </View>
          </View>
          <Text style={[styles.playerStyles, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            🏏 {battingText} · ⚾ {bowlingText}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Header component for FlatList to avoid nested scrolling issues
  const renderListHeader = () => {
    return (
      <View style={styles.feedHeader}>
        {/* Banner prompting user to complete profile if they skipped */}
        {!loadingProfile && !isRegistered && <SetupBanner onPress={handleRegisterPress} />}

        {/* User's Premium Player Card at the top */}
        {!loadingProfile && isRegistered && myProfile && (
          <View style={styles.myProfileSection}>
            <View style={styles.sectionHeader}>
              <Award color={theme.colors.primary} size={20} />
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Your Player Profile</Text>
            </View>
            <CricketPlayerCard
              profile={myProfile}
              onPress={() => safeRouterPush(router, `/profile/${myProfile.user.id}`)}
            />
          </View>
        )}

        {/* Section title for other players */}
        {players.length > 0 && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Users color={theme.colors.primary} size={20} />
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                {isRegistered ? 'Other Registered Players' : 'Registered Players'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => safeRouterPush(router, '/sports/cricket/players')}>
              <Text style={{ color: theme.colors.primary, fontWeight: '600', fontSize: 13 }}>See All</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // Footer for list loader
  const renderListFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  // Empty state when no players are registered
  // Empty state when no players are registered
  const renderListEmpty = () => {
    if (loading || loadingProfile) {
      const showProfileSkeleton = loadingProfile || !isRegistered;
      return (
        <View style={{ gap: 10, marginTop: 10 }}>
          {/* Your Profile Skeleton */}
          {showProfileSkeleton && (
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Award color={theme.colors.primary} size={20} />
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Your Player Profile</Text>
              </View>
              <PlayerCardSkeleton />
            </View>
          )}

          {/* Other Registered Players Skeleton */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: showProfileSkeleton ? 18 : 8, marginBottom: 12 }}>
            <Users color={theme.colors.primary} size={20} />
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              {isRegistered ? 'Other Registered Players' : 'Registered Players'}
            </Text>
          </View>

          <RegularPlayerSkeleton />
          <RegularPlayerSkeleton />
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          No other players are registered yet.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]} edges={['top', 'left', 'right']}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {/* Premium Header */}
        <View
          style={[
            styles.appBar,
            {
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.border,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            },
          ]}
        >
          <Text
            style={[styles.appBarTitle, { color: theme.colors.textPrimary, flex: 1, marginRight: 10 }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            Sports
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {activeTab === 'teams' && isRegistered && (
              <TouchableOpacity
                disabled={isAtCaptainLimit}
                onPress={() => safeRouterPush(router, '/sports/cricket/teams/create')}
                style={{
                  backgroundColor: isAtCaptainLimit ? theme.colors.border : theme.colors.primary,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 16,
                }}
              >
                <Text style={{ color: isAtCaptainLimit ? theme.colors.textSecondary : theme.colors.onPrimary, fontSize: 12, fontWeight: '700' }}>
                  + Create Team
                </Text>
              </TouchableOpacity>
            )}
            {activeTab === 'matches' && isRegistered && captainedTeamsCount > 0 && (
              <TouchableOpacity
                onPress={() => safeRouterPush(router, '/sports/cricket/matches/request')}
                style={{
                  backgroundColor: theme.colors.primary,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 16,
                }}
              >
                <Text style={{ color: theme.colors.onPrimary, fontSize: 12, fontWeight: '700' }}>
                  + Challenge
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.searchButton, { backgroundColor: theme.colors.elevated }]}
              onPress={() => safeRouterPush(router, '/search')}
              activeOpacity={0.7}
            >
              <Ionicons name="search-outline" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bellButton, { backgroundColor: theme.colors.elevated }]}
              onPress={handleBellPress}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={20} color={theme.colors.textSecondary} />
              {unreadCount > 0 && (
                <View style={[
                  styles.bellBadge,
                  {
                    backgroundColor: theme.colors.danger,
                    borderColor: theme.colors.onPrimary,
                  }
                ]} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs Selector */}
        {!isGuest && (
          <View style={[styles.tabsContainer, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.tabsWrapper, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                const TabIcon = tab.icon;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    onPress={() => setActiveTab(tab.id)}
                    style={[
                      styles.tabButton,
                      isActive && {
                        backgroundColor: theme.colors.primary,
                        shadowColor: theme.colors.primary,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 3,
                        elevation: 2,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <TabIcon
                      color={isActive ? theme.colors.onPrimary : theme.colors.textSecondary}
                      size={14}
                    />
                    <Text
                      style={[
                        styles.tabText,
                        {
                          color: isActive ? theme.colors.onPrimary : theme.colors.textSecondary,
                          fontWeight: isActive ? '700' : '600',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {tab.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Main Tab Views */}
        {isGuest ? (
          (() => {
            const matches = Array.isArray(matchesResponse)
              ? matchesResponse
              : (matchesResponse?.data || []);
            const liveMatches = matches.filter(m => m.status === 'live');
            const upcomingMatches = matches.filter(m => m.status === 'scheduled' || m.status === 'pending_request');
            const completedMatches = matches.filter(m => m.status === 'completed' || m.status === 'cancelled' || m.status === 'no_result');

            return (
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={isRefetchingMatches}
                    onRefresh={refetchMatches}
                    colors={[theme.colors.primary]}
                    tintColor={theme.colors.primary}
                  />
                }
              >
                {/* Setup Banner prompting profile setup */}
                <View style={{ marginTop: 8 }}>
                  <SetupBanner onPress={handleRegisterPress} />
                </View>

                <View style={{ gap: 20, paddingTop: 10 }}>
                  {liveMatches.length > 0 && (
                    <View style={{ gap: 10 }}>
                      <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Live Matches</Text>
                      {liveMatches.map(m => (
                        <MatchCard key={m.id} match={m} onPress={() => safeRouterPush(router, `/sports/cricket/matches/${m.id}`)} />
                      ))}
                    </View>
                  )}

                  <View style={{ gap: 10 }}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Upcoming Matches</Text>
                    {upcomingMatches.length === 0 ? (
                      <Text style={{ color: theme.colors.textSecondary, fontStyle: 'italic', fontSize: 13 }}>No upcoming matches scheduled.</Text>
                    ) : (
                      upcomingMatches.map(m => (
                        <MatchCard key={m.id} match={m} onPress={() => safeRouterPush(router, `/sports/cricket/matches/${m.id}`)} />
                      ))
                    )}
                  </View>

                  <View style={{ gap: 10 }}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Completed Matches</Text>
                    {completedMatches.length === 0 ? (
                      <Text style={{ color: theme.colors.textSecondary, fontStyle: 'italic', fontSize: 13 }}>No completed matches found.</Text>
                    ) : (
                      completedMatches.map(m => (
                        <MatchCard key={m.id} match={m} onPress={() => safeRouterPush(router, `/sports/cricket/matches/${m.id}`)} />
                      ))
                    )}
                  </View>
                </View>
              </ScrollView>
            );
          })()
        ) : (
          <>
            {activeTab === 'players' && (
              <FlatList
                data={players}
                renderItem={renderPlayerItem}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={renderListHeader}
                ListFooterComponent={renderListFooter}
                ListEmptyComponent={renderListEmpty}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.3}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    colors={[theme.colors.primary]}
                    tintColor={theme.colors.primary}
                  />
                }
              />
            )}

            {activeTab === 'teams' && (
              <ScrollView
                ref={teamsScrollViewRef}
                style={{ flex: 1 }}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshingTeams}
                    onRefresh={handleRefreshTeams}
                    colors={[theme.colors.primary]}
                    tintColor={theme.colors.primary}
                  />
                }
              >
                {/* Banner/Setup prompting player registration */}
                {!loadingProfile && !isRegistered && (
                  <View style={{ marginTop: 8 }}>
                    <SetupBanner onPress={handleRegisterPress} />
                  </View>
                )}

                {/* My Teams Section (only if registered) */}
                {(isRegistered || loadingProfile) && (
                  <View style={styles.myTeamsSection}>
                    <View style={styles.sectionHeader}>
                      <Users color={theme.colors.primary} size={20} />
                      <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Your Teams</Text>
                    </View>

                    {(loadingTeams || loadingProfile) && myTeams.length === 0 ? (
                      <View style={{ gap: 10 }}>
                        <TeamCardSkeleton />
                        <TeamCardSkeleton />
                      </View>
                    ) : myTeams.length === 0 ? (
                      <View style={[styles.emptyContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radius.md, padding: 16, alignItems: 'center' }]}>
                        <Text style={[styles.emptyText, { color: theme.colors.textSecondary, textAlign: 'center', fontSize: 14, fontWeight: '500' }]}>
                          You haven't joined a team yet.
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12, width: '100%', justifyContent: 'center' }}>
                          <TouchableOpacity
                            disabled={isAtCaptainLimit}
                            activeOpacity={0.7}
                            style={{
                              flex: 1,
                              maxWidth: 140,
                              backgroundColor: isAtCaptainLimit ? theme.colors.border : theme.colors.primary,
                              paddingVertical: 10,
                              borderRadius: theme.radius.sm,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            onPress={() => safeRouterPush(router, '/sports/cricket/teams/create')}
                          >
                            <Text style={{ color: isAtCaptainLimit ? theme.colors.textSecondary : theme.colors.onPrimary, fontSize: 13, fontWeight: '700' }}>
                              Create Team
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            activeOpacity={0.7}
                            style={{
                              flex: 1,
                              maxWidth: 140,
                              backgroundColor: 'transparent',
                              borderColor: theme.colors.border,
                              borderWidth: 1,
                              paddingVertical: 10,
                              borderRadius: theme.radius.sm,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            onPress={() => {
                              // Scroll ScrollView to end where Discover/Explore is
                              teamsScrollViewRef.current?.scrollToEnd();
                            }}
                          >
                            <Text style={{ color: theme.colors.textPrimary, fontSize: 13, fontWeight: '700' }}>
                              Explore Teams
                            </Text>
                          </TouchableOpacity>
                        </View>
                        {isAtCaptainLimit && (
                          <Text style={{
                            color: theme.colors.textSecondary,
                            fontSize: 11,
                            marginTop: 8,
                            textAlign: 'center',
                          }}>
                            You're already captaining 2 teams. Transfer or dissolve one to create a new team.
                          </Text>
                        )}
                      </View>
                    ) : (
                      <>
                        {/* Active teams */}
                        {myTeams.filter((t) => t.status === 'active').map((t) => (
                          <TeamCard
                            key={t.id}
                            team={t}
                            showCaptainBadge={t.role === 'captain'}
                            onPress={() => safeRouterPush(router, `/sports/cricket/teams/${t.id}`)}
                          />
                        ))}

                        {isAtCaptainLimit && (
                          <Text style={{
                            color: theme.colors.textSecondary,
                            fontSize: 12,
                            marginTop: 4,
                            marginBottom: 12,
                            fontStyle: 'italic',
                          }}>
                            You're already captaining 2 teams. Transfer or dissolve one to create a new team.
                          </Text>
                        )}

                        {/* Pending join requests sent by the player */}
                        {myTeams.filter((t) => t.status === 'pending_request').map((t) => (
                          <TouchableOpacity
                            key={`req-${t.id}`}
                            activeOpacity={0.7}
                            onPress={() => safeRouterPush(router, `/sports/cricket/teams/${t.id}`)}
                            style={[styles.pendingCard, { backgroundColor: theme.colors.surface, borderColor: '#D4A700' }]}
                          >
                            <View style={styles.pendingCardLeft}>
                              <Text style={[styles.pendingCardName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                                {t.name}
                              </Text>
                              <Text style={styles.pendingCardSub}>
                                {t.home_ground || 'Tap to view team'}
                              </Text>
                            </View>
                            <View style={styles.pendingBadge}>
                              <Text style={styles.pendingBadgeText}>Request Pending</Text>
                            </View>
                          </TouchableOpacity>
                        ))}

                        {/* Pending invites received by the player */}
                        {myTeams.filter((t) => t.status === 'pending_invite').map((t) => (
                          <TouchableOpacity
                            key={`inv-${t.id}`}
                            activeOpacity={0.7}
                            onPress={() => safeRouterPush(router, `/sports/cricket/teams/${t.id}`)}
                            style={[styles.pendingCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary }]}
                          >
                            <View style={styles.pendingCardLeft}>
                              <Text style={[styles.pendingCardName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                                {t.name}
                              </Text>
                              <Text style={styles.pendingCardSub}>Invited to join — tap to accept</Text>
                            </View>
                            <View style={[styles.pendingBadge, { backgroundColor: `${theme.colors.primary}15`, borderColor: `${theme.colors.primary}50` }]}>
                              <Text style={[styles.pendingBadgeText, { color: theme.colors.primary }]}>Invited ›</Text>
                            </View>
                          </TouchableOpacity>
                        ))}

                        {/* Suggest creating own team if only pending items exist */}
                        {myTeams.every((t) => t.status !== 'active') && myTeams.length > 0 && (
                          <View style={{ marginTop: 8 }}>
                            <TouchableOpacity
                              disabled={isAtCaptainLimit}
                              style={{
                                backgroundColor: isAtCaptainLimit ? theme.colors.border : theme.colors.primary,
                                paddingHorizontal: 16,
                                paddingVertical: 8,
                                borderRadius: theme.radius.sm,
                                alignSelf: 'flex-start',
                              }}
                              onPress={() => safeRouterPush(router, '/sports/cricket/teams/create')}
                            >
                              <Text style={{ color: isAtCaptainLimit ? theme.colors.textSecondary : theme.colors.onPrimary, fontSize: 13, fontWeight: '700' }}>
                                + Create Your Own Team
                              </Text>
                            </TouchableOpacity>
                            {isAtCaptainLimit && (
                              <Text style={{
                                color: theme.colors.textSecondary,
                                fontSize: 12,
                                marginTop: 4,
                              }}>
                                You're already captaining 2 teams. Transfer or dissolve one to create a new team.
                              </Text>
                            )}
                          </View>
                        )}
                      </>
                    )}
                  </View>
                )}

                {/* Discover Teams Section (carousel) */}
                <View style={{ marginTop: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Shield color={theme.colors.primary} size={20} />
                      <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Discover Teams</Text>
                    </View>
                    <TouchableOpacity onPress={() => safeRouterPush(router, '/sports/cricket/teams')}>
                      <Text style={{ color: theme.colors.primary, fontWeight: '600', fontSize: 13 }}>See All</Text>
                    </TouchableOpacity>
                  </View>

                  {(loadingTeams || loadingProfile) && allTeams.length === 0 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 12, paddingBottom: 10 }}
                    >
                      <DiscoverTeamCardSkeleton />
                      <DiscoverTeamCardSkeleton />
                      <DiscoverTeamCardSkeleton />
                    </ScrollView>
                  ) : allTeams.length === 0 ? (
                    <View style={[styles.emptyContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radius.md, padding: 16 }]}>
                      <Text style={[styles.emptyText, { color: theme.colors.textSecondary, textAlign: 'center', fontSize: 13.5 }]}>
                        No teams available right now.
                      </Text>
                    </View>
                  ) : (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 12, paddingBottom: 10 }}
                    >
                      {allTeams.map((t) => {
                        const initials = t.name ? t.name.charAt(0).toUpperCase() : '?';
                        const fallbackBg = getTeamColor(t.name);

                        return (
                          <TouchableOpacity
                            key={t.id}
                            activeOpacity={0.7}
                            onPress={() => safeRouterPush(router, `/sports/cricket/teams/${t.id}`)}
                            style={{
                              width: discoverCardWidth,
                              backgroundColor: theme.colors.surface,
                              borderColor: theme.colors.border,
                              borderWidth: 1,
                              borderRadius: theme.radius.md,
                              padding: 10,
                            }}
                          >
                            {/* Horizontal Header Flow */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <View style={{ width: 32, height: 32, borderRadius: 16, overflow: 'hidden', backgroundColor: fallbackBg }}>
                                {t.logo_url ? (
                                  <Image source={{ uri: t.logo_url }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                                ) : (
                                  <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>
                                      {initials}
                                    </Text>
                                  </View>
                                )}
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ color: theme.colors.textPrimary, fontWeight: '700', fontSize: 12.5 }} numberOfLines={1}>
                                  {t.name}
                                </Text>
                                <Text style={{ color: theme.colors.textSecondary, fontSize: 10, marginTop: 1 }} numberOfLines={1}>
                                  {t.home_ground || 'No Home Ground'}
                                </Text>
                              </View>
                            </View>

                            {/* Divider Line */}
                            <View style={{ height: 0.5, backgroundColor: theme.colors.border, marginVertical: 8 }} />

                            {/* Player Count */}
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 10.5, fontWeight: '600' }}>
                              👥 {t.member_count} Players
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  )}
                </View>


              </ScrollView>
            )}

            {activeTab === 'matches' && (() => {
              const matches = Array.isArray(matchesResponse)
                ? matchesResponse
                : (matchesResponse?.data || []);
              const liveMatches = matches.filter(m => m.status === 'live');
              const upcomingMatches = matches.filter(m => m.status === 'scheduled' || m.status === 'pending_request');
              const completedMatches = matches.filter(m => m.status === 'completed' || m.status === 'cancelled' || m.status === 'no_result');

              return (
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  refreshControl={
                    <RefreshControl
                      refreshing={isRefetchingMatches}
                      onRefresh={refetchMatches}
                      colors={[theme.colors.primary]}
                      tintColor={theme.colors.primary}
                    />
                  }
                >
                  {/* Banner prompting user to complete profile */}
                  {!loadingProfile && !isRegistered && (
                    <View style={{ marginTop: 8 }}>
                      <SetupBanner onPress={handleRegisterPress} />
                    </View>
                  )}

                  {(isLoadingMatches || loadingProfile) && matches.length === 0 ? (
                    <View style={styles.loaderContainer}>
                      <ActivityIndicator size="large" color={theme.colors.primary} />
                    </View>
                  ) : matches.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyEmoji}>🏏</Text>
                      <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No matches scheduled</Text>
                      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                        No upcoming or live challenges are active at this moment.
                      </Text>
                      {isRegistered && captainedTeamsCount > 0 && (
                        <TouchableOpacity
                          style={[
                            styles.emptyBtn,
                            {
                              backgroundColor: theme.colors.primary,
                              borderRadius: theme.radius.sm,
                              marginTop: 12,
                            },
                          ]}
                          onPress={() => safeRouterPush(router, '/sports/cricket/matches/request')}
                        >
                          <Text style={[styles.emptyBtnText, { color: theme.colors.onPrimary }]}>
                            Challenge a Team
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : (
                    <View style={{ gap: 20, paddingTop: 10 }}>
                      {liveMatches.length > 0 && (
                        <View>
                          <View style={styles.sectionHeader}>
                            <View style={styles.liveBadgeDot} />
                            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Live Matches</Text>
                          </View>
                          {liveMatches.map((match) => (
                            <MatchCard
                              key={match.id}
                              match={match}
                              onPress={() => safeRouterPush(router, `/sports/cricket/matches/${match.id}`)}
                            />
                          ))}
                        </View>
                      )}

                      {upcomingMatches.length > 0 && (
                        <View>
                          <View style={styles.sectionHeader}>
                            <Calendar color={theme.colors.primary} size={20} />
                            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Upcoming Matches</Text>
                          </View>
                          {upcomingMatches.map((match) => (
                            <MatchCard
                              key={match.id}
                              match={match}
                              onPress={() => safeRouterPush(router, `/sports/cricket/matches/${match.id}`)}
                            />
                          ))}
                        </View>
                      )}

                      {completedMatches.length > 0 && (
                        <View>
                          <View style={styles.sectionHeader}>
                            <Trophy color={theme.colors.primary} size={20} />
                            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Completed Matches</Text>
                          </View>
                          {completedMatches.map((match) => (
                            <MatchCard
                              key={match.id}
                              match={match}
                              onPress={() => safeRouterPush(router, `/sports/cricket/matches/${match.id}`)}
                            />
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </ScrollView>
              );
            })()}

            {activeTab === 'leaderboard' && (
              <ComingSoonState
                title="Player Leaderboard"
                description="See who dominates the local leaderboard in runs, wickets, and MVP points."
                icon={<Trophy color={theme.colors.primary} size={36} />}
              />
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appBar: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 16,
    paddingRight: 16,
    borderBottomWidth: 1,
  },
  appBarTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  searchButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tabsWrapper: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 4,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  tabText: {
    fontSize: 11,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  feedHeader: {
    paddingTop: 6,
  },
  myProfileSection: {
    marginBottom: 12,
  },
  myTeamsSection: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 10,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  playerCard: {
    flexDirection: 'row',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.01,
    shadowRadius: 2,
    elevation: 0,
  },
  playerInfo: {
    flex: 1,
  },
  playerMetaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  playerRoleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  playerRoleText: {
    fontSize: 10,
    fontWeight: '700',
  },
  playerStyles: {
    fontSize: 12,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  pendingCardLeft: {
    flex: 1,
  },
  pendingCardName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  pendingCardSub: {
    fontSize: 12,
    color: '#888',
  },
  pendingBadge: {
    backgroundColor: '#FFF8DC',
    borderWidth: 1,
    borderColor: '#D4A700',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 10,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A07800',
  },
  liveBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D32F2F',
    marginRight: 2,
    alignSelf: 'center',
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginHorizontal: 32,
    marginBottom: 16,
  },
  emptyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

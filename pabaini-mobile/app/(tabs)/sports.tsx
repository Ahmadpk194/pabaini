import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/hooks/useAuth';
import { useSportsStore } from '../../src/store/sports/sportsStore';
import { SportsOptIn } from '../../src/components/sports/common/SportsOptIn';
import { SetupBanner } from '../../src/components/sports/common/SetupBanner';
import { ComingSoonState } from '../../src/components/sports/common/ComingSoonState';
import { CricketPlayerCard } from '../../src/components/sports/cricket/CricketPlayerCard';
import { Avatar } from '../../src/components/ui/Avatar';
import client from '../../src/api/client';
import { CricketPlayerProfile } from '../../src/types/sports.types';
import { Shield, Trophy, Calendar, Users, Award } from 'lucide-react-native';

const TABS = [
  { id: 'players', name: 'Players', icon: Users },
  { id: 'teams', name: 'Teams', icon: Shield },
  { id: 'matches', name: 'Matches', icon: Calendar },
  { id: 'leaderboard', name: 'Leaderboard', icon: Trophy },
];

const ROLE_LABELS: Record<string, string> = {
  batsman: 'Batsman',
  bowler: 'Bowler',
  allrounder: 'All-rounder',
  keeper: 'Wicket-keeper',
};

export default function SportsScreen() {
  const { theme } = useTheme();
  const { user, isGuest } = useAuth();
  const router = useRouter();

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

  // Sync user profile with backend
  const syncProfile = useCallback(async () => {
    if (isGuest || !user) return;
    try {
      const response = await client.get('/sports/cricket/players/me');
      if (response.data?.data) {
        setRegistration('cricket', response.data.data);
      } else {
        clearRegistration('cricket');
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        clearRegistration('cricket');
      } else {
        console.error('Error syncing profile:', error);
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
          params: { page: targetPage, limit: 10 },
        });

        const result = response.data?.data;
        if (result) {
          const fetchedPlayers = result.data || [];
          const meta = result.meta || { page: 1, totalPages: 1 };

          setPlayers((prev) => (isRefresh ? fetchedPlayers : [...prev, ...fetchedPlayers]));
          setPage(meta.page);
          setTotalPages(meta.totalPages);
        }
      } catch (error) {
        console.error('Error fetching players list:', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [loading, totalPages]
  );

  // Initial load
  useEffect(() => {
    syncProfile();
    fetchPlayers(1, true);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await syncProfile();
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
      Alert.alert(
        'Login Required',
        'You must log in to register as a cricket player and join matches.',
        [
          { text: 'Log In', onPress: () => router.replace('/(auth)/login') },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }
    router.push('/sports/cricket/onboarding/role');
  };

  const handleJustBrowsing = () => {
    markOptInSeen('cricket');
  };

  // 1. Render Opt-in Overlay Screen
  if (!seenOptIn && !isRegistered) {
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

    const battingText = `${item.batting_hand === 'right' ? 'Right' : 'Left'}-hand bat`;
    let bowlingText = 'No Bowling';
    if (item.bowling_arm && item.bowling_arm !== 'none' && item.bowling_type && item.bowling_type !== 'none') {
      const arm = item.bowling_arm === 'right' ? 'Right-arm' : 'Left-arm';
      const type = item.bowling_type.charAt(0).toUpperCase() + item.bowling_type.slice(1);
      bowlingText = `${arm} ${type}`;
    }

    return (
      <View style={[styles.playerCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Avatar uri={item.user.avatar_url} size={48} name={item.user.name} />
        <View style={styles.playerInfo}>
          <View style={styles.playerMetaHeader}>
            <Text style={[styles.playerName, { color: theme.colors.textPrimary }]}>{item.user.name}</Text>
            <View style={[styles.playerRoleBadge, { backgroundColor: `${theme.colors.primary}12` }]}>
              <Text style={[styles.playerRoleText, { color: theme.colors.primary }]}>
                {ROLE_LABELS[item.role]}
              </Text>
            </View>
          </View>
          <Text style={[styles.playerStyles, { color: theme.colors.textSecondary }]}>
            {battingText} • {bowlingText}
          </Text>
        </View>
      </View>
    );
  };

  // Header component for FlatList to avoid nested scrolling issues
  const renderListHeader = () => {
    return (
      <View style={styles.feedHeader}>
        {/* Banner prompting user to complete profile if they skipped */}
        {!isRegistered && <SetupBanner onPress={handleRegisterPress} />}

        {/* User's Premium Player Card at the top */}
        {isRegistered && myProfile && (
          <View style={styles.myProfileSection}>
            <View style={styles.sectionHeader}>
              <Award color={theme.colors.primary} size={20} />
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Your Player Profile</Text>
            </View>
            <CricketPlayerCard profile={myProfile} />
          </View>
        )}

        {/* Section title for other players */}
        {players.length > 0 && (
          <View style={styles.sectionHeader}>
            <Users color={theme.colors.primary} size={20} />
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              {isRegistered ? 'Other Registered Players' : 'Registered Players'}
            </Text>
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
  const renderListEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          No other players are registered yet.
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Premium Header */}
      <View style={[styles.appBar, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.appBarTitle, { color: theme.colors.textPrimary }]}>Pabaini Sports</Text>
      </View>

      {/* Tabs Selector */}
      <View style={[styles.tabsWrapper, { borderBottomColor: theme.colors.border }]}>
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
                  borderBottomColor: theme.colors.primary,
                  borderBottomWidth: 3,
                },
              ]}
              activeOpacity={0.8}
            >
              <TabIcon color={isActive ? theme.colors.primary : theme.colors.textSecondary} size={18} />
              <Text
                style={[
                  styles.tabText,
                  {
                    color: isActive ? theme.colors.primary : theme.colors.textSecondary,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
              >
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Main Tab Views */}
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
        <ComingSoonState
          title="Team Squads"
          description="Village teams, squads roster, and captain updates will be available soon."
          icon={<Shield color={theme.colors.primary} size={36} />}
        />
      )}

      {activeTab === 'matches' && (
        <ComingSoonState
          title="Match Schedules"
          description="Track local tournament schedules, scores, and fixture timings here."
          icon={<Calendar color={theme.colors.primary} size={36} />}
        />
      )}

      {activeTab === 'leaderboard' && (
        <ComingSoonState
          title="Player Leaderboard"
          description="See who dominates the local leaderboard in runs, wickets, and MVP points."
          icon={<Trophy color={theme.colors.primary} size={36} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appBar: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  appBarTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tabsWrapper: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  tabText: {
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  feedHeader: {
    paddingTop: 8,
  },
  myProfileSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  playerCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 14,
  },
  playerMetaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '700',
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
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});

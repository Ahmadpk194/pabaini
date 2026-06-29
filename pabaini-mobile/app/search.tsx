import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Share,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '../src/context/ThemeContext';
import { safeRouterPush } from '../src/navigation/safeNavigation';
import { Announcement } from '../src/types';
import { AnnouncementCard } from '../src/components/notice/AnnouncementCard';
import { Pill } from '../src/components/ui/Pill';
import { MatchCard } from '../src/components/sports/matches/MatchCard';
import {
  AnnouncementCardSkeleton,
  PlayerCardSkeleton,
  TeamCardSkeleton,
} from '../src/components/skeletons';

import { SEARCH_CATEGORIES, SearchCategory } from '../src/constants/searchCategories';
import {
  useSearchAnnouncements,
  useSearchPlayers,
  useSearchTeams,
  useSearchMatches,
  useSearchUsers,
} from '../src/hooks/useSearch';

interface MappedUser {
  id: number;
  name: string;
  avatar_url: string | null;
  role: string;
  village: string;
  is_diaspora: boolean;
  isPlayer: boolean;
}

interface MappedPlayer {
  id: number;
  name: string;
  avatar_url: string | null;
  playerRole: string;
}

interface MappedTeam {
  id: number;
  name: string;
  logo_url: string | null;
  home_ground: string;
  captain: string;
  member_count: number;
}

export default function SearchScreen() {
  const { theme, mode } = useTheme();
  const router = useRouter();

  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPill, setSelectedPill] = useState<SearchCategory['id']>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent searches from AsyncStorage
  useEffect(() => {
    const loadRecentSearches = async () => {
      try {
        const stored = await AsyncStorage.getItem('pabaini_recent_searches');
        if (stored) {
          setRecentSearches(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to load recent searches:', e);
      }
    };
    loadRecentSearches();
  }, []);

  // Save recent search helper
  const saveSearchTerm = async (term: string) => {
    const trimmed = term.trim();
    if (trimmed.length < 2) return;
    try {
      const stored = await AsyncStorage.getItem('pabaini_recent_searches');
      let list: string[] = stored ? JSON.parse(stored) : [];
      list = list.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      list.unshift(trimmed);
      if (list.length > 8) {
        list = list.slice(0, 8);
      }
      setRecentSearches(list);
      await AsyncStorage.setItem('pabaini_recent_searches', JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save search term:', e);
    }
  };

  // Delete recent search helper
  const deleteRecentSearch = async (termToDelete: string) => {
    try {
      const updated = recentSearches.filter((item) => item !== termToDelete);
      setRecentSearches(updated);
      await AsyncStorage.setItem('pabaini_recent_searches', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to delete recent search:', e);
    }
  };

  // Clear all recent searches helper
  const clearAllRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem('pabaini_recent_searches');
    } catch (e) {
      console.error('Failed to clear recent searches:', e);
    }
  };

  // Debounced input monitoring
  useEffect(() => {
    if (inputValue.trim() === '') {
      setSearchQuery('');
      setIsSearching(false);
      return;
    }

    if (inputValue.trim().length < 2) {
      setSearchQuery('');
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(inputValue);
      saveSearchTerm(inputValue);
      setIsSearching(false);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [inputValue]);

  // Hook setups driven by searchQuery and selectedPill
  const queryEnabled = searchQuery.trim().length >= 2;

  const postsQuery = useSearchAnnouncements(
    searchQuery,
    queryEnabled && (selectedPill === 'posts' || selectedPill === 'all')
  );
  const playersQuery = useSearchPlayers(
    searchQuery,
    queryEnabled && (selectedPill === 'players' || selectedPill === 'all')
  );
  const teamsQuery = useSearchTeams(
    searchQuery,
    queryEnabled && (selectedPill === 'teams' || selectedPill === 'all')
  );
  const matchesQuery = useSearchMatches(
    searchQuery,
    queryEnabled && (selectedPill === 'matches' || selectedPill === 'all')
  );
  const usersQuery = useSearchUsers(
    searchQuery,
    queryEnabled && (selectedPill === 'users' || selectedPill === 'all')
  );

  // Active query accessor helper
  const getActiveQuery = () => {
    switch (selectedPill) {
      case 'posts':
        return postsQuery;
      case 'players':
        return playersQuery;
      case 'teams':
        return teamsQuery;
      case 'matches':
        return matchesQuery;
      case 'users':
        return usersQuery;
      default:
        return null;
    }
  };

  const activeQuery = getActiveQuery();

  // Helper to extract flattened items from pages
  const getQueryItems = (category: string, queryResult: any) => {
    if (!queryResult?.data?.pages) return [];
    return queryResult.data.pages.flatMap((page: any) => {
      if (!page) return [];
      if (category === 'posts') {
        return page.data || [];
      } else {
        return page?.data?.data || [];
      }
    });
  };

  // Mapped list accessors
  const allPosts: Announcement[] = getQueryItems('posts', postsQuery);
  const allPlayers: MappedPlayer[] = getQueryItems('players', playersQuery).map((p: any) => ({
    id: p.user?.id || p.id,
    name: p.user?.name || 'Player',
    avatar_url: p.user?.avatar_url || null,
    playerRole: p.role ? (p.role.charAt(0).toUpperCase() + p.role.slice(1).replace('_', ' ')) : 'Player',
  }));
  const allTeams: MappedTeam[] = getQueryItems('teams', teamsQuery).map((t: any) => ({
    id: t.id,
    name: t.name,
    logo_url: t.logo_url,
    home_ground: t.home_ground || 'Pabaini Cricket Ground',
    captain: t.captain?.user?.name || 'Unknown',
    member_count: t.member_count || 0,
  }));
  const allMatches: any[] = getQueryItems('matches', matchesQuery);
  const allUsers: MappedUser[] = getQueryItems('users', usersQuery).map((u: any) => ({
    id: u.id,
    name: u.name,
    avatar_url: u.avatar_url,
    role: u.role ? (u.role.charAt(0).toUpperCase() + u.role.slice(1)) : 'Resident',
    village: u.village || 'Pabaini',
    is_diaspora: !!u.is_diaspora,
    isPlayer: false,
  }));

  // Resolve active items
  const activeItems = (() => {
    switch (selectedPill) {
      case 'posts':
        return allPosts;
      case 'players':
        return allPlayers;
      case 'teams':
        return allTeams;
      case 'matches':
        return allMatches;
      case 'users':
        return allUsers;
      default:
        return [];
    }
  })();

  const isCurrentlyLoading =
    queryEnabled &&
    (selectedPill === 'all'
      ? postsQuery.isLoading ||
        playersQuery.isLoading ||
        teamsQuery.isLoading ||
        matchesQuery.isLoading ||
        usersQuery.isLoading
      : !!activeQuery?.isLoading);

  const isFetchingAny =
    postsQuery.isFetching ||
    playersQuery.isFetching ||
    teamsQuery.isFetching ||
    matchesQuery.isFetching ||
    usersQuery.isFetching;

  const isQueryLoading = isSearching || isCurrentlyLoading || isFetchingAny;

  const handlePillPress = (pillId: SearchCategory['id']) => {
    setSelectedPill(pillId);
  };

  const handleShare = async (announcement: Announcement) => {
    try {
      await Share.share({
        title: announcement.title,
        message: `Check out this announcement on Pabaini village board:\n\n*${announcement.title}*\n\n${announcement.content}\n\nJoin the village feed: https://pabaini.app/announcements/${announcement.id}`,
      });
    } catch (error) {
      console.error('Error sharing announcement:', error);
    }
  };

  // Card rendering helpers
  const renderUserCard = (user: MappedUser) => {
    const avatarBg = theme.colors.primaryLight;
    const avatarTextColor = theme.colors.primary;

    const getInitials = (name: string): string => {
      const parts = name.trim().split(/\s+/);
      if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    return (
      <TouchableOpacity
        key={user.id}
        onPress={() => safeRouterPush(router, `/profile/${user.id}`)}
        activeOpacity={0.7}
        style={[
          styles.resultCard,
          { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
          <Text style={[styles.avatarText, { color: avatarTextColor }]}>
            {getInitials(user.name)}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>{user.name}</Text>
          <View style={styles.badgeRow}>
            <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
              {user.role} · {user.village}
              {user.is_diaspora ? ' (Diaspora)' : ''}
            </Text>
          </View>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.colors.textTertiary}
          style={styles.chevron}
        />
      </TouchableOpacity>
    );
  };

  const renderPlayerCard = (player: MappedPlayer) => {
    const avatarBg = theme.colors.primaryLight;
    const avatarTextColor = theme.colors.primary;

    const getInitials = (name: string): string => {
      const parts = name.trim().split(/\s+/);
      if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    return (
      <TouchableOpacity
        key={player.id}
        onPress={() => safeRouterPush(router, `/profile/${player.id}`)}
        activeOpacity={0.7}
        style={[
          styles.resultCard,
          { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
          <Text style={[styles.avatarText, { color: avatarTextColor }]}>
            {getInitials(player.name)}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>{player.name}</Text>
          <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
            Cricket · {player.playerRole}
          </Text>
        </View>
        <View style={[styles.inlineBadge, { backgroundColor: theme.colors.infoLight }]}>
          <Text style={[styles.inlineBadgeText, { color: theme.colors.infoText }]}>Stats</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.colors.textTertiary}
          style={styles.chevron}
        />
      </TouchableOpacity>
    );
  };

  const renderTeamCard = (team: MappedTeam) => {
    const avatarBg = theme.colors.primaryLight;
    const avatarTextColor = theme.colors.primary;

    const getInitials = (name: string): string => {
      const parts = name.trim().split(/\s+/);
      if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    return (
      <TouchableOpacity
        key={team.id}
        onPress={() => safeRouterPush(router, `/sports/cricket/teams/${team.id}`)}
        activeOpacity={0.7}
        style={[
          styles.resultCard,
          { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
          <Text style={[styles.avatarText, { color: avatarTextColor }]}>
            {getInitials(team.name)}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>{team.name}</Text>
          <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
            Ground: {team.home_ground} · Captain: {team.captain}
          </Text>
        </View>
        <View style={[styles.inlineBadge, { backgroundColor: theme.colors.elevated }]}>
          <Text style={[styles.inlineBadgeText, { color: theme.colors.textSecondary }]}>
            {team.member_count} Members
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.colors.textTertiary}
          style={styles.chevron}
        />
      </TouchableOpacity>
    );
  };

  // Generic flatlist item resolver
  const renderResultItem = ({ item }: { item: any }) => {
    switch (selectedPill) {
      case 'posts':
        return (
          <AnnouncementCard key={item.id} announcement={item} onShare={handleShare} />
        );
      case 'users':
        return renderUserCard(item);
      case 'players':
        return renderPlayerCard(item);
      case 'teams':
        return renderTeamCard(item);
      case 'matches':
        return (
          <MatchCard
            key={item.id}
            match={item}
            onPress={() => safeRouterPush(router, `/sports/cricket/matches/${item.id}`)}
          />
        );
      default:
        return null;
    }
  };

  // Footer for infinite scroll
  const renderFooter = () => {
    if (!activeQuery) return null;
    if (activeQuery.isFetchingNextPage) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      );
    }
    if (!activeQuery.hasNextPage && activeItems.length > 0) {
      return (
        <View style={styles.footerTextContainer}>
          <Text style={[styles.footerText, { color: theme.colors.textTertiary }]}>
            No more results
          </Text>
        </View>
      );
    }
    return null;
  };

  // Render skeletons during initial page load
  const renderSkeletons = () => {
    return (
      <View style={styles.skeletonsContainer}>
        <View
          style={[
            styles.genericSkeleton,
            { backgroundColor: mode === 'dark' ? '#2A2A2A' : '#E6EAE8', marginTop: 12 },
          ]}
        />
      </View>
    );
  };

  // All Category Sections
  const renderAllSection = (
    title: string,
    categoryId: SearchCategory['id'],
    items: any[],
    renderItem: (item: any) => React.ReactNode
  ) => {
    if (items.length === 0) return null;
    const displayItems = items.slice(0, 3);
    const hasMore = items.length > 3;

    return (
      <View key={categoryId} style={styles.sectionContainer}>
        <Text style={[styles.sectionHeader, { color: theme.colors.textSecondary }]}>
          {title.toUpperCase()}
        </Text>
        <View style={styles.sectionItems}>
          {displayItems.map((item) => renderItem(item))}
        </View>
        {hasMore && (
          <TouchableOpacity
            onPress={() => setSelectedPill(categoryId)}
            style={styles.seeAllButton}
            activeOpacity={0.7}
          >
            <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
              See all {title} →
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Section mapping for ALL Category
  const renderAllCategoryResults = () => {
    if (selectedPill !== 'all') return null;
    if (searchQuery.trim().length < 2) return null;
    if (isQueryLoading) {
      return renderSkeletons();
    }

    const hasResults =
      allPosts.length > 0 ||
      allPlayers.length > 0 ||
      allTeams.length > 0 ||
      allMatches.length > 0 ||
      allUsers.length > 0;
    if (!hasResults) return null;

    return (
      <ScrollView
        style={styles.resultsScroll}
        contentContainerStyle={styles.resultsScrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {renderAllSection('Posts', 'posts', allPosts, (item) => (
          <AnnouncementCard key={item.id} announcement={item} onShare={handleShare} />
        ))}

        {renderAllSection('Players', 'players', allPlayers, (item) => renderPlayerCard(item))}

        {renderAllSection('Teams', 'teams', allTeams, (item) => renderTeamCard(item))}

        {renderAllSection('Matches', 'matches', allMatches, (item) => (
          <MatchCard
            key={item.id}
            match={item}
            onPress={() => safeRouterPush(router, `/sports/cricket/matches/${item.id}`)}
          />
        ))}

        {renderAllSection('Users', 'users', allUsers, (item) => renderUserCard(item))}
      </ScrollView>
    );
  };

  // List view for individual category tabs
  const renderSingleCategoryResults = () => {
    if (selectedPill === 'all') return null;
    if (searchQuery.trim().length < 2) return null;
    if (isQueryLoading) {
      return renderSkeletons();
    }
    if (activeItems.length === 0) return null;

    return (
      <FlatList
        data={activeItems}
        renderItem={renderResultItem}
        keyExtractor={(item) => String(item.id)}
        style={styles.resultsScroll}
        contentContainerStyle={styles.resultsScrollContent}
        keyboardShouldPersistTaps="handled"
        onEndReached={() => {
          if (activeQuery?.hasNextPage && !activeQuery.isFetchingNextPage) {
            activeQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
      />
    );
  };

  // Recent Searches list
  const renderRecentSearches = () => {
    if (inputValue.trim() !== '' || recentSearches.length === 0) return null;

    return (
      <View style={styles.recentContainer}>
        <View style={styles.recentHeaderRow}>
          <Text style={[styles.recentTitle, { color: theme.colors.textSecondary }]}>
            Recent Searches
          </Text>
          <TouchableOpacity onPress={clearAllRecentSearches} activeOpacity={0.7}>
            <Text style={[styles.clearAllText, { color: theme.colors.primary }]}>
              Clear All
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled">
          {recentSearches.map((term, index) => (
            <View
              key={index}
              style={[styles.recentRow, { borderBottomColor: theme.colors.border }]}
            >
              <TouchableOpacity
                style={styles.recentTermClickable}
                onPress={() => {
                  setInputValue(term);
                  setSearchQuery(term);
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={theme.colors.textTertiary}
                  style={styles.recentIcon}
                />
                <Text style={[styles.recentText, { color: theme.colors.textPrimary }]}>
                  {term}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => deleteRecentSearch(term)}
                style={styles.recentDeleteButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color={theme.colors.textTertiary} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Keep typing state (exactly 1 character input)
  const renderKeepTypingState = () => {
    if (inputValue.trim().length !== 1) return null;

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="ellipsis-horizontal" size={36} color={theme.colors.primaryLight} />
        <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>
          Keep typing...
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.textTertiary }]}>
          Enter at least 2 characters to search
        </Text>
      </View>
    );
  };

  // Default empty background (no queries, no recents)
  const renderDefaultEmptyState = () => {
    if (inputValue.trim() !== '') return null;
    if (recentSearches.length > 0) return null;

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={48} color={theme.colors.primaryLight} />
        <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>
          Search Pabaini
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.textTertiary }]}>
          Search posts, players, teams, matches and more
        </Text>
      </View>
    );
  };

  // No Results State
  const renderNoResultsState = () => {
    if (inputValue.trim().length < 2) return null;
    if (isQueryLoading) return null;

    const categoryConfig = SEARCH_CATEGORIES.find((c) => c.id === selectedPill);
    const hasResults =
      selectedPill === 'all'
        ? allPosts.length > 0 ||
          allPlayers.length > 0 ||
          allTeams.length > 0 ||
          allMatches.length > 0 ||
          allUsers.length > 0
        : activeItems.length > 0;

    if (hasResults) return null;

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={48} color={theme.colors.primaryLight} />
        <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>
          {categoryConfig?.emptyMessage || 'No results found'}
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.textTertiary }]}>
          Try a different keyword
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.surface }]}
      edges={['top', 'left', 'right']}
    >
      {/* Header Bar */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Search</Text>
      </View>

      {/* Main Body */}
      <View style={[styles.bodyContainer, { backgroundColor: theme.colors.background }]}>
        {/* Search Input Section */}
        <View style={styles.searchInputContainer}>
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: theme.colors.elevated,
                borderColor: isFocused ? theme.colors.primary : 'transparent',
                borderWidth: 1.5,
              },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={18}
              color={theme.colors.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.input, { color: theme.colors.textPrimary }]}
              placeholder="Search posts, players, teams, matches..."
              placeholderTextColor={theme.colors.textTertiary}
              value={inputValue}
              onChangeText={setInputValue}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              autoFocus={true}
              clearButtonMode="never"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {inputValue.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setInputValue('');
                  setSearchQuery('');
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Pills Bar */}
        <View style={[styles.pillsContainer, { borderBottomColor: theme.colors.border }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsScrollContent}
          >
            {SEARCH_CATEGORIES.map((pill) => {
              const isComingSoon = !!pill.comingSoon;
              return (
                <View key={pill.id} style={isComingSoon ? { opacity: 0.5 } : null}>
                  <Pill
                    label={pill.label}
                    selected={selectedPill === pill.id}
                    onPress={() => {
                      if (isComingSoon) {
                        Alert.alert('Coming Soon', `${pill.label} search is coming soon!`);
                      } else {
                        handlePillPress(pill.id);
                      }
                    }}
                  />
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Results Area */}
        {renderDefaultEmptyState()}
        {renderKeepTypingState()}
        {renderRecentSearches()}
        {renderNoResultsState()}
        {renderAllCategoryResults()}
        {renderSingleCategoryResults()}
      </View>
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
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  bodyContainer: {
    flex: 1,
  },
  searchInputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapper: {
    height: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    paddingVertical: 0,
  },
  pillsContainer: {
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  pillsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  resultsScroll: {
    flex: 1,
  },
  resultsScrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  skeletonsContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 96,
    paddingHorizontal: 32,
    paddingTop: 48,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 0.5,
    marginBottom: 8,
    marginHorizontal: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '600',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inlineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginRight: 8,
  },
  inlineBadgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  chevron: {
    marginLeft: 8,
  },
  // All tab section styles
  sectionContainer: {
    marginTop: 16,
    paddingHorizontal: 12,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  sectionItems: {
    gap: 4,
  },
  seeAllButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Recent searches styles
  recentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  recentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  recentTermClickable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentIcon: {
    marginRight: 10,
  },
  recentText: {
    fontSize: 15,
  },
  recentDeleteButton: {
    padding: 4,
  },
  // Footer pagination loader
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerTextContainer: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 13,
  },
  genericSkeleton: {
    height: 76,
    borderRadius: 14,
    marginBottom: 8,
  },
});

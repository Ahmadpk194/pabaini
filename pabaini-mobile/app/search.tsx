import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../src/context/ThemeContext';
import { safeRouterPush } from '../src/navigation/safeNavigation';
import { Announcement } from '../src/types';
import { AnnouncementCard } from '../src/components/notice/AnnouncementCard';
import { Pill } from '../src/components/ui/Pill';
import { AnnouncementCardSkeleton } from '../src/components/skeletons';

// API Imports
import { getAll as getAllAnnouncements } from '../src/api/announcements';
import { getAllUsers } from '../src/services/usersApi';
import { getCricketPlayers } from '../src/api/sports';
import { getAllTeams } from '../src/services/sports/cricketTeamsApi';

interface MockUser {
  id: number;
  name: string;
  avatar_url: string | null;
  role: string; // 'Resident' | 'Moderator' | 'Admin'
  isPlayer: boolean;
  playerRole?: string; // 'Batsman' | 'Bowler' | 'Allrounder' | 'Wicket Keeper'
  village: string;
  is_diaspora: boolean;
}

interface MockTeam {
  id: number;
  name: string;
  logo_url: string | null;
  home_ground: string;
  founded_year: number;
  captain: string;
  member_count: number;
}

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 1,
    title: 'Water Shortage Notice',
    content: 'Please be informed that the main water supply pipeline will be undergoing maintenance this Friday. Expect water shortages from 8:00 AM to 4:00 PM.',
    category: 'urgent',
    image_url: null,
    location: 'Main Street',
    likes_count: 5,
    liked_by_me: false,
    is_pinned: true,
    author_id: 101,
    author: {
      id: 101,
      name: 'Muhammad Khan',
      avatar_url: null,
    },
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 2,
    title: 'Cricket Tournament Final',
    content: 'The grand finale of the Pabaini T20 Cup is scheduled for Sunday at the main sports ground. Match starts at 2:00 PM. Come support your local team!',
    category: 'event',
    image_url: null,
    location: 'Pabaini Cricket Ground',
    likes_count: 12,
    liked_by_me: true,
    is_pinned: false,
    author_id: 102,
    author: {
      id: 102,
      name: 'Ali Sher',
      avatar_url: null,
    },
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 3,
    title: 'Village Jirga Meeting',
    content: 'A community Jirga will be held next Monday at the Council Hall to discuss the new road construction project. All residents are requested to attend.',
    category: 'jirga_decision',
    image_url: null,
    location: 'Council Hall',
    likes_count: 8,
    liked_by_me: false,
    is_pinned: false,
    author_id: 101,
    author: {
      id: 101,
      name: 'Muhammad Khan',
      avatar_url: null,
    },
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
    updated_at: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: 4,
    title: 'Free Medical Camp',
    content: 'A team of doctors will visit the village health center this Saturday to provide free checkups and distribute medicines. Timings: 9:00 AM to 5:00 PM.',
    category: 'event',
    image_url: null,
    location: 'Health Center',
    likes_count: 15,
    liked_by_me: false,
    is_pinned: false,
    author_id: 103,
    author: {
      id: 103,
      name: 'Dr. Tariq Mahmood',
      avatar_url: null,
    },
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(), // 3 days ago
    updated_at: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
  {
    id: 5,
    title: 'Cleanliness Drive Initiative',
    content: "Let's work together to clean our village. Join the youth committee members at the central bazaar this Friday at 7:00 AM for the weekly cleanliness drive.",
    category: 'general',
    image_url: null,
    location: 'Central Bazaar',
    likes_count: 3,
    liked_by_me: false,
    is_pinned: false,
    author_id: 104,
    author: {
      id: 104,
      name: 'Sajid Ahmad',
      avatar_url: null,
    },
    created_at: new Date(Date.now() - 3600000 * 96).toISOString(), // 4 days ago
    updated_at: new Date(Date.now() - 3600000 * 96).toISOString(),
  },
];

const MOCK_USERS: MockUser[] = [
  { id: 101, name: 'Muhammad Khan', avatar_url: null, role: 'Admin', isPlayer: false, village: 'Pabaini', is_diaspora: false },
  { id: 102, name: 'Ali Sher', avatar_url: null, role: 'Resident', isPlayer: true, playerRole: 'Batsman', village: 'Pabaini', is_diaspora: false },
  { id: 103, name: 'Dr. Tariq Mahmood', avatar_url: null, role: 'Resident', isPlayer: false, village: 'Pabaini', is_diaspora: true },
  { id: 104, name: 'Sajid Ahmad', avatar_url: null, role: 'Moderator', isPlayer: true, playerRole: 'Bowler', village: 'Pabaini', is_diaspora: false },
  { id: 105, name: 'Zain Iqbal', avatar_url: null, role: 'Resident', isPlayer: true, playerRole: 'Allrounder', village: 'Pabaini', is_diaspora: false },
  { id: 106, name: 'Hamza Malik', avatar_url: null, role: 'Resident', isPlayer: false, village: 'Pabaini', is_diaspora: false },
  { id: 107, name: 'Yasir Arafat', avatar_url: null, role: 'Resident', isPlayer: true, playerRole: 'Wicket Keeper', village: 'Pabaini', is_diaspora: false },
];

const MOCK_TEAMS: MockTeam[] = [
  { id: 201, name: 'Pabaini Lions CC', logo_url: null, home_ground: 'Pabaini Cricket Ground', founded_year: 2018, captain: 'Ali Sher', member_count: 15 },
  { id: 202, name: 'Pabaini Shaheens', logo_url: null, home_ground: 'Main Sports Complex', founded_year: 2021, captain: 'Zain Iqbal', member_count: 12 },
  { id: 203, name: 'Young Stars Pabaini', logo_url: null, home_ground: 'High School Ground', founded_year: 2023, captain: 'Sajid Ahmad', member_count: 14 },
];

const CATEGORY_PILLS = [
  { id: 'posts', label: 'Posts' },
  { id: 'users', label: 'Users' },
  { id: 'players', label: 'Players' },
  { id: 'teams', label: 'Teams' },
];

export default function SearchScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPill, setSelectedPill] = useState('posts');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setIsSearching(false);
      setResults([]);
      return;
    }

    setIsSearching(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        if (selectedPill === 'posts') {
          const response = await getAllAnnouncements(1, 30, undefined, searchQuery);
          setResults(response.data || []);
        } else if (selectedPill === 'users') {
          const response = await getAllUsers(1, 30, searchQuery);
          const mapped = (response.data || []).map((u: any) => ({
            id: u.id,
            name: u.name,
            avatar_url: u.avatar_url,
            role: u.role ? (u.role.charAt(0).toUpperCase() + u.role.slice(1)) : 'Resident',
            village: u.village || 'Pabaini',
            is_diaspora: !!u.is_diaspora,
            isPlayer: false, // dedicated players tab handles player searches
          }));
          setResults(mapped);
        } else if (selectedPill === 'players') {
          const response = await getCricketPlayers(1, 30, searchQuery);
          const mapped = (response.data || []).map((p: any) => ({
            id: p.user?.id || p.id,
            name: p.user?.name || 'Player',
            avatar_url: p.user?.avatar_url || null,
            playerRole: p.role ? (p.role.charAt(0).toUpperCase() + p.role.slice(1).replace('_', ' ')) : 'Player',
          }));
          setResults(mapped);
        } else if (selectedPill === 'teams') {
          const response = await getAllTeams(searchQuery);
          const mapped = (response || []).map((t: any) => ({
            id: t.id,
            name: t.name,
            logo_url: t.logo_url,
            home_ground: t.home_ground || 'Pabaini Cricket Ground',
            captain: t.captain?.user?.name || 'Unknown',
            member_count: t.member_count || 0,
          }));
          setResults(mapped);
        }
      } catch (error) {
        console.error('Search query error:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, selectedPill]);

  const handlePillPress = (pillId: string) => {
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

  const renderUserCard = (user: MockUser) => {
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
        style={[styles.resultCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
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
              {user.role} · {user.village}{user.is_diaspora ? ' (Diaspora)' : ''}
            </Text>
            {user.isPlayer && (
              <View style={[styles.inlineBadge, { backgroundColor: theme.colors.primaryLight }]}>
                <Text style={[styles.inlineBadgeText, { color: theme.colors.primary }]}>Player</Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} style={styles.chevron} />
      </TouchableOpacity>
    );
  };

  const renderPlayerCard = (player: MockUser) => {
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
        style={[styles.resultCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
      >
        <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
          <Text style={[styles.avatarText, { color: avatarTextColor }]}>
            {getInitials(player.name)}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>{player.name}</Text>
          <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
            Cricket · {player.playerRole || 'Player'}
          </Text>
        </View>
        <View style={[styles.inlineBadge, { backgroundColor: theme.colors.infoLight }]}>
          <Text style={[styles.inlineBadgeText, { color: theme.colors.infoText }]}>Stats</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} style={styles.chevron} />
      </TouchableOpacity>
    );
  };

  const renderTeamCard = (team: MockTeam) => {
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
        style={[styles.resultCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
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
          <Text style={[styles.inlineBadgeText, { color: theme.colors.textSecondary }]}>{team.member_count} Members</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} style={styles.chevron} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.surface }]} edges={['top', 'left', 'right']}>
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
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          Search
        </Text>
      </View>

      {/* Main Body */}
      <View style={[styles.bodyContainer, { backgroundColor: theme.colors.background }]}>
        {/* Search Input Section */}
        <View style={styles.searchInputContainer}>
          <View style={[styles.inputWrapper, { backgroundColor: theme.colors.elevated }]}>
            <Ionicons name="search-outline" size={18} color={theme.colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.input, { color: theme.colors.textPrimary }]}
              placeholder="Search posts, players, teams..."
              placeholderTextColor={theme.colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
              clearButtonMode="while-editing"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Pills Bar */}
        <View style={[styles.pillsContainer, { borderBottomColor: theme.colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScrollContent}>
            {CATEGORY_PILLS.map((pill) => (
              <Pill
                key={pill.id}
                label={pill.label}
                selected={selectedPill === pill.id}
                onPress={() => handlePillPress(pill.id)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Results Area */}
        {isSearching ? (
          <ScrollView style={styles.resultsScroll} contentContainerStyle={styles.resultsScrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.skeletonsContainer}>
              {[0, 1, 2].map((index) => (
                <AnnouncementCardSkeleton key={index} index={index} />
              ))}
            </View>
          </ScrollView>
        ) : searchQuery.trim() === '' ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={theme.colors.primaryLight} />
            <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>
              Search Pabaini
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textTertiary }]}>
              Search posts, players, teams and more
            </Text>
          </View>
        ) : results.length > 0 ? (
          <ScrollView style={styles.resultsScroll} contentContainerStyle={styles.resultsScrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.cardsContainer}>
              {results.map((item) => {
                if (selectedPill === 'posts') {
                  return (
                    <AnnouncementCard
                      key={item.id}
                      announcement={item}
                      onShare={handleShare}
                    />
                  );
                } else if (selectedPill === 'users') {
                  return renderUserCard(item);
                } else if (selectedPill === 'players') {
                  return renderPlayerCard(item);
                } else if (selectedPill === 'teams') {
                  return renderTeamCard(item);
                }
                return null;
              })}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={theme.colors.primaryLight} />
            <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>
              No results found
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textTertiary }]}>
              Try a different keyword
            </Text>
          </View>
        )}
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
  },
  skeletonsContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  cardsContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 96, // Pull it upwards so it centers visually with the keyboard/header offsets
    paddingHorizontal: 32,
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
  },
  inlineBadgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  chevron: {
    marginLeft: 8,
  },
});

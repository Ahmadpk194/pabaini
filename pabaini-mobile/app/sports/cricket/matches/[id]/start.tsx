import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ChevronDown, Check, User, Search } from 'lucide-react-native';
import { useTheme } from '../../../../../src/context/ThemeContext';
import { useSportsStore } from '../../../../../src/store/sports/sportsStore';
import { useMatchDetail, useLineup, useStartLiveMatch } from '../../../../../src/hooks/useMatches';
// API client for backend requests
import client from '../../../../../src/api/client';
// Avatar component for player profile images
import { Avatar } from '../../../../../src/components/ui/Avatar';
import { useAuth } from '../../../../../src/hooks/useAuth';
import { LoginRequiredGate } from '../../../../../src/components/ui/LoginRequiredGate';

interface LineupPlayer {
  id: number;
  player_id: number | null;
  guest_name: string | null;
  name: string;
  avatar_url?: string | null;
  role?: string | null;
}

// Interface for system-wide player search results
interface SearchPlayerResult {
  id: number;
  role?: string;
  user?: {
    name?: string;
    avatar_url?: string | null;
  };
}

export default function StartMatchScreen() {
  const { theme, mode } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = Number(id);
  const insets = useSafeAreaInsets();
  const { isGuest } = useAuth();

  // Zustand Store
  const myProfile = useSportsStore((state) => state.registrations['cricket']?.profile);

  // Queries & Mutations
  // Fetches match details with refetch support for handling start race conditions.
  const { data: match, isLoading: isLoadingMatch, refetch } = useMatchDetail(matchId);
  const { data: lineups, isLoading: isLoadingLineup } = useLineup(matchId);
  const startMatchMutation = useStartLiveMatch();

  // Selection states
  const [tossWinnerId, setTossWinnerId] = useState<number | null>(null);
  const [battingFirstId, setBattingFirstId] = useState<number | null>(null);
  const [strikerKey, setStrikerKey] = useState<string | null>(null);
  const [nonStrikerKey, setNonStrikerKey] = useState<string | null>(null);
  const [bowlerKey, setBowlerKey] = useState<string | null>(null);
  const [scorerId, setScorerId] = useState<number | null>(null);

  // Scorer custom details & search states
  const [selectedScorer, setSelectedScorer] = useState<LineupPlayer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LineupPlayer[]>([]);
  const [isSearchingPlayers, setIsSearchingPlayers] = useState(false);

  // Modal visibility states
  const [activeModal, setActiveModal] = useState<'striker' | 'nonStriker' | 'bowler' | 'scorer' | null>(null);

  // Auth & Status Guard
  useEffect(() => {
    if (isGuest) return;
    if (myProfile === undefined) return;
    if (match && !isLoadingMatch) {
      const isTeamACaptain = myProfile && match.team_a.captain?.id === myProfile.id;
      const isTeamBCaptain = myProfile && match.team_b.captain?.id === myProfile.id;
      const isEitherCaptain = isTeamACaptain || isTeamBCaptain;

      if (!isEitherCaptain) {
        Alert.alert('Access Denied', 'Only the captain of either team can start the match.');
        router.back();
        return;
      }

      if (match.status !== 'scheduled') {
        // If the start match mutation is pending or succeeded, we are transitioning to live, so skip guard
        if (startMatchMutation.isPending || startMatchMutation.isSuccess) {
          return;
        }
        Alert.alert('Invalid Action', `Match cannot be started because its status is ${match.status}.`);
        router.back();
        return;
      }

      if (!match.team_a_lineup_set || !match.team_b_lineup_set) {
        Alert.alert('Lineups Not Ready', 'Both teams must declare their Playing XI lineups before starting.');
        router.back();
      }
    }
  }, [match, isLoadingMatch, myProfile, startMatchMutation.isPending, startMatchMutation.isSuccess, isGuest]);

  // Pre-populates the designated scorer with the current captain's profile.
  useEffect(() => {
    if (myProfile && scorerId === null) {
      setScorerId(myProfile.id);
      setSelectedScorer({
        id: myProfile.id,
        player_id: myProfile.id,
        guest_name: null,
        name: myProfile.user?.name || 'Default (Captain)',
      });
    }
  }, [myProfile, scorerId]);

  const isLoading = !isGuest && (isLoadingMatch || isLoadingLineup || myProfile === undefined);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isGuest) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
        {/* Header Bar */}
        <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color={theme.colors.textPrimary} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Initialize Match</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.centerContainer}>
          <LoginRequiredGate fullscreen={false} />
        </View>
      </SafeAreaView>
    );
  }

  if (!match || !lineups) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContainer}>
          <Text style={{ color: theme.colors.textSecondary }}>Failed to load match or lineups details.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Determine batting and bowling lineups based on selection
  const battingTeamId = battingFirstId;
  const bowlingTeamId = battingFirstId
    ? battingFirstId === match.team_a_id
      ? match.team_b_id
      : match.team_a_id
    : null;

  const battingPlayers: LineupPlayer[] = battingTeamId
    ? battingTeamId === match.team_a_id
      ? lineups.team_a.players
      : lineups.team_b.players
    : [];

  const bowlingPlayers: LineupPlayer[] = bowlingTeamId
    ? bowlingTeamId === match.team_a_id
      ? lineups.team_a.players
      : lineups.team_b.players
    : [];

  // Scorer can be selected from registered players of both teams
  const allRegisteredPlayers = [
    ...lineups.team_a.players.filter((p) => p.player_id !== null),
    ...lineups.team_b.players.filter((p) => p.player_id !== null),
  ];

  // Helper to get player's key in lineup list
  const getPlayerKey = (player: LineupPlayer) => {
    return player.player_id ? `p-${player.player_id}` : `g-${player.guest_name}`;
  };

  const getPlayerNameByKey = (key: string | null, list: LineupPlayer[]) => {
    if (!key) return 'Select player';
    const found = list.find((p) => getPlayerKey(p) === key);
    return found ? found.name : 'Select player';
  };

  // Fetches registered players from the public API for the neutral scorer search.
  // Performs name lookup on system-wide registered players and maps their avatars and roles.
  const fetchPlayersForSearch = async (query = '') => {
    setIsSearchingPlayers(true);
    try {
      const response = await client.get('/sports/cricket/players', {
        params: { page: 1, limit: 50, search: query || undefined },
      });
      const result = response.data?.data;
      if (result && Array.isArray(result.data)) {
        const mapped: LineupPlayer[] = result.data.map((p: SearchPlayerResult) => ({
          id: p.id,
          player_id: p.id,
          guest_name: null,
          name: p.user?.name || 'Unknown Player',
          avatar_url: p.user?.avatar_url || null,
          role: p.role || null,
        }));
        setSearchResults(mapped);
      }
    } catch (error) {
      console.error('Failed to fetch players for search:', error);
    } finally {
      setIsSearchingPlayers(false);
    }
  };

  // Debounced search trigger for player searches
  useEffect(() => {
    if (activeModal === 'scorer') {
      const delayDebounceFn = setTimeout(() => {
        fetchPlayersForSearch(searchQuery);
      }, 300);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchQuery, activeModal]);

  // Helper to extract clean two-letter initials from a player's name
  const getInitials = (name: string) => {
    if (!name) return '??';
    const cleanName = name.trim();
    const parts = cleanName.split(/\s+/);
    if (parts.length >= 2) {
      const first = parts[0].charAt(0);
      const last = parts[parts.length - 1].charAt(0);
      return (first + last).toUpperCase();
    }
    return cleanName.slice(0, 2).toUpperCase();
  };

  // Renders a styled, responsive list item for scorer selection matching reference design.
  // Uses a 3-zone layout: fixed Avatar/Icon, flex middle container with minWidth: 0, and fixed badge/checkbox.
  const renderScorerItem = (item: LineupPlayer) => {
    const isSelected = scorerId === item.player_id;
    const isGuest = item.player_id === null;

    // Determine subtitle text based on captaincy and role parameters
    const isTeamACaptain = match?.team_a?.captain?.id === item.player_id;
    const isTeamBCaptain = match?.team_b?.captain?.id === item.player_id;
    const isCaptain = isTeamACaptain || isTeamBCaptain;
    
    const subtitle = isGuest
      ? null
      : isCaptain
      ? 'Captain'
      : item.role
      ? item.role.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : 'Registered Player';

    // Renders circular avatar (initials for registered, user icon for guests, or fallback image)
    const renderAvatar = () => {
      if (isGuest) {
        return (
          <View style={[styles.avatarCircle, { backgroundColor: mode === 'dark' ? '#2A2A2A' : '#ECEFF1' }]}>
            <User size={18} color={theme.colors.textSecondary} />
          </View>
        );
      }

      if (item.avatar_url) {
        return (
          <View style={styles.avatarCircle}>
            <Avatar uri={item.avatar_url} size={36} name={item.name} />
          </View>
        );
      }

      const avatarBg = mode === 'dark' ? '#1A2F4C' : '#E3F2FD';
      const initialsColor = mode === 'dark' ? '#64B5F6' : theme.colors.primary;

      return (
        <View style={[styles.avatarCircle, { backgroundColor: avatarBg }]}>
          <Text style={[styles.avatarInitials, { color: initialsColor }]}>
            {getInitials(item.name)}
          </Text>
        </View>
      );
    };

    // Renders badge tag or select button on the right matching the mockup exactly
    const renderRightBadge = () => {
      if (isGuest) {
        return (
          <Text style={[styles.guestText, { color: theme.colors.textSecondary }]}>
            Guest
          </Text>
        );
      }

      return (
        <View
          style={[
            styles.selectBadge,
            {
              backgroundColor: isSelected
                ? (mode === 'dark' ? '#1E1E1E' : '#E0E0E0')
                : 'transparent',
              borderColor: isSelected ? 'transparent' : theme.colors.border,
              borderWidth: isSelected ? 0 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.selectBadgeText,
              {
                color: isSelected ? theme.colors.textPrimary : theme.colors.textSecondary,
              },
            ]}
          >
            {isSelected ? 'Selected' : 'Select'}
          </Text>
        </View>
      );
    };

    return (
      <TouchableOpacity
        key={`scorer-${item.player_id || item.guest_name}`}
        style={[
          styles.scorerRow,
          {
            backgroundColor: isSelected
              ? (mode === 'dark' ? '#1A2F4C' : '#E3F2FD')
              : theme.colors.surface,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
          },
        ]}
        onPress={() => {
          setScorerId(item.player_id);
          setSelectedScorer(item);
          setActiveModal(null);
        }}
      >
        {/* Zone 1: Avatar (Fixed size, never shrinks/grows) */}
        {renderAvatar()}
        
        {/* Zone 2: Flexible Middle Container (Grows/shrinks, minWidth: 0 overrides default flex child bounds) */}
        <View style={styles.scorerInfoCol}>
          <Text style={[styles.playerName, { color: theme.colors.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
            {item.name}
          </Text>
          {subtitle ? (
            <Text style={[styles.playerSubtitle, { color: theme.colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
              {subtitle}
            </Text>
          ) : null}
        </View>

        {/* Zone 3: Badge / Select Indicator (Fixed size, sits far right, never shrinks) */}
        {renderRightBadge()}
      </TouchableOpacity>
    );
  };

  // Return all search results directly from the server.
  // Note: squad members are not filtered out so that search query resolves all matching players.
  const filteredSearchResults = searchResults;

  const handleStartMatch = async () => {
    if (!tossWinnerId || !battingFirstId || !strikerKey || !nonStrikerKey || !bowlerKey) {
      Alert.alert('Required Fields', 'Please complete all selections to start the match.');
      return;
    }

    if (strikerKey === nonStrikerKey) {
      Alert.alert('Invalid Selection', 'Striker and Non-Striker cannot be the same player.');
      return;
    }

    // Parse keys to retrieve player_id or guest name
    const getPayloadFields = (key: string, list: LineupPlayer[]) => {
      const player = list.find((p) => getPlayerKey(p) === key);
      if (!player) return {};
      if (player.player_id) {
        return { id: player.player_id };
      } else {
        return { guest_name: player.guest_name || undefined };
      }
    };

    const strikerFields = getPayloadFields(strikerKey, battingPlayers);
    const nonStrikerFields = getPayloadFields(nonStrikerKey, battingPlayers);
    const bowlerFields = getPayloadFields(bowlerKey, bowlingPlayers);

    const payload = {
      toss_winner_team_id: tossWinnerId,
      batting_first_team_id: battingFirstId,
      opening_striker_id: strikerFields.id,
      opening_striker_guest_name: strikerFields.guest_name,
      opening_non_striker_id: nonStrikerFields.id,
      opening_non_striker_guest_name: nonStrikerFields.guest_name,
      opening_bowler_id: bowlerFields.id,
      opening_bowler_guest_name: bowlerFields.guest_name,
      scorer_id: scorerId || undefined,
    };

    try {
      await startMatchMutation.mutateAsync({ id: matchId, payload });
      Alert.alert('Success', 'Match started successfully!', [
        {
          text: 'Go to Scorer',
          onPress: () => router.replace(`/sports/cricket/matches/${matchId}/score`),
        },
      ]);
    } catch (err) {
      // Handles match starting exceptions securely, matching any validation and race conditions.
      const error = err as {
        response?: {
          status: number;
          data?: {
            message?: string;
          };
        };
        message?: string;
      };
      const isAlreadyStarted =
        error.response?.status === 400 &&
        (error.response?.data?.message === 'Match is not in scheduled status' ||
         error.response?.data?.message?.includes('scheduled'));

      if (isAlreadyStarted) {
        // Handles match start race condition by updating the state 
        // and routing the captain to Scorer or Live screen accordingly.
        Alert.alert(
          'Match Already Started',
          'This match has already been started.',
          [
            {
              text: 'OK',
              onPress: async () => {
                const { data: updatedMatch } = await refetch();
                if (updatedMatch) {
                  const isScorer = myProfile && updatedMatch.scorer_id === myProfile.id;
                  if (isScorer) {
                    router.replace(`/sports/cricket/matches/${matchId}/score`);
                  } else {
                    router.replace(`/sports/cricket/matches/${matchId}/live`);
                  }
                } else {
                  router.replace(`/sports/cricket/matches/${matchId}/live`);
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to start match');
      }
    }
  };

  const renderPickerField = (
    label: string,
    valueKey: string | null,
    playersList: LineupPlayer[],
    onSelectType: 'striker' | 'nonStriker' | 'bowler' | 'scorer'
  ) => {
    const isSelected = !!valueKey;
    const name = getPlayerNameByKey(valueKey, playersList);

    return (
      <View style={styles.pickerSection}>
        <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>{label} *</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.pickerButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.sm }]}
          onPress={() => setActiveModal(onSelectType)}
        >
          <Text style={[styles.pickerButtonText, { color: isSelected ? theme.colors.textPrimary : theme.colors.textSecondary }]}>
            {name}
          </Text>
          <ChevronDown color={theme.colors.textSecondary} size={20} />
        </TouchableOpacity>
      </View>
    );
  };

  // Configure SafeAreaView to only protect top, left, and right.
  // The bottom edge is padded dynamically using insets.bottom inside ScrollView
  // and the absolute footer component below.
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={theme.colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Initialize Match</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Main scrollable body extending beneath the bottom absolute footer container */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom > 0 ? 100 + insets.bottom : 100 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Toss Winner Selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Toss Winner *</Text>
          <View style={styles.rowButtons}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.selectCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: tossWinnerId === match.team_a_id ? theme.colors.primary : theme.colors.border,
                  borderWidth: tossWinnerId === match.team_a_id ? 2 : 1,
                  borderRadius: theme.radius.md,
                },
              ]}
              onPress={() => setTossWinnerId(match.team_a_id)}
            >
              <Text style={[styles.selectCardText, { color: theme.colors.textPrimary, fontWeight: tossWinnerId === match.team_a_id ? '700' : '500' }]} numberOfLines={2}>
                {match.team_a.name}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.selectCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: tossWinnerId === match.team_b_id ? theme.colors.primary : theme.colors.border,
                  borderWidth: tossWinnerId === match.team_b_id ? 2 : 1,
                  borderRadius: theme.radius.md,
                },
              ]}
              onPress={() => setTossWinnerId(match.team_b_id)}
            >
              <Text style={[styles.selectCardText, { color: theme.colors.textPrimary, fontWeight: tossWinnerId === match.team_b_id ? '700' : '500' }]} numberOfLines={2}>
                {match.team_b.name}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Batting First Selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Batting First *</Text>
          <View style={styles.rowButtons}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.selectCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: battingFirstId === match.team_a_id ? theme.colors.primary : theme.colors.border,
                  borderWidth: battingFirstId === match.team_a_id ? 2 : 1,
                  borderRadius: theme.radius.md,
                },
              ]}
              onPress={() => {
                setBattingFirstId(match.team_a_id);
                // Clear players if batting order changed
                setStrikerKey(null);
                setNonStrikerKey(null);
                setBowlerKey(null);
              }}
            >
              <Text style={[styles.selectCardText, { color: theme.colors.textPrimary, fontWeight: battingFirstId === match.team_a_id ? '700' : '500' }]} numberOfLines={2}>
                {match.team_a.name}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.selectCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: battingFirstId === match.team_b_id ? theme.colors.primary : theme.colors.border,
                  borderWidth: battingFirstId === match.team_b_id ? 2 : 1,
                  borderRadius: theme.radius.md,
                },
              ]}
              onPress={() => {
                setBattingFirstId(match.team_b_id);
                // Clear players if batting order changed
                setStrikerKey(null);
                setNonStrikerKey(null);
                setBowlerKey(null);
              }}
            >
              <Text style={[styles.selectCardText, { color: theme.colors.textPrimary, fontWeight: battingFirstId === match.team_b_id ? '700' : '500' }]} numberOfLines={2}>
                {match.team_b.name}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Batsmen & Bowler Pickers */}
        {battingFirstId && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Opening Batsmen & Bowler</Text>
            
            {renderPickerField('Opening Striker', strikerKey, battingPlayers, 'striker')}
            {renderPickerField('Opening Non-Striker', nonStrikerKey, battingPlayers, 'nonStriker')}
            {renderPickerField('Opening Bowler', bowlerKey, bowlingPlayers, 'bowler')}
          </View>
        )}

        {/* Scorer Selector (Optional) */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Designated Scorer (Optional)</Text>
          <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 8 }}>
            Defaults to the match creator / captain if left unselected.
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.pickerButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.sm }]}
            onPress={() => {
              setSearchQuery('');
              setActiveModal('scorer');
            }}
          >
            <Text style={[styles.pickerButtonText, { color: scorerId ? theme.colors.textPrimary : theme.colors.textSecondary }]}>
              {scorerId
                ? selectedScorer?.name || 'Selected player'
                : 'Default (Captain)'}
            </Text>
            <ChevronDown color={theme.colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer Start Button */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 16,
          },
        ]}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: startMatchMutation.isPending ? theme.colors.border : theme.colors.primary,
              borderRadius: theme.radius.sm,
            },
          ]}
          onPress={handleStartMatch}
          disabled={startMatchMutation.isPending}
        >
          {startMatchMutation.isPending ? (
            <ActivityIndicator size="small" color={theme.colors.onPrimary} />
          ) : (
            <Text style={[styles.submitButtonText, { color: theme.colors.onPrimary }]}>Start Match</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Picker Selection Modals */}
      <Modal
        visible={activeModal !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setActiveModal(null)}
          />
          {/* Keyboard avoiding wrapper inside the modal overlays wrapping only the content box */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardAvoidingWrapper}
          >
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radius.md,
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                  {activeModal === 'striker' && 'Select Striker'}
                  {activeModal === 'nonStriker' && 'Select Non-Striker'}
                  {activeModal === 'bowler' && 'Select Opening Bowler'}
                  {activeModal === 'scorer' && 'Select Designated Scorer'}
                </Text>
                <TouchableOpacity
                  style={styles.modalHeaderClose}
                  onPress={() => setActiveModal(null)}
                >
                  <Text style={{ color: theme.colors.primary, fontWeight: '600', fontSize: 14 }}>
                    Done
                  </Text>
                </TouchableOpacity>
              </View>

              {activeModal === 'scorer' ? (
                // Custom Scorer Selection UI with Team Grouping & Search option
                <View style={{ flex: 1 }}>
                  <View style={[styles.searchContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.background, borderRadius: theme.radius.sm }]}>
                    <Search size={18} color={theme.colors.textSecondary} style={styles.searchIcon} />
                    <TextInput
                      style={[styles.searchInput, { color: theme.colors.textPrimary }]}
                      placeholder="Search players..."
                      placeholderTextColor={theme.colors.textSecondary}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>
                  
                  {isSearchingPlayers ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} style={{ margin: 20 }} />
                  ) : (
                    <ScrollView style={{ flex: 1, marginTop: 10 }} showsVerticalScrollIndicator={false}>
                      {searchQuery.trim() === '' ? (
                        <>
                          <Text style={[styles.groupHeader, { color: theme.colors.textSecondary }]}>{match.team_a.name}</Text>
                          {lineups.team_a.players.map((item) => renderScorerItem(item))}
                          {lineups.team_a.players.length === 0 && (
                            <Text style={[styles.emptyGroupText, { color: theme.colors.textSecondary }]}>No registered players</Text>
                          )}
                          
                          <Text style={[styles.groupHeader, { color: theme.colors.textSecondary, marginTop: 20 }]}>{match.team_b.name}</Text>
                          {lineups.team_b.players.map((item) => renderScorerItem(item))}
                          {lineups.team_b.players.length === 0 && (
                            <Text style={[styles.emptyGroupText, { color: theme.colors.textSecondary }]}>No registered players</Text>
                          )}
                        </>
                      ) : (
                        <>
                          <Text style={[styles.groupHeader, { color: theme.colors.textSecondary }]}>Search Results</Text>
                          {filteredSearchResults.map((item) => renderScorerItem(item))}
                          {filteredSearchResults.length === 0 && (
                            <Text style={[styles.emptyGroupText, { color: theme.colors.textSecondary }]}>No matching players found</Text>
                          )}
                        </>
                      )}
                    </ScrollView>
                  )}
                </View>
              ) : (
                // Original FlatList for opening batting order and bowler selection
                <FlatList
                  data={
                    activeModal === 'striker' || activeModal === 'nonStriker'
                      ? battingPlayers
                      : bowlingPlayers
                  }
                  keyExtractor={getPlayerKey}
                  renderItem={({ item }) => {
                    const key = getPlayerKey(item);
                    const isSelected =
                      activeModal === 'striker'
                        ? strikerKey === key
                        : activeModal === 'nonStriker'
                        ? nonStrikerKey === key
                        : bowlerKey === key;

                    return (
                      <TouchableOpacity
                        style={[styles.modalItem, { borderBottomColor: theme.colors.border }]}
                        onPress={() => {
                          if (activeModal === 'striker') setStrikerKey(key);
                          else if (activeModal === 'nonStriker') setNonStrikerKey(key);
                          else if (activeModal === 'bowler') setBowlerKey(key);

                          setActiveModal(null);
                        }}
                      >
                        {/* Truncate long player names to prevent UI overflow */}
                        <Text
                          style={[styles.modalItemText, { color: theme.colors.textPrimary }]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {item.name}
                        </Text>
                        {isSelected && <Check size={18} color={theme.colors.primary} />}
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={
                    <View style={{ padding: 20, alignItems: 'center' }}>
                      <Text style={{ color: theme.colors.textSecondary }}>No players available.</Text>
                    </View>
                  }
                />
              )}
            </View>
          </KeyboardAvoidingView>
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
    padding: 16,
    gap: 20,
    paddingBottom: 100,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  rowButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  selectCard: {
    flex: 1,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
  },
  selectCardText: {
    fontSize: 14,
    textAlign: 'center',
  },
  pickerSection: {
    marginTop: 12,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  pickerButton: {
    height: 48,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  pickerButtonText: {
    fontSize: 14,
  },
  // Dynamic footer height derived from contents and safe area padding at bottom
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  submitButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  // Centered modal overlay style (aligns a bit above center)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 60, // Shifts the modal slightly above the absolute center to offset bottom bars
  },
  keyboardAvoidingWrapper: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Stable centered modal card style
  modalContent: {
    width: '100%',
    height: 520, // Stable height prevents nested ScrollView collapse
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  // Bottom sheet header title container
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 16,
    position: 'relative',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  // Absolutely-positioned close/done text button on header right
  modalHeaderClose: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  modalItemText: {
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  // Style definitions for neutral scorer search layout
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    paddingVertical: 0,
  },
  groupHeader: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyGroupText: {
    fontSize: 12,
    fontStyle: 'italic',
    paddingLeft: 4,
    marginBottom: 8,
  },
  // Custom scorer search list row styles matching lineup declaration layout
  scorerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  // Fixed size 36x36 circular avatar container for initials or icons
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    flexGrow: 0,
    overflow: 'hidden',
  },
  avatarInitials: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  scorerInfoCol: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  // Player name text styling inside the scorer row matching lineup screen
  playerName: {
    fontSize: 14,
    fontWeight: '500',
  },
  playerSubtitle: {
    fontSize: 12,
  },
  guestText: {
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 0,
  },
  selectionIndicator: {
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

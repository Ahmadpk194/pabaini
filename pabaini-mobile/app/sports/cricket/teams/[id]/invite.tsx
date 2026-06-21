import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Search, Check } from 'lucide-react-native';
import { useTheme } from '../../../../../src/context/ThemeContext';
import { getCricketPlayers } from '../../../../../src/api/sports';
import { getTeamById, inviteToTeam } from '../../../../../src/services/sports/cricketTeamsApi';
import { CricketPlayerProfile, TeamFull } from '../../../../../src/types/sports.types';
import { Avatar } from '../../../../../src/components/ui/Avatar';
import { useAuth } from '../../../../../src/hooks/useAuth';
import { LoginRequiredGate } from '../../../../../src/components/ui/LoginRequiredGate';

const ROLE_LABELS: Record<string, string> = {
  batsman: 'Batsman',
  bowler: 'Bowler',
  allrounder: 'All-rounder',
  keeper: 'Wicket-keeper',
};

export default function InvitePlayerScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { isGuest } = useAuth();
  const teamId = typeof id === 'string' ? parseInt(id, 10) : parseInt(id?.[0] || '0', 10);

  // States
  const [players, setPlayers] = useState<CricketPlayerProfile[]>([]);
  const [team, setTeam] = useState<TeamFull | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Tracks optimistic UI invitation statuses: Record<playerId, 'idle' | 'sending' | 'sent'>
  const [inviteStatus, setInviteStatus] = useState<Record<number, 'idle' | 'sending' | 'sent'>>({});

  const loadData = async () => {
    if (isGuest) return;
    setLoading(true);
    try {
      const [teamData, playersData] = await Promise.all([
        getTeamById(teamId),
        getCricketPlayers(1, 100), // Get first 100 active players
      ]);

      setTeam(teamData);
      setPlayers(playersData.data || []);
    } catch (error) {
      console.error('Failed to load invite options:', error);
      Alert.alert('Error', 'Failed to retrieve player roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isGuest) {
      setLoading(false);
      return;
    }
    if (teamId) {
      loadData();
    }
  }, [teamId, isGuest]);

  // Filter out players who are already members or have pending requests/invites
  const getEligiblePlayers = () => {
    if (!team) return [];
    
    return players.filter((player) => {
      const isMemberOrPending = team.members.some(
        (m) => m.player.id === player.id && 
        ['active', 'pending_invite', 'pending_request'].includes(m.status)
      );
      // Also filter out the team captain
      const isCaptain = team.captain.id === player.id;

      return !isMemberOrPending && !isCaptain;
    });
  };

  const handleInvite = async (player: CricketPlayerProfile) => {
    if (isGuest) return;
    // Optimistic UI update: Set to sending state
    setInviteStatus((prev) => ({ ...prev, [player.id]: 'sending' }));

    try {
      await inviteToTeam(teamId, player.id);
      
      // Update state to sent
      setInviteStatus((prev) => ({ ...prev, [player.id]: 'sent' }));
    } catch (error: any) {
      // Revert state back on error and show alert
      setInviteStatus((prev) => ({ ...prev, [player.id]: 'idle' }));
      Alert.alert('Error', error.response?.data?.message || 'Failed to send invitation. Please try again.');
    }
  };

  const eligiblePlayers = getEligiblePlayers();
  const filteredPlayers = eligiblePlayers.filter((player) =>
    player.user.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const renderPlayerRow = ({ item }: { item: CricketPlayerProfile }) => {
    const status = inviteStatus[item.id] || 'idle';
    const isSending = status === 'sending';
    const isSent = status === 'sent';

    const battingText = `${item.batting_hand === 'right' ? 'RHB' : 'LHB'}`;
    let bowlingText = '';
    if (item.bowling_arm && item.bowling_arm !== 'none' && item.bowling_type && item.bowling_type !== 'none') {
      bowlingText = ` • ${item.bowling_arm === 'right' ? 'R' : 'L'}-${item.bowling_type}`;
    }

    const playingStyle = `${ROLE_LABELS[item.role]} • ${battingText}${bowlingText}`;

    return (
      <View style={[styles.playerRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Avatar uri={item.user.avatar_url} size={44} name={item.user.name} />
        
        <View style={styles.infoCol}>
          <Text style={[styles.playerName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
            {item.user.name}
          </Text>
          <Text style={[styles.playerStyleText, { color: theme.colors.textSecondary }]}>
            {playingStyle}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.inviteBtn,
            {
              backgroundColor: isSent ? '#E1F5EE' : theme.colors.primary,
              borderColor: isSent ? '#A7E9D2' : theme.colors.primary,
              borderWidth: 1,
              borderRadius: theme.radius.sm,
            },
            isSending && { opacity: 0.6 },
          ]}
          disabled={isSending || isSent}
          onPress={() => handleInvite(item)}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={theme.colors.onPrimary} />
          ) : isSent ? (
            <View style={styles.sentBtnContent}>
              <Check size={14} color="#04342C" />
              <Text style={[styles.inviteBtnText, { color: '#04342C' }]}>Sent</Text>
            </View>
          ) : (
            <Text style={[styles.inviteBtnText, { color: theme.colors.onPrimary }]}>Invite</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Search size={36} color={theme.colors.border} style={{ marginBottom: 12 }} />
        <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No players found</Text>
        <Text style={[styles.emptyDesc, { color: theme.colors.textSecondary }]}>
          {searchQuery.trim() !== ''
            ? 'Try searching with a different name.'
            : 'Everyone in the village has already joined or been invited.'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={theme.colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Invite Player</Text>
        <View style={{ width: 36 }} />
      </View>

      {isGuest ? (
        <View style={styles.loaderContainer}>
          <LoginRequiredGate fullscreen={false} />
        </View>
      ) : (
        <>
          {/* Sticky Search bar */}
          <View style={[styles.searchSection, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={[styles.searchWrapper, { backgroundColor: theme.colors.background }]}>
              <Search size={18} color={theme.colors.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: theme.colors.textPrimary }]}
                placeholder="Search players by name..."
                placeholderTextColor={theme.colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Players list */}
          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <FlatList
              data={filteredPlayers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderPlayerRow}
              ListEmptyComponent={renderEmpty}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}
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
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
    paddingVertical: 0,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  playerRow: {
    flexDirection: 'row',
    padding: 14,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
    marginLeft: 12,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  playerStyleText: {
    fontSize: 12,
  },
  inviteBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sentBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    marginHorizontal: 32,
    lineHeight: 18,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Check,
  ChevronUp,
  ChevronDown,
  Trash2,
  UserPlus,
  Plus,
  Users,
} from 'lucide-react-native';
import { useTheme } from '../../../../../src/context/ThemeContext';
import { useSportsStore } from '../../../../../src/store/sports/sportsStore';
import { useTeamDetail } from '../../../../../src/hooks/useTeams';
import {
  useMatchDetail,
  useLineup,
  useDeclareLineup,
} from '../../../../../src/hooks/useMatches';
import { Avatar } from '../../../../../src/components/ui/Avatar';
import { useAuth } from '../../../../../src/hooks/useAuth';
import { LoginRequiredGate } from '../../../../../src/components/ui/LoginRequiredGate';

interface LocalLineupEntry {
  key: string;
  player_id?: number;
  guest_name?: string;
  name: string;
  avatar_url?: string | null;
}

const MIN_PLAYERS = 6;
const MAX_PLAYERS = 11;

export default function DeclarePlayingXIScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = Number(id);
  const { isGuest } = useAuth();

  // Zustand Store
  const myProfile = useSportsStore((state) => state.registrations['cricket']?.profile);

  // Queries
  const { data: match, isLoading: isLoadingMatch } = useMatchDetail(matchId);
  const { data: currentLineups, isLoading: isLoadingLineups } = useLineup(matchId);
  const declareMutation = useDeclareLineup();

  // State
  const [pickedPlayers, setPickedPlayers] = useState<LocalLineupEntry[]>([]);
  const [guestName, setGuestName] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Determine role & owning team
  const isTeamACaptain = myProfile && match?.team_a.captain?.id === myProfile.id;
  const isTeamBCaptain = myProfile && match?.team_b.captain?.id === myProfile.id;
  const isEitherCaptain = isTeamACaptain || isTeamBCaptain;
  const declaringTeamId = isTeamACaptain ? match?.team_a_id : match?.team_b_id;

  // Fetch squad details
  const { data: teamDetail, isLoading: isLoadingTeam } = useTeamDetail(declaringTeamId || 0);

  // Auth Guard
  useEffect(() => {
    if (isGuest) return;
    if (myProfile === undefined) return;
    if (match && !isLoadingMatch && !isEitherCaptain) {
      Alert.alert('Access Denied', 'Only the captain of either team can declare lineups.');
      router.back();
    }
  }, [match, isLoadingMatch, isEitherCaptain, isGuest, myProfile]);

  // Pre-fill lineups if edit mode / already set
  const captainLineup = isTeamACaptain ? currentLineups?.team_a : currentLineups?.team_b;
  useEffect(() => {
    if (captainLineup?.lineup_set && captainLineup.players.length > 0 && pickedPlayers.length === 0) {
      const initial = captainLineup.players.map((p) => ({
        key: p.player_id ? `player-${p.player_id}` : `guest-${p.guest_name}-${Date.now()}-${Math.random()}`,
        player_id: p.player_id || undefined,
        guest_name: p.guest_name || undefined,
        name: p.name,
        avatar_url: p.avatar_url,
      }));
      setPickedPlayers(initial);
    }
  }, [captainLineup, pickedPlayers]);

  const activeMembers = teamDetail?.members.filter((m) => m.status === 'active') || [];

  // Toggle registered player selection
  const handleTogglePlayer = (player: typeof activeMembers[0]['player']) => {
    const isPicked = pickedPlayers.some((p) => p.player_id === player.id);

    if (isPicked) {
      setPickedPlayers((prev) => prev.filter((p) => p.player_id !== player.id));
    } else {
      if (pickedPlayers.length >= MAX_PLAYERS) {
        Alert.alert('Roster Full', `You can only declare up to ${MAX_PLAYERS} players in the Playing XI.`);
        return;
      }
      const newEntry: LocalLineupEntry = {
        key: `player-${player.id}`,
        player_id: player.id,
        name: player.user.name,
        avatar_url: player.user.avatar_url,
      };
      setPickedPlayers((prev) => [...prev, newEntry]);
    }
  };

  // Add guest player
  const handleAddGuest = () => {
    if (!guestName.trim()) {
      Alert.alert('Invalid Name', 'Guest name cannot be empty.');
      return;
    }
    if (pickedPlayers.length >= MAX_PLAYERS) {
      Alert.alert('Roster Full', `You can only declare up to ${MAX_PLAYERS} players in the Playing XI.`);
      return;
    }

    const guestKey = `guest-${guestName.trim()}-${Date.now()}-${Math.random()}`;
    const newEntry: LocalLineupEntry = {
      key: guestKey,
      guest_name: guestName.trim(),
      name: guestName.trim(),
      avatar_url: null,
    };

    setPickedPlayers((prev) => [...prev, newEntry]);
    setGuestName('');
  };

  // Remove player from picked
  const handleRemovePicked = (key: string) => {
    setPickedPlayers((prev) => prev.filter((p) => p.key !== key));
  };

  // Rearranging batting order
  const moveUp = (index: number) => {
    if (index === 0) return;
    setPickedPlayers((prev) => {
      const list = [...prev];
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
      return list;
    });
  };

  const moveDown = (index: number) => {
    if (index === pickedPlayers.length - 1) return;
    setPickedPlayers((prev) => {
      const list = [...prev];
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
      return list;
    });
  };

  // Form submission
  const handleSubmit = async () => {
    if (isGuest) return;
    if (pickedPlayers.length < MIN_PLAYERS || pickedPlayers.length > MAX_PLAYERS) {
      Alert.alert('Lineup Error', `Playing XI must have between ${MIN_PLAYERS} and ${MAX_PLAYERS} players.`);
      return;
    }

    setSubmitError(null);
    const playersPayload = pickedPlayers.map((p, idx) => ({
      player_id: p.player_id,
      guest_name: p.guest_name,
      batting_order: idx + 1,
    }));

    try {
      await declareMutation.mutateAsync({
        id: matchId,
        payload: { players: playersPayload },
      });
      Alert.alert('Success', 'Playing XI lineup has been declared successfully!');
      router.back();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to submit lineup';
      setSubmitError(errMsg);
      Alert.alert('Error', errMsg);
    }
  };

  const isLoading = !isGuest && (isLoadingMatch || isLoadingLineups || isLoadingTeam || myProfile === undefined);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.surface }]}>
        <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.surface }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header Bar */}
        <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color={theme.colors.textPrimary} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
            Declare Playing XI
          </Text>
          <View style={{ width: 36 }} />
        </View>

        {isGuest ? (
          <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
            <LoginRequiredGate fullscreen={false} />
          </View>
        ) : (
          <>
            <ScrollView
              style={{ flex: 1, backgroundColor: theme.colors.background }}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {submitError && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{submitError}</Text>
                </View>
              )}

          {/* Running Selected Count & Progress Banner */}
          <View style={[styles.counterCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.md }]}>
            <Users color={theme.colors.primary} size={28} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.counterTitle, { color: theme.colors.textPrimary }]}>
                Selected Players: {pickedPlayers.length}/11 (min 6)
              </Text>
              <Text style={[styles.counterDesc, { color: theme.colors.textSecondary, marginBottom: 4 }]}>
                Village cricket — between 6 and 11 players
              </Text>
              {pickedPlayers.length < 6 ? (
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#D32F2F' }}>
                  Need {6 - pickedPlayers.length} more to start
                </Text>
              ) : pickedPlayers.length < 11 ? (
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#2E7D32' }}>
                  Ready · add more if available
                </Text>
              ) : (
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.primary }}>
                  Full squad
                </Text>
              )}
            </View>
          </View>

          {/* Batting Lineup List (Reordering Area) */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Batting Order {pickedPlayers.length > 0 ? `(1 - ${pickedPlayers.length})` : ''}
            </Text>
            {pickedPlayers.length === 0 ? (
              <View style={[styles.emptyPicked, { borderColor: theme.colors.border, borderRadius: theme.radius.sm }]}>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
                  No players selected yet. Tap squad members below to add.
                </Text>
              </View>
            ) : (
              <View style={[styles.pickedListContainer, { borderColor: theme.colors.border, borderRadius: theme.radius.sm, backgroundColor: theme.colors.surface }]}>
                {pickedPlayers.map((player, index) => (
                  <View
                    key={player.key}
                    style={[styles.pickedRow, { borderBottomColor: index === pickedPlayers.length - 1 ? 'transparent' : theme.colors.border }]}
                  >
                    <View style={[styles.orderNumber, { backgroundColor: theme.colors.primary + '15' }]}>
                      <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: 13 }}>
                        {index + 1}
                      </Text>
                    </View>
                    
                    <View style={styles.avatarWrapper}>
                      <Avatar uri={player.avatar_url} size={28} name={player.name} />
                    </View>

                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.pickedName, { color: theme.colors.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
                        {player.name}
                      </Text>
                      {player.guest_name && (
                        <View style={styles.guestTag}>
                          <Text style={styles.guestTagText}>Guest</Text>
                        </View>
                      )}
                    </View>

                    {/* Reorder Buttons */}
                    <View style={styles.reorderButtons}>
                      <TouchableOpacity
                        style={styles.reorderBtn}
                        onPress={() => moveUp(index)}
                        disabled={index === 0}
                      >
                        <ChevronUp color={index === 0 ? theme.colors.border : theme.colors.textPrimary} size={20} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.reorderBtn}
                        onPress={() => moveDown(index)}
                        disabled={index === pickedPlayers.length - 1}
                      >
                        <ChevronDown color={index === pickedPlayers.length - 1 ? theme.colors.border : theme.colors.textPrimary} size={20} />
                      </TouchableOpacity>
                    </View>

                    {/* Delete Button */}
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleRemovePicked(player.key)}
                    >
                      <Trash2 color="#FF3B30" size={18} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Add Guest Player Form */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Add Guest Player
            </Text>
            <View style={styles.guestInputRow}>
              <TextInput
                style={[styles.input, { flex: 1, backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.textPrimary, borderRadius: theme.radius.sm }]}
                placeholder="Enter guest player's name..."
                placeholderTextColor={theme.colors.textSecondary}
                value={guestName}
                onChangeText={setGuestName}
                maxLength={50}
              />
              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.addGuestBtn, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm }]}
                onPress={handleAddGuest}
              >
                <Plus color={theme.colors.onPrimary} size={20} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Select Registered Squad Members Checklist */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Select from Registered Squad
            </Text>
            {activeMembers.length === 0 ? (
              <Text style={{ color: theme.colors.textSecondary, fontStyle: 'italic' }}>
                No active squad members found.
              </Text>
            ) : (
              <View style={{ gap: 8 }}>
                {activeMembers.map((member) => {
                  const isPicked = pickedPlayers.some((p) => p.player_id === member.player.id);
                  return (
                    <TouchableOpacity
                      key={member.id}
                      activeOpacity={0.7}
                      style={[
                        styles.squadRow,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor: isPicked ? theme.colors.primary : theme.colors.border,
                          borderWidth: isPicked ? 1.5 : 1,
                          borderRadius: theme.radius.sm,
                        },
                      ]}
                      onPress={() => handleTogglePlayer(member.player)}
                    >
                      <View style={styles.avatarWrapper}>
                        <Avatar uri={member.player.user.avatar_url} size={40} name={member.player.user.name} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[styles.playerName, { color: theme.colors.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
                          {member.player.user.name}
                        </Text>
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 11, textTransform: 'capitalize' }}>
                          {member.player.role} • {member.player.batting_hand}-hand bat
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.checkbox,
                          {
                            borderColor: isPicked ? theme.colors.primary : theme.colors.border,
                            backgroundColor: isPicked ? theme.colors.primary : 'transparent',
                          },
                        ]}
                      >
                        {isPicked && <Check size={12} color={theme.colors.onPrimary} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Submit Footer */}
        <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: pickedPlayers.length >= MIN_PLAYERS && pickedPlayers.length <= MAX_PLAYERS && !declareMutation.isPending ? theme.colors.primary : theme.colors.border,
                borderRadius: theme.radius.sm,
              },
            ]}
            onPress={handleSubmit}
            disabled={pickedPlayers.length < MIN_PLAYERS || pickedPlayers.length > MAX_PLAYERS || declareMutation.isPending}
          >
            {declareMutation.isPending ? (
              <ActivityIndicator size="small" color={theme.colors.onPrimary} />
            ) : (
              <Text style={[styles.submitButtonText, { color: pickedPlayers.length >= MIN_PLAYERS ? theme.colors.onPrimary : theme.colors.textSecondary }]}>
                Submit Playing XI
              </Text>
            )}
          </TouchableOpacity>
        </View>
          </>
        )}
      </KeyboardAvoidingView>
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
  errorBanner: {
    backgroundColor: '#FCEBEB',
    borderWidth: 1,
    borderColor: '#F7C5C5',
    borderRadius: 8,
    padding: 12,
  },
  errorBannerText: {
    color: '#791F1F',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  counterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
  },
  counterTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  counterDesc: {
    fontSize: 12,
  },
  section: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyPicked: {
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  pickedListContainer: {
    borderWidth: 1,
  },
  // Row layout representing a picked player in the lineup checklist
  pickedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  orderNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  // Wrapper for player avatar to enforce fixed size and avoid scaling in flex rows
  avatarWrapper: {
    flexShrink: 0,
    flexGrow: 0,
  },
  pickedName: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  guestTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECEFF1',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    marginTop: 2,
  },
  guestTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#455A64',
  },
  reorderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  reorderBtn: {
    padding: 4,
  },
  deleteBtn: {
    padding: 6,
    flexShrink: 0,
  },
  guestInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  addGuestBtn: {
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Row layout representing a registered squad member in the selection checklist
  squadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    gap: 10,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  submitButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

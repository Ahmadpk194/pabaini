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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ChevronDown, Check } from 'lucide-react-native';
import { useTheme } from '../../../../../src/context/ThemeContext';
import { useSportsStore } from '../../../../../src/store/sports/sportsStore';
import { useMatchDetail, useLineup, useStartLiveMatch } from '../../../../../src/hooks/useMatches';

interface LineupPlayer {
  id: number;
  player_id: number | null;
  guest_name: string | null;
  name: string;
}

export default function StartMatchScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = Number(id);

  // Zustand Store
  const myProfile = useSportsStore((state) => state.registrations['cricket']?.profile);

  // Queries & Mutations
  const { data: match, isLoading: isLoadingMatch } = useMatchDetail(matchId);
  const { data: lineups, isLoading: isLoadingLineup } = useLineup(matchId);
  const startMatchMutation = useStartLiveMatch();

  // Selection states
  const [tossWinnerId, setTossWinnerId] = useState<number | null>(null);
  const [battingFirstId, setBattingFirstId] = useState<number | null>(null);
  const [strikerKey, setStrikerKey] = useState<string | null>(null);
  const [nonStrikerKey, setNonStrikerKey] = useState<string | null>(null);
  const [bowlerKey, setBowlerKey] = useState<string | null>(null);
  const [scorerId, setScorerId] = useState<number | null>(null);

  // Modal visibility states
  const [activeModal, setActiveModal] = useState<'striker' | 'nonStriker' | 'bowler' | 'scorer' | null>(null);

  // Auth & Status Guard
  useEffect(() => {
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
        Alert.alert('Invalid Action', `Match cannot be started because its status is ${match.status}.`);
        router.back();
        return;
      }

      if (!match.team_a_lineup_set || !match.team_b_lineup_set) {
        Alert.alert('Lineups Not Ready', 'Both teams must declare their Playing XI lineups before starting.');
        router.back();
      }
    }
  }, [match, isLoadingMatch, myProfile]);

  const isLoading = isLoadingMatch || isLoadingLineup;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
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
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to start match');
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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={theme.colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Initialize Match</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
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
            onPress={() => setActiveModal('scorer')}
          >
            <Text style={[styles.pickerButtonText, { color: scorerId ? theme.colors.textPrimary : theme.colors.textSecondary }]}>
              {scorerId
                ? allRegisteredPlayers.find((p) => p.player_id === scorerId)?.name || 'Selected player'
                : 'Default (Captain)'}
            </Text>
            <ChevronDown color={theme.colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer Start Button */}
      <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
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
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
              {activeModal === 'striker' && 'Select Striker'}
              {activeModal === 'nonStriker' && 'Select Non-Striker'}
              {activeModal === 'bowler' && 'Select Opening Bowler'}
              {activeModal === 'scorer' && 'Select Scorer'}
            </Text>

            <FlatList
              data={
                activeModal === 'striker' || activeModal === 'nonStriker'
                  ? battingPlayers
                  : activeModal === 'bowler'
                  ? bowlingPlayers
                  : allRegisteredPlayers
              }
              keyExtractor={(item) => (activeModal === 'scorer' ? `s-${item.player_id}` : getPlayerKey(item))}
              renderItem={({ item }) => {
                const key = getPlayerKey(item);
                const isSelected =
                  activeModal === 'striker'
                    ? strikerKey === key
                    : activeModal === 'nonStriker'
                    ? nonStrikerKey === key
                    : activeModal === 'bowler'
                    ? bowlerKey === key
                    : scorerId === item.player_id;

                return (
                  <TouchableOpacity
                    style={[styles.modalItem, { borderBottomColor: theme.colors.border }]}
                    onPress={() => {
                      if (activeModal === 'striker') setStrikerKey(key);
                      else if (activeModal === 'nonStriker') setNonStrikerKey(key);
                      else if (activeModal === 'bowler') setBowlerKey(key);
                      else if (activeModal === 'scorer') setScorerId(item.player_id);

                      setActiveModal(null);
                    }}
                  >
                    <Text style={[styles.modalItemText, { color: theme.colors.textPrimary }]}>
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

            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.modalCloseBtn, { borderColor: theme.colors.border, borderWidth: 1 }]}
              onPress={() => {
                if (activeModal === 'scorer') {
                  setScorerId(null);
                }
                setActiveModal(null);
              }}
            >
              <Text style={{ color: theme.colors.textPrimary, fontWeight: '600' }}>
                {activeModal === 'scorer' ? 'Clear & Close' : 'Close'}
              </Text>
            </TouchableOpacity>
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
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
  },
  modalCloseBtn: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    marginTop: 16,
  },
});

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
  Modal,
  FlatList,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Trophy,
  Award,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '../../../../../src/context/ThemeContext';
import { useSportsStore } from '../../../../../src/store/sports/sportsStore';
import {
  useMatchDetail,
  useLineup,
  useSubmitResult,
  useEditResult,
} from '../../../../../src/hooks/useMatches';
import { Avatar } from '../../../../../src/components/ui/Avatar';

interface LocalStatEntry {
  key: string; // "player-ID" or "guest-NAME"
  player_id?: number;
  guest_name?: string;
  team_id: number;
  name: string;
  runs: number;
  balls_faced: number;
  fours: number;
  sixes: number;
  how_out?: string | null;
  is_not_out: boolean;
  overs_bowled: number;
  runs_given: number;
  wickets: number;
  wides: number;
  no_balls: number;
}

const DISMISSAL_OPTIONS = [
  { label: 'Not Out', value: 'not_out' },
  { label: 'Bowled', value: 'bowled' },
  { label: 'Caught', value: 'caught' },
  { label: 'Run Out', value: 'run_out' },
  { label: 'LBW', value: 'lbw' },
  { label: 'Stumped', value: 'stumped' },
  { label: 'Hit Wicket', value: 'hit_wicket' },
  { label: 'Retired', value: 'retired' },
  { label: 'Did Not Bat / N/A', value: 'na' },
];

export default function MatchResultFormScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = Number(id);

  // Zustand Store
  const myProfile = useSportsStore((state) => state.registrations['cricket']?.profile);

  // Queries & Mutations
  const { data: match, isLoading: isLoadingMatch } = useMatchDetail(matchId);
  const { data: lineups, isLoading: isLoadingLineup } = useLineup(matchId);
  const submitResultMutation = useSubmitResult();
  const editResultMutation = useEditResult();

  const isEditMode = match?.status === 'completed';

  // Form states
  const [winnerTeamId, setWinnerTeamId] = useState<number | null>(null);
  const [teamAScore, setTeamAScore] = useState('');
  const [teamBScore, setTeamBScore] = useState('');
  const [manOfMatchId, setManOfMatchId] = useState<number | null>(null);
  const [manOfMatchGuestName, setManOfMatchGuestName] = useState<string | null>(null);
  const [playerStats, setPlayerStats] = useState<LocalStatEntry[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Accordion expands
  const [expandedPlayerKey, setExpandedPlayerKey] = useState<string | null>(null);
  const [activeDismissalSelectKey, setActiveDismissalSelectKey] = useState<string | null>(null);
  const [momModalVisible, setMomModalVisible] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auth Guard & Redirects
  useEffect(() => {
    if (match && !isLoadingMatch) {
      const isTeamACaptain = myProfile && match.team_a.captain?.id === myProfile.id;
      const isTeamBCaptain = myProfile && match.team_b.captain?.id === myProfile.id;
      const isEitherCaptain = isTeamACaptain || isTeamBCaptain;

      if (!isEitherCaptain) {
        Alert.alert('Access Denied', 'Only the captain of either team can submit or edit results.');
        router.back();
        return;
      }

      if (isEditMode && !match.is_result_editable) {
        Alert.alert('Result Locked', 'The 24-hour edit window for this match has expired.');
        router.back();
      }
    }
  }, [match, isLoadingMatch, isEditMode, myProfile]);

  // Initializing state with lineups
  useEffect(() => {
    if (match && lineups && !isInitialized) {
      // 1. Winner & Scores
      if (isEditMode) {
        setWinnerTeamId(match.winner_team_id);
        setTeamAScore(match.team_a_score || '');
        setTeamBScore(match.team_b_score || '');
        setManOfMatchId(match.man_of_match_id || null);
        setManOfMatchGuestName(match.man_of_match_guest_name || null);
      }

      // 2. Roster players setup
      const allRosterPlayers: LocalStatEntry[] = [];

      const setupRoster = (players: typeof lineups.team_a.players, teamId: number) => {
        players.forEach((p) => {
          const key = p.player_id ? `player-${p.player_id}` : `guest-${p.guest_name}`;
          
          // If editing, try to find existing player stats
          const existingStat = isEditMode
            ? match.player_stats?.find((s) =>
                p.player_id ? s.player_id === p.player_id : s.guest_name === p.guest_name
              )
            : null;

          allRosterPlayers.push({
            key,
            player_id: p.player_id || undefined,
            guest_name: p.guest_name || undefined,
            team_id: teamId,
            name: p.name,
            runs: existingStat?.runs ?? 0,
            balls_faced: existingStat?.balls_faced ?? 0,
            fours: existingStat?.fours ?? 0,
            sixes: existingStat?.sixes ?? 0,
            how_out: existingStat?.how_out ?? null,
            is_not_out: existingStat?.is_not_out ?? false,
            overs_bowled: existingStat?.overs_bowled ?? 0,
            runs_given: existingStat?.runs_given ?? 0,
            wickets: existingStat?.wickets ?? 0,
            wides: existingStat?.wides ?? 0,
            no_balls: existingStat?.no_balls ?? 0,
          });
        });
      };

      setupRoster(lineups.team_a.players, match.team_a_id);
      setupRoster(lineups.team_b.players, match.team_b_id);

      setPlayerStats(allRosterPlayers);
      setIsInitialized(true);
    }
  }, [match, lineups, isEditMode, isInitialized]);

  // Find selected Man of the Match player (could be registered or guest)
  const selectedMomPlayer = playerStats.find((p) => {
    if (manOfMatchId) {
      return p.player_id === manOfMatchId;
    }
    if (manOfMatchGuestName) {
      return p.guest_name === manOfMatchGuestName;
    }
    return false;
  });

  // Stats update helper
  const updatePlayerStat = (key: string, field: keyof LocalStatEntry, value: any) => {
    setPlayerStats((prev) =>
      prev.map((stat) => (stat.key === key ? { ...stat, [field]: value } : stat))
    );
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!winnerTeamId) {
      newErrors.winner = 'Winner selection is required';
    }
    if (!teamAScore.trim()) {
      newErrors.teamAScore = `${match?.team_a.name} score is required`;
    }
    if (!teamBScore.trim()) {
      newErrors.teamBScore = `${match?.team_b.name} score is required`;
    }

    // Validate decimal overs_bowled (e.g. 2.6 is invalid, must be between x.0 and x.5)
    let hasInvalidOvers = false;
    playerStats.forEach((p) => {
      const overStr = String(p.overs_bowled);
      if (overStr.includes('.')) {
        const decimalPart = Number(overStr.split('.')[1]);
        if (decimalPart > 5) {
          hasInvalidOvers = true;
        }
      }
    });

    if (hasInvalidOvers) {
      Alert.alert(
        'Invalid Overs',
        'Overs bowled decimals represent balls (0 to 5). Values like .6, .7 etc. are invalid.'
      );
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !match) return;

    const payload = {
      winner_team_id: winnerTeamId!,
      man_of_match_id: manOfMatchId || undefined,
      man_of_match_guest_name: manOfMatchGuestName || undefined,
      team_a_score: teamAScore.trim(),
      team_b_score: teamBScore.trim(),
      player_stats: playerStats.map((p) => ({
        player_id: p.player_id,
        guest_name: p.guest_name,
        team_id: p.team_id,
        runs: p.runs,
        balls_faced: p.balls_faced,
        fours: p.fours,
        sixes: p.sixes,
        how_out: p.how_out || undefined,
        is_not_out: p.is_not_out,
        overs_bowled: p.overs_bowled,
        runs_given: p.runs_given,
        wickets: p.wickets,
        wides: p.wides,
        no_balls: p.no_balls,
      })),
    };

    try {
      if (isEditMode) {
        await editResultMutation.mutateAsync({ id: matchId, payload });
        Alert.alert('Success', 'Match result updated successfully!');
      } else {
        await submitResultMutation.mutateAsync({ id: matchId, payload });
        Alert.alert('Success', 'Match result submitted successfully!');
      }
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to save result');
    }
  };

  const isPending = submitResultMutation.isPending || editResultMutation.isPending;
  const isLoading = isLoadingMatch || isLoadingLineup || !isInitialized;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const teamAStats = playerStats.filter((p) => p.team_id === match?.team_a_id);
  const teamBStats = playerStats.filter((p) => p.team_id === match?.team_b_id);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header Bar */}
        <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} disabled={isPending}>
            <ArrowLeft color={theme.colors.textPrimary} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
            {isEditMode ? 'Edit Match Result' : 'Submit Match Result'}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Winner Selector Cards */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Select Winner *</Text>
            <View style={styles.winnerRow}>
              {/* Team A */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.winnerCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: winnerTeamId === match?.team_a_id ? theme.colors.primary : theme.colors.border,
                    borderWidth: winnerTeamId === match?.team_a_id ? 2 : 1,
                    borderRadius: theme.radius.md,
                  },
                ]}
                onPress={() => setWinnerTeamId(match!.team_a_id)}
                disabled={isPending}
              >
                <Trophy size={20} color={winnerTeamId === match?.team_a_id ? '#D4A700' : theme.colors.textSecondary} />
                <Text style={[styles.winnerName, { color: theme.colors.textPrimary }]} numberOfLines={2}>
                  {match?.team_a.name}
                </Text>
              </TouchableOpacity>

              {/* Team B */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.winnerCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: winnerTeamId === match?.team_b_id ? theme.colors.primary : theme.colors.border,
                    borderWidth: winnerTeamId === match?.team_b_id ? 2 : 1,
                    borderRadius: theme.radius.md,
                  },
                ]}
                onPress={() => setWinnerTeamId(match!.team_b_id)}
                disabled={isPending}
              >
                <Trophy size={20} color={winnerTeamId === match?.team_b_id ? '#D4A700' : theme.colors.textSecondary} />
                <Text style={[styles.winnerName, { color: theme.colors.textPrimary }]} numberOfLines={2}>
                  {match?.team_b.name}
                </Text>
              </TouchableOpacity>
            </View>
            {errors.winner && <Text style={styles.errorText}>{errors.winner}</Text>}
          </View>

          {/* Scores Entry */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Final Scoreboards *</Text>
            <View style={styles.scoreInputRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>{match?.team_a.name} Score</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: errors.teamAScore ? '#FF3B30' : theme.colors.border, color: theme.colors.textPrimary, borderRadius: theme.radius.sm }]}
                  placeholder="e.g. 145/6 (20)"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={teamAScore}
                  onChangeText={setTeamAScore}
                  editable={!isPending}
                />
                {errors.teamAScore && <Text style={styles.errorText}>{errors.teamAScore}</Text>}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>{match?.team_b.name} Score</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: errors.teamBScore ? '#FF3B30' : theme.colors.border, color: theme.colors.textPrimary, borderRadius: theme.radius.sm }]}
                  placeholder="e.g. 120/10 (18.4)"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={teamBScore}
                  onChangeText={setTeamBScore}
                  editable={!isPending}
                />
                {errors.teamBScore && <Text style={styles.errorText}>{errors.teamBScore}</Text>}
              </View>
            </View>
          </View>

          {/* Man of the Match Selector */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Man of the Match (Optional)</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.pickerButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.sm }]}
              onPress={() => setMomModalVisible(true)}
              disabled={isPending}
            >
              <Text style={[styles.pickerButtonText, { color: selectedMomPlayer ? theme.colors.textPrimary : theme.colors.textSecondary }]}>
                {selectedMomPlayer
                  ? selectedMomPlayer.player_id
                    ? selectedMomPlayer.name
                    : `${selectedMomPlayer.name} (Guest)`
                  : 'Select player'}
              </Text>
              <ChevronDown color={theme.colors.textSecondary} size={20} />
            </TouchableOpacity>
          </View>

          {/* Player Stats Sections */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Roster Player Stats</Text>
            <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 12 }}>
              Tap on any player row to expand and input batting/bowling statistics.
            </Text>

            {/* Team A Stats Accordion */}
            <Text style={[styles.teamAccordionHeader, { color: theme.colors.primary }]}>{match?.team_a.name}</Text>
            <View style={[styles.statsBlock, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
              {teamAStats.map((stat, idx) => {
                const isExpanded = expandedPlayerKey === stat.key;
                
                // Construct a small preview string
                const batPreview = stat.runs > 0 || stat.balls_faced > 0
                  ? `${stat.runs} runs (${stat.balls_faced}b)${stat.is_not_out ? ' no' : ''}`
                  : '';
                const bowlPreview = stat.overs_bowled > 0
                  ? `${stat.wickets} wkts (${stat.overs_bowled} ov)`
                  : '';
                const preview = [batPreview, bowlPreview].filter(Boolean).join(', ') || 'No stats recorded';

                return (
                  <View
                    key={stat.key}
                    style={[styles.playerAccordionRow, { borderBottomWidth: idx === teamAStats.length - 1 ? 0 : 0.5, borderBottomColor: theme.colors.border }]}
                  >
                    {/* Collapsed Header Touch */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.playerHeaderTouch}
                      onPress={() => setExpandedPlayerKey(isExpanded ? null : stat.key)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.playerName, { color: theme.colors.textPrimary }]}>{stat.name}</Text>
                        <Text style={{ fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 }}>{preview}</Text>
                      </View>
                      {isExpanded ? (
                        <ChevronUp color={theme.colors.textSecondary} size={18} />
                      ) : (
                        <ChevronRight color={theme.colors.textSecondary} size={18} />
                      )}
                    </TouchableOpacity>

                    {/* Expanded Inputs Block */}
                    {isExpanded && (
                      <View style={styles.inputsBlock}>
                        {/* Batting Header */}
                        <Text style={[styles.subBlockHeader, { color: theme.colors.textSecondary }]}>Batting</Text>
                        <View style={styles.formRow}>
                          <View style={styles.inputWrap}>
                            <Text style={styles.fieldLabel}>Runs</Text>
                            <TextInput
                              style={[styles.statInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                              keyboardType="numeric"
                              value={String(stat.runs)}
                              onChangeText={(val) => updatePlayerStat(stat.key, 'runs', Number(val.replace(/[^0-9]/g, '')))}
                            />
                          </View>
                          <View style={styles.inputWrap}>
                            <Text style={styles.fieldLabel}>Balls</Text>
                            <TextInput
                              style={[styles.statInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                              keyboardType="numeric"
                              value={String(stat.balls_faced)}
                              onChangeText={(val) => updatePlayerStat(stat.key, 'balls_faced', Number(val.replace(/[^0-9]/g, '')))}
                            />
                          </View>
                          <View style={styles.inputWrap}>
                            <Text style={styles.fieldLabel}>4s</Text>
                            <TextInput
                              style={[styles.statInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                              keyboardType="numeric"
                              value={String(stat.fours)}
                              onChangeText={(val) => updatePlayerStat(stat.key, 'fours', Number(val.replace(/[^0-9]/g, '')))}
                            />
                          </View>
                          <View style={styles.inputWrap}>
                            <Text style={styles.fieldLabel}>6s</Text>
                            <TextInput
                              style={[styles.statInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                              keyboardType="numeric"
                              value={String(stat.sixes)}
                              onChangeText={(val) => updatePlayerStat(stat.key, 'sixes', Number(val.replace(/[^0-9]/g, '')))}
                            />
                          </View>
                        </View>

                        <View style={[styles.formRow, { marginTop: 12, alignItems: 'center' }]}>
                          <View style={{ flex: 1.5 }}>
                            <Text style={styles.fieldLabel}>Dismissal Mode</Text>
                            <TouchableOpacity
                              style={[styles.dismissalBtn, { borderColor: theme.colors.border }]}
                              onPress={() => setActiveDismissalSelectKey(stat.key)}
                            >
                              <Text style={{ fontSize: 13, color: theme.colors.textPrimary, textTransform: 'capitalize' }}>
                                {stat.how_out ? stat.how_out.replace(/_/g, ' ') : stat.is_not_out ? 'Not Out' : 'Did Not Bat / NA'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={styles.fieldLabel}>Not Out?</Text>
                            <Switch
                              value={stat.is_not_out}
                              onValueChange={(val) => {
                                updatePlayerStat(stat.key, 'is_not_out', val);
                                if (val) {
                                  updatePlayerStat(stat.key, 'how_out', null);
                                }
                              }}
                              trackColor={{ false: '#E2E5E2', true: theme.colors.primary }}
                              thumbColor="#FFFFFF"
                            />
                          </View>
                        </View>

                        {/* Bowling Header */}
                        <Text style={[styles.subBlockHeader, { color: theme.colors.textSecondary, marginTop: 16 }]}>Bowling</Text>
                        <View style={styles.formRow}>
                          <View style={styles.inputWrap}>
                            <Text style={styles.fieldLabel}>Overs</Text>
                            <TextInput
                              style={[styles.statInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                              keyboardType="numeric"
                              value={String(stat.overs_bowled)}
                              onChangeText={(val) => {
                                // Allow decimals
                                if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                                  updatePlayerStat(stat.key, 'overs_bowled', val === '' ? 0 : Number(val));
                                }
                              }}
                            />
                          </View>
                          <View style={styles.inputWrap}>
                            <Text style={styles.fieldLabel}>Runs Conceded</Text>
                            <TextInput
                              style={[styles.statInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                              keyboardType="numeric"
                              value={String(stat.runs_given)}
                              onChangeText={(val) => updatePlayerStat(stat.key, 'runs_given', Number(val.replace(/[^0-9]/g, '')))}
                            />
                          </View>
                          <View style={styles.inputWrap}>
                            <Text style={styles.fieldLabel}>Wkts</Text>
                            <TextInput
                              style={[styles.statInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                              keyboardType="numeric"
                              value={String(stat.wickets)}
                              onChangeText={(val) => updatePlayerStat(stat.key, 'wickets', Number(val.replace(/[^0-9]/g, '')))}
                            />
                          </View>
                        </View>

                        <View style={[styles.formRow, { marginTop: 12 }]}>
                          <View style={styles.inputWrap}>
                            <Text style={styles.fieldLabel}>Wides</Text>
                            <TextInput
                              style={[styles.statInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                              keyboardType="numeric"
                              value={String(stat.wides)}
                              onChangeText={(val) => updatePlayerStat(stat.key, 'wides', Number(val.replace(/[^0-9]/g, '')))}
                            />
                          </View>
                          <View style={styles.inputWrap}>
                            <Text style={styles.fieldLabel}>No Balls</Text>
                            <TextInput
                              style={[styles.statInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                              keyboardType="numeric"
                              value={String(stat.no_balls)}
                              onChangeText={(val) => updatePlayerStat(stat.key, 'no_balls', Number(val.replace(/[^0-9]/g, '')))}
                            />
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Team B Stats Accordion */}
            <Text style={[styles.teamAccordionHeader, { color: theme.colors.primary, marginTop: 24 }]}>{match?.team_b.name}</Text>
            <View style={[styles.statsBlock, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
              {teamBStats.map((stat, idx) => {
                const isExpanded = expandedPlayerKey === stat.key;
                
                // Construct a small preview string
                const batPreview = stat.runs > 0 || stat.balls_faced > 0
                  ? `${stat.runs} runs (${stat.balls_faced}b)${stat.is_not_out ? ' no' : ''}`
                  : '';
                const bowlPreview = stat.overs_bowled > 0
                  ? `${stat.wickets} wkts (${stat.overs_bowled} ov)`
                  : '';
                const preview = [batPreview, bowlPreview].filter(Boolean).join(', ') || 'No stats recorded';

                return (
                  <View
                    key={stat.key}
                    style={[styles.playerAccordionRow, { borderBottomWidth: idx === teamBStats.length - 1 ? 0 : 0.5, borderBottomColor: theme.colors.border }]}
                  >
                    {/* Collapsed Header Touch */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.playerHeaderTouch}
                      onPress={() => setExpandedPlayerKey(isExpanded ? null : stat.key)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.playerName, { color: theme.colors.textPrimary }]}>{stat.name}</Text>
                        <Text style={{ fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 }}>{preview}</Text>
                      </View>
                      {isExpanded ? (
                        <ChevronUp color={theme.colors.textSecondary} size={18} />
                      ) : (
                        <ChevronRight color={theme.colors.textSecondary} size={18} />
                      )}
                    </TouchableOpacity>

                    {/* Expanded Inputs Block */}
                    {isExpanded && (
                      <View style={styles.inputsBlock}>
                        {/* Batting Header */}
                        <Text style={[styles.subBlockHeader, { color: theme.colors.textSecondary }]}>Batting</Text>
                        <View style={styles.formRow}>
                          <View style={styles.inputWrap}>
                            <Text style={styles.fieldLabel}>Runs</Text>
                            <TextInput
                              style={[styles.statInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                              keyboardType="numeric"
                              value={String(stat.runs)}
                              onChangeText={(val) => updatePlayerStat(stat.key, 'runs', Number(val.replace(/[^0-9]/g, '')))}
                            />
                          </View>
                          <View style={styles.inputWrap}>
                            <Text style={styles.fieldLabel}>Balls</Text>
                            <TextInput
                              style={[styles.statInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                              keyboardType="numeric"
                              value={String(stat.balls_faced)}
                              onChangeText={(val) => updatePlayerStat(stat.key, 'balls_faced', Number(val.replace(/[^0-9]/g, '')))}
                            />
                          </View>
                          <View style={styles.inputWrap}>
                            <Text style={styles.fieldLabel}>4s</Text>
                            <TextInput
                              style={[styles.statInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                              keyboardType="numeric"
                              value={String(stat.fours)}
                              onChangeText={(val) => updatePlayerStat(stat.key, 'fours', Number(val.replace(/[^0-9]/g, '')))}
                            />
                          </View>
                          <View style={styles.inputWrap}>
                            <Text style={styles.fieldLabel}>6s</Text>
                            <TextInput
                              style={[styles.statInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                              keyboardType="numeric"
                              value={String(stat.sixes)}
                              onChangeText={(val) => updatePlayerStat(stat.key, 'sixes', Number(val.replace(/[^0-9]/g, '')))}
                            />
                          </View>
                        </View>

                        <View style={[styles.formRow, { marginTop: 12, alignItems: 'center' }]}>
                          <View style={{ flex: 1.5 }}>
                            <Text style={styles.fieldLabel}>Dismissal Mode</Text>
                            <TouchableOpacity
                              style={[styles.dismissalBtn, { borderColor: theme.colors.border }]}
                              onPress={() => setActiveDismissalSelectKey(stat.key)}
                            >
                              <Text style={{ fontSize: 13, color: theme.colors.textPrimary, textTransform: 'capitalize' }}>
                                {stat.how_out ? stat.how_out.replace(/_/g, ' ') : stat.is_not_out ? 'Not Out' : 'Did Not Bat / NA'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={styles.fieldLabel}>Not Out?</Text>
                            <Switch
                              value={stat.is_not_out}
                              onValueChange={(val) => {
                                updatePlayerStat(stat.key, 'is_not_out', val);
                                if (val) {
                                  updatePlayerStat(stat.key, 'how_out', null);
                                }
                              }}
                              trackColor={{ false: '#E2E5E2', true: theme.colors.primary }}
                              thumbColor="#FFFFFF"
                            />
                          </View>
                        </View>

                        {/* Bowling Header */}
                        <Text style={[styles.subBlockHeader, { color: theme.colors.textSecondary, marginTop: 16 }]}>Bowling</Text>
                        <View style={styles.formRow}>
                          <View style={styles.inputWrap}>
                            <Text style={styles.fieldLabel}>Overs</Text>
                            <TextInput
                              style={[styles.statInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                              keyboardType="numeric"
                              value={String(stat.overs_bowled)}
                              onChangeText={(val) => {
                                // Allow decimals
                                if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                                  updatePlayerStat(stat.key, 'overs_bowled', val === '' ? 0 : Number(val));
                                }
                              }}
                            />
                          </View>
                          <View style={styles.inputWrap}>
                            <Text style={styles.fieldLabel}>Runs Conceded</Text>
                            <TextInput
                              style={[styles.statInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                              keyboardType="numeric"
                              value={String(stat.runs_given)}
                              onChangeText={(val) => updatePlayerStat(stat.key, 'runs_given', Number(val.replace(/[^0-9]/g, '')))}
                            />
                          </View>
                          <View style={styles.inputWrap}>
                            <Text style={styles.fieldLabel}>Wkts</Text>
                            <TextInput
                              style={[styles.statInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                              keyboardType="numeric"
                              value={String(stat.wickets)}
                              onChangeText={(val) => updatePlayerStat(stat.key, 'wickets', Number(val.replace(/[^0-9]/g, '')))}
                            />
                          </View>
                        </View>

                        <View style={[styles.formRow, { marginTop: 12 }]}>
                          <View style={styles.inputWrap}>
                            <Text style={styles.fieldLabel}>Wides</Text>
                            <TextInput
                              style={[styles.statInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                              keyboardType="numeric"
                              value={String(stat.wides)}
                              onChangeText={(val) => updatePlayerStat(stat.key, 'wides', Number(val.replace(/[^0-9]/g, '')))}
                            />
                          </View>
                          <View style={styles.inputWrap}>
                            <Text style={styles.fieldLabel}>No Balls</Text>
                            <TextInput
                              style={[styles.statInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                              keyboardType="numeric"
                              value={String(stat.no_balls)}
                              onChangeText={(val) => updatePlayerStat(stat.key, 'no_balls', Number(val.replace(/[^0-9]/g, '')))}
                            />
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Footer Save Button */}
        <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: isPending ? theme.colors.border : theme.colors.primary,
                borderRadius: theme.radius.sm,
              },
            ]}
            onPress={handleSubmit}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator size="small" color={theme.colors.onPrimary} />
            ) : (
              <Text style={[styles.submitButtonText, { color: theme.colors.onPrimary }]}>
                {isEditMode ? 'Save Changes' : 'Submit Result'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Modal: Man of the Match Picker */}
        <Modal
          visible={momModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setMomModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Choose Man of the Match</Text>
              
              <FlatList
                data={[
                  { key: 'none-clear', name: 'None / Clear', player_id: undefined, guest_name: undefined } as any,
                  ...playerStats
                ]}
                keyExtractor={(item) => item.key}
                renderItem={({ item }) => {
                  const isNoneOption = item.key === 'none-clear';
                  const isSelected = isNoneOption
                    ? !manOfMatchId && !manOfMatchGuestName
                    : item.player_id
                    ? manOfMatchId === item.player_id
                    : manOfMatchGuestName === item.guest_name;
                  const displayName = isNoneOption
                    ? item.name
                    : item.player_id
                    ? item.name
                    : `${item.name} (Guest)`;

                  return (
                    <TouchableOpacity
                      style={[styles.modalItem, { borderBottomColor: theme.colors.border }]}
                      onPress={() => {
                        if (isNoneOption) {
                          setManOfMatchId(null);
                          setManOfMatchGuestName(null);
                        } else if (item.player_id) {
                          setManOfMatchId(item.player_id);
                          setManOfMatchGuestName(null);
                        } else {
                          setManOfMatchId(null);
                          setManOfMatchGuestName(item.guest_name || null);
                        }
                        setMomModalVisible(false);
                      }}
                    >
                      <Text style={[styles.modalItemText, { color: isNoneOption ? theme.colors.textSecondary : theme.colors.textPrimary, fontStyle: isNoneOption ? 'italic' : 'normal' }]}>{displayName}</Text>
                      {isSelected && <Check size={18} color={theme.colors.primary} />}
                    </TouchableOpacity>
                  );
                }}
              />

              <TouchableOpacity
                style={[styles.modalCloseButton, { backgroundColor: theme.colors.border }]}
                onPress={() => setMomModalVisible(false)}
              >
                <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal: Dismissal Type Picker */}
        <Modal
          visible={!!activeDismissalSelectKey}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setActiveDismissalSelectKey(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Select Dismissal</Text>
              
              <FlatList
                data={DISMISSAL_OPTIONS}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => {
                  const stat = playerStats.find((s) => s.key === activeDismissalSelectKey);
                  const isSelected = item.value === 'na'
                    ? !stat?.how_out && !stat?.is_not_out
                    : item.value === 'not_out'
                    ? stat?.is_not_out
                    : stat?.how_out === item.value;

                  return (
                    <TouchableOpacity
                      style={[styles.modalItem, { borderBottomColor: theme.colors.border }]}
                      onPress={() => {
                        if (item.value === 'na') {
                          updatePlayerStat(activeDismissalSelectKey!, 'how_out', null);
                          updatePlayerStat(activeDismissalSelectKey!, 'is_not_out', false);
                        } else if (item.value === 'not_out') {
                          updatePlayerStat(activeDismissalSelectKey!, 'how_out', null);
                          updatePlayerStat(activeDismissalSelectKey!, 'is_not_out', true);
                        } else {
                          updatePlayerStat(activeDismissalSelectKey!, 'how_out', item.value);
                          updatePlayerStat(activeDismissalSelectKey!, 'is_not_out', false);
                        }
                        setActiveDismissalSelectKey(null);
                      }}
                    >
                      <Text style={[styles.modalItemText, { color: theme.colors.textPrimary }]}>{item.label}</Text>
                      {isSelected && <Check size={18} color={theme.colors.primary} />}
                    </TouchableOpacity>
                  );
                }}
              />

              <TouchableOpacity
                style={[styles.modalCloseButton, { backgroundColor: theme.colors.border }]}
                onPress={() => setActiveDismissalSelectKey(null)}
              >
                <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  section: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  winnerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  winnerCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderWidth: 1,
    gap: 8,
  },
  winnerName: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  scoreInputRow: {
    flexDirection: 'row',
    gap: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerButtonText: {
    fontSize: 15,
  },
  teamAccordionHeader: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  statsBlock: {
    borderWidth: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  playerAccordionRow: {
    width: '100%',
  },
  playerHeaderTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    justifyContent: 'space-between',
  },
  playerName: {
    fontSize: 14,
    fontWeight: '700',
  },
  inputsBlock: {
    padding: 14,
    paddingTop: 0,
    borderTopWidth: 0.5,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#FAFBFB',
  },
  subBlockHeader: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 8,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputWrap: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
  },
  statInput: {
    borderWidth: 1,
    borderRadius: 4,
    height: 36,
    paddingHorizontal: 8,
    fontSize: 13,
    backgroundColor: '#FFFFFF',
  },
  dismissalBtn: {
    borderWidth: 1,
    borderRadius: 4,
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
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
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '60%',
    padding: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalItemText: {
    fontSize: 15,
  },
  modalCloseButton: {
    marginTop: 16,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
});

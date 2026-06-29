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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, RotateCcw, ShieldAlert, Award } from 'lucide-react-native';
import { useTheme } from '../../../../../src/context/ThemeContext';
import { useSportsStore } from '../../../../../src/store/sports/sportsStore';
import {
  useMatchDetail,
  useLineup,
  useLiveMatch,
  useRecordBall,
  useChangeBowler,
  useStartSecondInnings,
  useUndoLastBall,
} from '../../../../../src/hooks/useMatches';
import { useAuth } from '../../../../../src/hooks/useAuth';
import { LoginRequiredGate } from '../../../../../src/components/ui/LoginRequiredGate';

interface LineupPlayer {
  id: number;
  player_id: number | null;
  guest_name: string | null;
  name: string;
}

export default function ScorerScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = Number(id);
  const { isGuest } = useAuth();
  const insets = useSafeAreaInsets();

  // Zustand Store Profile
  const myProfile = useSportsStore((state) => state.registrations['cricket']?.profile);

  // TanStack Query & Mutations
  const { data: match, isLoading: isLoadingMatch } = useMatchDetail(matchId);
  const { data: lineups, isLoading: isLoadingLineup } = useLineup(matchId);
  const { data: liveData, isLoading: isLoadingLive, refetch: refetchLive } = useLiveMatch(matchId);

  const recordBallMutation = useRecordBall();
  const changeBowlerMutation = useChangeBowler();
  const startSecondInningsMutation = useStartSecondInnings();
  const undoLastBallMutation = useUndoLastBall();

  // Local state for recording a ball
  const [selectedRuns, setSelectedRuns] = useState<number>(0);
  const [selectedExtra, setSelectedExtra] = useState<'none' | 'wide' | 'no_ball' | 'bye' | 'leg_bye'>('none');

  // Wicket flow modal states
  const [wicketModalVisible, setWicketModalVisible] = useState(false);
  const [wicketType, setWicketType] = useState<'bowled' | 'caught' | 'run_out' | 'lbw' | 'stumped' | 'hit_wicket' | 'retired'>('bowled');
  const [nextBatsmanKey, setNextBatsmanKey] = useState<string | null>(null);
  const [batsmanPickerVisible, setBatsmanPickerVisible] = useState(false);

  // Bowler change modal states
  const [bowlerModalVisible, setBowlerModalVisible] = useState(false);
  const [isSelectingBowler, setIsSelectingBowler] = useState(false);

  // Innings 2 openers modal states
  const [innings2ModalVisible, setInnings2ModalVisible] = useState(false);
  const [inn2StrikerKey, setInn2StrikerKey] = useState<string | null>(null);
  const [inn2NonStrikerKey, setInn2NonStrikerKey] = useState<string | null>(null);
  const [inn2BowlerKey, setInn2BowlerKey] = useState<string | null>(null);
  const [inn2StrikerPicker, setInn2StrikerPicker] = useState(false);
  const [inn2NonStrikerPicker, setInn2NonStrikerPicker] = useState(false);
  const [inn2BowlerPicker, setInn2BowlerPicker] = useState(false);

  // Other runs selection modal
  const [otherRunsModalVisible, setOtherRunsModalVisible] = useState(false);
  const [partnershipModalVisible, setPartnershipModalVisible] = useState(false);

  // Scorer Auth Check & Redirect
  useEffect(() => {
    if (isGuest) return;
    if (match && !isLoadingMatch) {
      const isScorer = myProfile && match.scorer_id === myProfile.id;
      if (!isScorer) {
        Alert.alert(
          'Access Restricted',
          'Only the designated scorer is allowed to score this match. Redirecting to Live Viewer.'
        );
        router.replace(`/sports/cricket/matches/${matchId}/live`);
      }
    }
  }, [match, isLoadingMatch, myProfile, isGuest]);

  // Innings transition & Bowler change triggers
  useEffect(() => {
    if (match?.status === 'completed') {
      setBowlerModalVisible(false);
      setInnings2ModalVisible(false);
      setWicketModalVisible(false);
      return;
    }

    if (liveData && match?.status === 'live') {
      // Parse current score and overs
      let currentRuns = 0;
      let currentWickets = 0;
      if (liveData.score && typeof liveData.score === 'string') {
        const parts = liveData.score.split('/');
        currentRuns = parseInt(parts[0], 10) || 0;
        currentWickets = parseInt(parts[1], 10) || 0;
      }

      let currentOversCompleted = 0;
      if (liveData.overs && typeof liveData.overs === 'string') {
        currentOversCompleted = parseInt(liveData.overs.split('.')[0], 10) || 0;
      }

      const maxWickets = liveData.current_innings === 1
        ? (match.innings_1_batting_team_id === match.team_a_id ? (match.team_a_max_wickets ?? 10) : (match.team_b_max_wickets ?? 10))
        : (match.innings_1_batting_team_id === match.team_a_id ? (match.team_b_max_wickets ?? 10) : (match.team_a_max_wickets ?? 10));

      const isFirstInningsEnd = liveData.current_innings === 1 && (currentWickets >= maxWickets || currentOversCompleted >= match.overs);
      const isSecondInningsEnd = liveData.current_innings === 2 && (
        currentWickets >= maxWickets ||
        currentOversCompleted >= match.overs ||
        (liveData.target && currentRuns >= liveData.target)
      );

      const isMatchEnding = isFirstInningsEnd || isSecondInningsEnd;

      // 1. Force Bowler Selection if current bowler is null / cleared (end of over or match start)
      if (!liveData.bowler && liveData.status === 'live' && !isMatchEnding) {
        // Only if striker/non-striker are set (so we aren't in innings transition)
        if (liveData.striker && liveData.non_striker) {
          setBowlerModalVisible(true);
        }
      }

      // 2. Force Bowler Selection if the current over is completed (6 legal deliveries)
      if (liveData.this_over && liveData.status === 'live' && !isMatchEnding) {
        const legalBallsCount = liveData.this_over.filter(
          (ball: any) => ball.extra_type !== 'wide' && ball.extra_type !== 'no_ball'
        ).length;

        if (legalBallsCount >= 6) {
          setBowlerModalVisible(true);
        }
      }

      // 3. Force Innings 2 openers selection if current_innings is 2 and striker/non-striker are null
      if (liveData.current_innings === 2) {
        if (!liveData.striker && !liveData.non_striker) {
          setInnings2ModalVisible(true);
        } else if (liveData.striker && liveData.non_striker) {
          setInnings2ModalVisible(false);
        }
      }
    }
  }, [liveData, match]);

  const isLoading = !isGuest && (isLoadingMatch || isLoadingLineup || isLoadingLive);

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
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        {/* Header Bar */}
        <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color={theme.colors.textPrimary} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Scorer Console</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.centerContainer}>
          <LoginRequiredGate fullscreen={false} />
        </View>
      </SafeAreaView>
    );
  }

  if (!match || !lineups || !liveData) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContainer}>
          <Text style={{ color: theme.colors.textSecondary }}>Failed to load match scoring data.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Handle completed matches
  if (match.status === 'completed') {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.completedContainer}>
          <Award size={64} color="#D4A700" />
          <Text style={[styles.completedTitle, { color: theme.colors.textPrimary }]}>Match Completed!</Text>
          <Text style={[styles.completedSub, { color: theme.colors.textSecondary }]}>
            This match is finished and results have been locked.
          </Text>

          <View style={[styles.completedStatsCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.completedScore, { color: theme.colors.textPrimary }]}>
              {match.team_a.name}: {match.team_a_score || 'DNB'}
            </Text>
            <Text style={[styles.completedScore, { color: theme.colors.textPrimary }]}>
              {match.team_b.name}: {match.team_b_score || 'DNB'}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.primaryBtn, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm }]}
            onPress={() => router.replace(`/sports/cricket/matches/${matchId}`)}
          >
            <Text style={{ color: theme.colors.onPrimary, fontWeight: '700' }}>View Match Scorecard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Helper to extract player key
  const getPlayerKey = (player: LineupPlayer) => {
    return player.player_id ? `p-${player.player_id}` : `g-${player.guest_name}`;
  };

  // Determine current squads
  const battingTeamId = liveData.current_innings === 1
    ? match.innings_1_batting_team_id
    : (match.innings_1_batting_team_id === match.team_a_id ? match.team_b_id : match.team_a_id);

  const bowlingTeamId = battingTeamId === match.team_a_id ? match.team_b_id : match.team_a_id;

  const battingPlayers: LineupPlayer[] = battingTeamId === match.team_a_id
    ? lineups.team_a.players
    : lineups.team_b.players;

  const bowlingPlayers: LineupPlayer[] = bowlingTeamId === match.team_a_id
    ? lineups.team_a.players
    : lineups.team_b.players;

  // Active batsman keys
  const strikerKey = liveData.striker ? (liveData.striker.id ? `p-${liveData.striker.id}` : null) : null;
  const nonStrikerKey = liveData.non_striker ? (liveData.non_striker.id ? `p-${liveData.non_striker.id}` : null) : null;

  // Remaining batsmen list (exclude striker, non-striker, and dismissed players)
  const dismissedKeys = new Set([
    ...(liveData.dismissed_players || []),
    ...(match.player_stats || [])
      .filter((s) => s.team_id === battingTeamId && s.how_out && s.how_out !== 'not_out')
      .map((s) => s.player_id ? `p-${s.player_id}` : `g-${s.guest_name}`)
  ]);

  const remainingBatsmen = battingPlayers.filter((p) => {
    const key = getPlayerKey(p);
    // Don't show currently batting players or dismissed players
    if (liveData.striker) {
      if (p.player_id && liveData.striker.id === p.player_id) return false;
      if (p.guest_name && liveData.striker.name === p.guest_name) return false;
    }
    if (liveData.non_striker) {
      if (p.player_id && liveData.non_striker.id === p.player_id) return false;
      if (p.guest_name && liveData.non_striker.name === p.guest_name) return false;
    }
    return !dismissedKeys.has(key);
  });

  // Bowler change submission
  const handleSelectBowler = async (player: LineupPlayer, bypassCheck = false) => {
    if (isSelectingBowler || recordBallMutation.isPending || changeBowlerMutation.isPending) {
      return;
    }

    const lastBowler = (liveData as any).last_bowler;
    const isConsecutive = lastBowler && (
      (lastBowler.id && player.player_id === lastBowler.id) ||
      (lastBowler.name && player.guest_name === lastBowler.name)
    );

    if (isConsecutive && !bypassCheck) {
      Alert.alert(
        'Consecutive Over',
        `${player.name} bowled the previous over. Allow them to bowl consecutively?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Allow', onPress: () => handleSelectBowler(player, true) }
        ]
      );
      return;
    }

    const payload = player.player_id
      ? { bowler_id: player.player_id, bypass_consecutive_check: bypassCheck }
      : { bowler_guest_name: player.guest_name || undefined, bypass_consecutive_check: bypassCheck };

    setIsSelectingBowler(true);
    setBowlerModalVisible(false);

    try {
      await changeBowlerMutation.mutateAsync({ id: matchId, payload });
    } catch (err: any) {
      // Re-open modal on API failure so scorer can retry or select another player
      setBowlerModalVisible(true);
      Alert.alert('Bowler Change Error', err.response?.data?.message || err.message);
    } finally {
      setIsSelectingBowler(false);
    }
  };

  // Ball Recording Submission
  const handleRecordBall = async () => {
    // Basic validations
    if (!liveData.bowler) {
      setBowlerModalVisible(true);
      return;
    }

    const isWicket = false; // separate flow for wickets

    const payload = {
      runs: selectedExtra === 'wide' || selectedExtra === 'bye' || selectedExtra === 'leg_bye' ? 0 : selectedRuns,
      extra_type: selectedExtra === 'none' ? undefined : selectedExtra,
      extra_runs: selectedExtra !== 'none' ? selectedRuns : 0,
      is_wicket: isWicket,
    };

    // Reset selection state optimistically
    const prevRuns = selectedRuns;
    const prevExtra = selectedExtra;
    setSelectedRuns(0);
    setSelectedExtra('none');

    try {
      await recordBallMutation.mutateAsync({ id: matchId, payload });
    } catch (err: any) {
      // Revert selection on API failure
      setSelectedRuns(prevRuns);
      setSelectedExtra(prevExtra);
      Alert.alert('Scoring Error', err.response?.data?.message || err.message);
    }
  };

  // Wicket Recording Submission
  const handleRecordWicket = async () => {
    if (!nextBatsmanKey && remainingBatsmen.length > 0 && wicketType !== 'retired') {
      Alert.alert('Next Batsman Required', 'Please select the next batsman from the remaining squad roster.');
      return;
    }

    // Find details of the selected next batsman
    let next_batsman_id: number | undefined;
    let next_batsman_guest_name: string | undefined;

    if (nextBatsmanKey) {
      const nextPlayer = remainingBatsmen.find((p) => getPlayerKey(p) === nextBatsmanKey);
      if (nextPlayer) {
        if (nextPlayer.player_id) {
          next_batsman_id = nextPlayer.player_id;
        } else {
          next_batsman_guest_name = nextPlayer.guest_name || undefined;
        }
      }
    }

    const payload = {
      runs: 0,
      is_wicket: true,
      wicket_type: wicketType,
      next_batsman_id,
      next_batsman_guest_name,
    };

    // Close modal and reset states optimistically
    const prevWicketType = wicketType;
    const prevNextBatsmanKey = nextBatsmanKey;
    setWicketModalVisible(false);
    setNextBatsmanKey(null);

    try {
      await recordBallMutation.mutateAsync({ id: matchId, payload });
    } catch (err: any) {
      // Revert modal state on API failure
      setWicketModalVisible(true);
      setWicketType(prevWicketType);
      setNextBatsmanKey(prevNextBatsmanKey);
      Alert.alert('Wicket Recording Error', err.response?.data?.message || err.message);
    }
  };

  // Innings 2 start submission
  const handleStartSecondInnings = async () => {
    if (!inn2StrikerKey || !inn2NonStrikerKey || !inn2BowlerKey) {
      Alert.alert('Required Fields', 'Please select both opening batsmen and the bowler for Innings 2.');
      return;
    }

    if (inn2StrikerKey === inn2NonStrikerKey) {
      Alert.alert('Invalid Selection', 'Striker and Non-Striker cannot be the same batsman.');
      return;
    }

    // Retriving striker, non-striker, and bowler payloads
    // For innings 2, batting team is the opposite of batting first team
    const inn2Batters = match.innings_1_batting_team_id === match.team_a_id ? lineups.team_b.players : lineups.team_a.players;
    const inn2Bowlers = match.innings_1_batting_team_id === match.team_a_id ? lineups.team_a.players : lineups.team_b.players;

    const striker = inn2Batters.find((p) => getPlayerKey(p) === inn2StrikerKey);
    const nonStriker = inn2Batters.find((p) => getPlayerKey(p) === inn2NonStrikerKey);
    const bowler = inn2Bowlers.find((p) => getPlayerKey(p) === inn2BowlerKey);

    const payload = {
      opening_striker_id: striker?.player_id || undefined,
      opening_striker_guest_name: striker?.guest_name || undefined,
      opening_non_striker_id: nonStriker?.player_id || undefined,
      opening_non_striker_guest_name: nonStriker?.guest_name || undefined,
      opening_bowler_id: bowler?.player_id || undefined,
      opening_bowler_guest_name: bowler?.guest_name || undefined,
    };

    setInnings2ModalVisible(false);

    try {
      await startSecondInningsMutation.mutateAsync({ id: matchId, payload });
    } catch (err: any) {
      Alert.alert('Innings Transition Error', err.response?.data?.message || err.message);
    }
  };

  // Undo delivery
  const handleUndo = async () => {
    Alert.alert('Undo Last Ball', 'Are you sure you want to delete the most recently recorded delivery?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Undo',
        onPress: async () => {
          try {
            await undoLastBallMutation.mutateAsync(matchId);
          } catch (err: any) {
            Alert.alert('Undo Error', err.response?.data?.message || err.message);
          }
        },
      },
    ]);
  };

  // Formatting this over symbols
  const formatOverBallSymbol = (ball: any) => {
    if (ball.is_wicket) return 'W';
    if (ball.extra_type === 'wide') return `${ball.runs || ''}wd`;
    if (ball.extra_type === 'no_ball') return `${ball.runs || ''}nb`;
    if (ball.extra_type === 'bye') return `${ball.runs || ''}B`;
    if (ball.extra_type === 'leg_bye') return `${ball.runs || ''}LB`;
    if (ball.runs === 0) return '•';
    return String(ball.runs);
  };

  const getBallBadgeColor = (ball: any) => {
    if (ball.is_wicket) return '#FFEBEB'; // Wicket red bg
    if (ball.extra_type) return '#FFF9E6'; // Extra light amber bg
    if (ball.runs === 4 || ball.runs === 6) return '#EBFBEF'; // Boundary green bg
    return theme.colors.surface; // Normal ball uses theme surface
  };

  const getBallTextColor = (ball: any) => {
    if (ball.is_wicket) return '#D32F2F';
    if (ball.extra_type) return '#B78103';
    if (ball.runs === 4 || ball.runs === 6) return '#1B5E20';
    return theme.colors.textPrimary; // Normal text color
  };

  const getBallBorderColor = (ball: any) => {
    if (ball.is_wicket) return '#FFCDD2'; // Red border
    if (ball.extra_type) return '#FFE082'; // Amber border
    if (ball.runs === 4 || ball.runs === 6) return '#C8E6C9'; // Green border
    return theme.colors.border; // Theme border color
  };

  // Calculate current partnership
  const getPartnershipRuns = () => {
    if (!liveData || !liveData.score) return 0;
    
    let currentRuns = 0;
    if (typeof liveData.score === 'string') {
      const parts = liveData.score.split('/');
      currentRuns = parseInt(parts[0], 10) || 0;
    }
    
    const currentInnings = liveData.current_innings || 1;
    const currentInningsFow = match.fall_of_wickets?.filter((f) => f.innings === currentInnings) || [];
    
    if (currentInningsFow.length > 0) {
      // Sort to get the last wicket fall
      const sortedFow = [...currentInningsFow].sort((a, b) => b.score_at_wicket - a.score_at_wicket);
      const lastWicket = sortedFow[0];
      return Math.max(0, currentRuns - lastWicket.score_at_wicket);
    }
    
    return currentRuns;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace(`/sports/cricket/matches/${matchId}`)}>
          <ArrowLeft color={theme.colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Scoring Console</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleUndo} disabled={undoLastBallMutation.isPending}>
          <RotateCcw color={theme.colors.primary} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Score Panel */}
        <View style={[styles.scoreCard, { backgroundColor: '#1A2E1A', borderColor: theme.colors.border }]}>
          <View style={styles.scoreHeader}>
            <Text style={styles.inningsLabel}>INNINGS {liveData.current_innings}</Text>
            {liveData.target && <Text style={styles.targetLabel}>TARGET: {liveData.target}</Text>}
          </View>
          <Text style={styles.scoreText}>
            {liveData.score}
            <Text style={styles.oversText}> ({liveData.overs} ov)</Text>
          </Text>
          <View style={styles.runRateRow}>
            <Text style={styles.rrText}>CRR: {liveData.current_run_rate?.toFixed(2) || '0.00'}</Text>
            {liveData.required_run_rate && (
              <Text style={styles.rrText}>RRR: {liveData.required_run_rate?.toFixed(2)}</Text>
            )}
          </View>
        </View>

        {/* Batsmen & Bowler Cards */}
        <View style={styles.rosterSection}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.playerTile, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => setPartnershipModalVisible(true)}
          >
            <View style={styles.batsmanRow}>
              <Text style={[styles.playerLabel, { color: theme.colors.textPrimary, fontWeight: '700' }]}>
                🏏 {liveData.striker?.name || 'No Striker'} *
              </Text>
              <Text style={[styles.playerStatText, { color: theme.colors.textSecondary }]}>
                {liveData.striker?.runs || 0} ({liveData.striker?.balls || 0}b)
              </Text>
            </View>
            <View style={styles.batsmanRow}>
              <Text style={[styles.playerLabel, { color: theme.colors.textSecondary }]}>
                {liveData.non_striker?.name || 'No Non-Striker'}
              </Text>
              <Text style={[styles.playerStatText, { color: theme.colors.textSecondary }]}>
                {liveData.non_striker?.runs || 0} ({liveData.non_striker?.balls || 0}b)
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.playerTile, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
            onPress={() => setBowlerModalVisible(true)}
          >
            <Text style={[styles.playerLabel, { color: theme.colors.textPrimary }]}>
              🔴 Bowler: <Text style={{ fontWeight: '700' }}>{liveData.bowler?.name || 'Select Bowler'}</Text>
            </Text>
            <Text style={[styles.playerStatText, { color: theme.colors.textSecondary }]}>
              {liveData.bowler?.wickets || 0} - {liveData.bowler?.runs_given || 0} ({liveData.bowler?.overs || '0'} ov)
            </Text>
          </TouchableOpacity>
        </View>

        {/* This Over Tracker */}
        <View style={styles.trackerSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>This Over</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ballsRow}>
            {liveData.this_over && liveData.this_over.length > 0 ? (
              liveData.this_over.map((ball: any, idx: number) => (
                <View
                  key={idx}
                  style={[styles.ballBadge, { backgroundColor: getBallBadgeColor(ball), borderColor: getBallBorderColor(ball) }]}
                >
                  <Text style={[styles.ballText, { color: getBallTextColor(ball) }]}>
                    {formatOverBallSymbol(ball)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{ color: theme.colors.textSecondary, fontStyle: 'italic', fontSize: 13 }}>
                Starting new over...
              </Text>
            )}
          </ScrollView>
        </View>

        {/* Scoring Action Buttons */}
        <View style={[styles.scoringPanel, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.panelHeader, { color: theme.colors.textSecondary }]}>RECORD EVENT</Text>

          {/* Extras Toggle Selection */}
          <View style={styles.extraSelectorRow}>
            {(['none', 'wide', 'no_ball', 'bye', 'leg_bye'] as const).map((ext) => (
              <TouchableOpacity
                key={ext}
                activeOpacity={0.7}
                style={[
                  styles.extraBtn,
                  {
                    backgroundColor: selectedExtra === ext ? theme.colors.primary + '15' : 'transparent',
                    borderColor: selectedExtra === ext ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => setSelectedExtra(ext)}
              >
                <Text
                  style={[
                    styles.extraBtnText,
                    {
                      color: selectedExtra === ext ? theme.colors.primary : theme.colors.textSecondary,
                      fontWeight: selectedExtra === ext ? '700' : '500',
                    },
                  ]}
                >
                  {ext === 'none' ? 'Normal' : ext.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Runs Rows */}
          <View style={styles.runsGrid}>
            {[0, 1, 2, 3, 4, 6].map((run) => (
              <TouchableOpacity
                key={run}
                activeOpacity={0.7}
                style={[
                  styles.runCard,
                  {
                    backgroundColor: selectedRuns === run ? theme.colors.primary : theme.colors.surface,
                    borderColor: selectedRuns === run ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => setSelectedRuns(run)}
              >
                <Text
                  style={[
                    styles.runCardText,
                    {
                      color: selectedRuns === run ? theme.colors.onPrimary : theme.colors.textPrimary,
                    },
                  ]}
                >
                  {run}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.runCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={() => setOtherRunsModalVisible(true)}
            >
              <Text style={[styles.runCardText, { color: theme.colors.textPrimary, fontSize: 13 }]}>Other</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mainActionsRow}>
            {/* Undo Last Ball Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.actionBtn,
                styles.undoBtn,
                {
                  borderRadius: theme.radius.sm,
                  opacity: (!match.last_ball_event_id || undoLastBallMutation.isPending) ? 0.4 : 1,
                  flexDirection: 'row',
                }
              ]}
              onPress={handleUndo}
              disabled={!match.last_ball_event_id || undoLastBallMutation.isPending}
            >
              <RotateCcw size={14} color={!match.last_ball_event_id ? '#999999' : '#666666'} style={{ marginRight: 4 }} />
              <Text style={[styles.undoBtnText, !match.last_ball_event_id && { color: '#999999' }]}>Undo</Text>
            </TouchableOpacity>

            {/* Record Wicket Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.actionBtn, styles.wicketBtn, { borderRadius: theme.radius.sm }]}
              onPress={() => setWicketModalVisible(true)}
            >
              <Text style={styles.actionBtnText}>Wicket</Text>
            </TouchableOpacity>

            {/* Confirm Ball Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.actionBtn, styles.confirmBtn, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm }]}
              onPress={handleRecordBall}
              disabled={recordBallMutation.isPending}
            >
              {recordBallMutation.isPending ? (
                <ActivityIndicator size="small" color={theme.colors.onPrimary} />
              ) : (
                <Text style={[styles.actionBtnText, { color: theme.colors.onPrimary }]}>Record Ball</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* MODAL: Bowler Selector */}
      <Modal visible={bowlerModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <ShieldAlert color={theme.colors.primary} size={22} />
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary, marginBottom: 0 }]}>Select Next Bowler</Text>
              {(recordBallMutation.isPending || changeBowlerMutation.isPending) && (
                <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginLeft: 6 }} />
              )}
            </View>
            <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 16 }}>
              Overs bound reached or match initialized. Choose a bowler from the roster (must not be the same bowler consecutively).
            </Text>

            <FlatList
              data={bowlingPlayers}
              keyExtractor={(item) => getPlayerKey(item)}
              renderItem={({ item }) => {
                const lastBowler = (liveData as any).last_bowler;
                const isConsecutive = lastBowler && (
                  (lastBowler.id && item.player_id === lastBowler.id) ||
                  (lastBowler.name && item.guest_name === lastBowler.name)
                );

                const stats = match?.player_stats?.find(
                  (s) =>
                    (item.player_id && s.player_id === item.player_id) ||
                    (item.guest_name && s.guest_name === item.guest_name)
                );
                const oversBowled = stats?.overs_bowled;
                const showOvers = oversBowled && Number(oversBowled) > 0;

                return (
                  <TouchableOpacity
                    style={[
                      styles.modalItem,
                      {
                        borderBottomColor: theme.colors.border,
                        opacity: (recordBallMutation.isPending || changeBowlerMutation.isPending || isSelectingBowler) ? 0.5 : 1,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }
                    ]}
                    onPress={() => handleSelectBowler(item)}
                    disabled={recordBallMutation.isPending || changeBowlerMutation.isPending || isSelectingBowler}
                  >
                    <Text style={[styles.modalItemText, { color: theme.colors.textPrimary }]}>
                      {item.name}
                      {showOvers && (
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontWeight: '500' }}>
                          {' '}
                          ({oversBowled} ov)
                        </Text>
                      )}
                    </Text>
                    {isConsecutive && (
                      <View style={{ backgroundColor: '#FFEBEB', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#FFCDD2' }}>
                        <Text style={{ color: '#D32F2F', fontSize: 11, fontWeight: '700' }}>Previous Bowler</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: theme.colors.textSecondary }}>No players available in bowling team lineup.</Text>
                </View>
              }
            />
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.modalCloseBtn, { borderColor: theme.colors.border, borderWidth: 1 }]}
              onPress={() => setBowlerModalVisible(false)}
            >
              <Text style={{ color: theme.colors.textPrimary, fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: Wicket Submission Details */}
      <Modal visible={wicketModalVisible} transparent={true} animationType="fade" onRequestClose={() => setWicketModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Record Wicket</Text>

            {/* Wicket Type Selection */}
            <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary, marginBottom: 8 }]}>How Out *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeScrollView}>
              {([
                'bowled',
                'caught',
                'run_out',
                'lbw',
                'stumped',
                'hit_wicket',
                'retired',
              ] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  activeOpacity={0.7}
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor: wicketType === type ? theme.colors.primary + '15' : 'transparent',
                      borderColor: wicketType === type ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                  onPress={() => setWicketType(type)}
                >
                  <Text style={[styles.typeBtnText, { color: wicketType === type ? theme.colors.primary : theme.colors.textSecondary, textTransform: 'capitalize' }]}>
                    {type.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Next Batsman Selector */}
            {wicketType !== 'retired' && (
              <>
                <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary, marginTop: 16, marginBottom: 8 }]}>
                  Next Batsman *
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.pickerButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.sm }]}
                  onPress={() => setBatsmanPickerVisible(true)}
                >
                  <Text style={[styles.pickerButtonText, { color: nextBatsmanKey ? theme.colors.textPrimary : theme.colors.textSecondary }]}>
                    {nextBatsmanKey
                      ? remainingBatsmen.find((p) => getPlayerKey(p) === nextBatsmanKey)?.name || 'Select player'
                      : 'Select batsman'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <View style={[styles.rowButtons, { marginTop: 24 }]}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.modalCancelBtn, { borderColor: theme.colors.border, borderWidth: 1 }]}
                onPress={() => setWicketModalVisible(false)}
              >
                <Text style={{ color: theme.colors.textPrimary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.modalConfirmBtn, { backgroundColor: '#D32F2F' }]}
                onPress={handleRecordWicket}
                disabled={recordBallMutation.isPending}
              >
                {recordBallMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={{ color: '#FFF', fontWeight: '700' }}>Confirm Wicket</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SUB-MODAL: Wicket Next Batsman Picker */}
      <Modal visible={batsmanPickerVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, maxHeight: '60%' }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Choose Next Batsman</Text>
            <FlatList
              data={remainingBatsmen}
              keyExtractor={(item) => getPlayerKey(item)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, { borderBottomColor: theme.colors.border }]}
                  onPress={() => {
                    setNextBatsmanKey(getPlayerKey(item));
                    setBatsmanPickerVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, { color: theme.colors.textPrimary }]}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.modalCloseBtn, { borderColor: theme.colors.border, borderWidth: 1 }]}
              onPress={() => setBatsmanPickerVisible(false)}
            >
              <Text style={{ color: theme.colors.textPrimary, fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: Innings 2 Initialization Wizard */}
      <Modal visible={innings2ModalVisible} transparent={false} animationType="slide">
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background, padding: 16 }]}>
          <Text style={[styles.completedTitle, { color: theme.colors.textPrimary, marginTop: 24 }]}>
            Innings 1 Finished
          </Text>
          <Text style={{ fontSize: 13, color: theme.colors.textSecondary, marginBottom: 24, textAlign: 'center' }}>
            Declare the openers for the second innings to proceed with scoring.
          </Text>

          {/* Batting team is opposite of batting first */}
          {(() => {
            const inn2Batters = match.innings_1_batting_team_id === match.team_a_id ? lineups.team_b.players : lineups.team_a.players;
            const inn2Bowlers = match.innings_1_batting_team_id === match.team_a_id ? lineups.team_a.players : lineups.team_b.players;

            return (
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 16 }}>
                {/* Striker */}
                <View style={styles.pickerSection}>
                  <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Opening Striker *</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.pickerButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                    onPress={() => setInn2StrikerPicker(true)}
                  >
                    <Text style={[styles.pickerButtonText, { color: inn2StrikerKey ? theme.colors.textPrimary : theme.colors.textSecondary }]}>
                      {inn2StrikerKey ? inn2Batters.find((p) => getPlayerKey(p) === inn2StrikerKey)?.name : 'Select batsman'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Non Striker */}
                <View style={styles.pickerSection}>
                  <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Opening Non-Striker *</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.pickerButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                    onPress={() => setInn2NonStrikerPicker(true)}
                  >
                    <Text style={[styles.pickerButtonText, { color: inn2NonStrikerKey ? theme.colors.textPrimary : theme.colors.textSecondary }]}>
                      {inn2NonStrikerKey ? inn2Batters.find((p) => getPlayerKey(p) === inn2NonStrikerKey)?.name : 'Select batsman'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Bowler */}
                <View style={styles.pickerSection}>
                  <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Opening Bowler *</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.pickerButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                    onPress={() => setInn2BowlerPicker(true)}
                  >
                    <Text style={[styles.pickerButtonText, { color: inn2BowlerKey ? theme.colors.textPrimary : theme.colors.textSecondary }]}>
                      {inn2BowlerKey ? inn2Bowlers.find((p) => getPlayerKey(p) === inn2BowlerKey)?.name : 'Select bowler'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Innings 2 pickers submodals */}
                <Modal visible={inn2StrikerPicker} transparent={true}>
                  <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md }]}>
                      <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Choose Innings 2 Striker</Text>
                      <FlatList
                        data={inn2Batters}
                        keyExtractor={(item) => getPlayerKey(item)}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={[styles.modalItem, { borderBottomColor: theme.colors.border }]}
                            onPress={() => {
                              setInn2StrikerKey(getPlayerKey(item));
                              setInn2StrikerPicker(false);
                            }}
                          >
                            <Text style={[styles.modalItemText, { color: theme.colors.textPrimary }]}>{item.name}</Text>
                          </TouchableOpacity>
                        )}
                      />
                    </View>
                  </View>
                </Modal>

                <Modal visible={inn2NonStrikerPicker} transparent={true}>
                  <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md }]}>
                      <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Choose Innings 2 Non-Striker</Text>
                      <FlatList
                        data={inn2Batters}
                        keyExtractor={(item) => getPlayerKey(item)}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={[styles.modalItem, { borderBottomColor: theme.colors.border }]}
                            onPress={() => {
                              setInn2NonStrikerKey(getPlayerKey(item));
                              setInn2NonStrikerPicker(false);
                            }}
                          >
                            <Text style={[styles.modalItemText, { color: theme.colors.textPrimary }]}>{item.name}</Text>
                          </TouchableOpacity>
                        )}
                      />
                    </View>
                  </View>
                </Modal>

                <Modal visible={inn2BowlerPicker} transparent={true}>
                  <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md }]}>
                      <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Choose Innings 2 Bowler</Text>
                      <FlatList
                        data={inn2Bowlers}
                        keyExtractor={(item) => getPlayerKey(item)}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={[styles.modalItem, { borderBottomColor: theme.colors.border }]}
                            onPress={() => {
                              setInn2BowlerKey(getPlayerKey(item));
                              setInn2BowlerPicker(false);
                            }}
                          >
                            <Text style={[styles.modalItemText, { color: theme.colors.textPrimary }]}>{item.name}</Text>
                          </TouchableOpacity>
                        )}
                      />
                    </View>
                  </View>
                </Modal>
              </ScrollView>
            );
          })()}

          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.submitButton, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm, marginTop: 16, height: 48, justifyContent: 'center', alignItems: 'center' }]}
            onPress={handleStartSecondInnings}
            disabled={startSecondInningsMutation.isPending}
          >
            {startSecondInningsMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={{ color: '#FFF', fontWeight: '700' }}>Start Second Innings</Text>
            )}
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

      {/* MODAL: Other Runs Picker */}
      <Modal visible={otherRunsModalVisible} transparent={true} animationType="fade" onRequestClose={() => setOtherRunsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Select Runs</Text>
            <FlatList
              data={[5, 7, 8, 9, 10]}
              keyExtractor={(item) => String(item)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, { borderBottomColor: theme.colors.border }]}
                  onPress={() => {
                    setSelectedRuns(item);
                    setOtherRunsModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, { color: theme.colors.textPrimary, textAlign: 'center' }]}>{item} Runs</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.modalCloseBtn, { borderColor: theme.colors.border, borderWidth: 1 }]}
              onPress={() => setOtherRunsModalVisible(false)}
            >
              <Text style={{ color: theme.colors.textPrimary, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* MODAL: Current Partnership Details (Bottom Sheet Style) */}
      <Modal
        visible={partnershipModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPartnershipModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.drawerBackdrop}
          activeOpacity={1}
          onPress={() => setPartnershipModalVisible(false)}
        >
          <View style={[styles.drawerContentContainer, { backgroundColor: theme.colors.surface, paddingBottom: Math.max(24, insets.bottom + 12) }]}>
            {/* Grab Handle */}
            <View style={styles.drawerDragHandle} />

            {/* Title */}
            <Text style={[styles.drawerTitleText, { color: theme.colors.textPrimary }]}>
              Current Partnership
            </Text>

            <View style={{ alignItems: 'center', marginVertical: 12 }}>
              <Text style={{ fontSize: 36, fontWeight: '800', color: theme.colors.primary }}>
                {getPartnershipRuns()} Runs
              </Text>
              <Text style={{ fontSize: 13, color: theme.colors.textSecondary, marginTop: 4 }}>
                Active Partnership Runs
              </Text>
            </View>

            {/* Progress Bar comparison */}
            {(() => {
              const strikerRuns = liveData?.striker?.runs || 0;
              const nonStrikerRuns = liveData?.non_striker?.runs || 0;
              const totalRuns = strikerRuns + nonStrikerRuns;
              
              const strikerPercent = totalRuns > 0 ? (strikerRuns / totalRuns) * 100 : 50;
              const nonStrikerPercent = totalRuns > 0 ? (nonStrikerRuns / totalRuns) * 100 : 50;
              
              return (
                <View style={{ marginVertical: 12, width: '100%' }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary, marginBottom: 8, textAlign: 'center' }}>
                    Innings Contribution Comparison
                  </Text>
                  
                  {/* The Progress Bar */}
                  <View style={{ height: 10, width: '100%', flexDirection: 'row', borderRadius: 5, overflow: 'hidden', backgroundColor: theme.colors.border }}>
                    <View style={{ width: `${strikerPercent}%`, backgroundColor: theme.colors.primary }} />
                    <View style={{ width: `${nonStrikerPercent}%`, backgroundColor: '#81C784' }} />
                  </View>

                  {/* Labels and contribution values */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                    <View>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.textPrimary }}>
                        {liveData?.striker?.name || 'Striker'}
                      </Text>
                      <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>
                        {strikerRuns} runs ({strikerPercent.toFixed(0)}%)
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 12, fontWeight: '500', color: theme.colors.textSecondary }}>
                        {liveData?.non_striker?.name || 'Non-Striker'}
                      </Text>
                      <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>
                        {nonStrikerRuns} runs ({nonStrikerPercent.toFixed(0)}%)
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })()}

            <View style={{ height: 0.5, backgroundColor: theme.colors.border, width: '100%', marginVertical: 12 }} />

            <View style={{ gap: 8, width: '100%' }}>
              {/* Striker detailed row */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary }}>
                  🏏 {liveData?.striker?.name || 'No Striker'} *
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary }}>
                  {liveData?.striker?.runs || 0} runs ({liveData?.striker?.balls || 0}b)
                </Text>
              </View>

              {/* Non-Striker detailed row */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
                <Text style={{ fontSize: 15, fontWeight: '500', color: theme.colors.textSecondary }}>
                  {liveData?.non_striker?.name || 'No Non-Striker'}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary }}>
                  {liveData?.non_striker?.runs || 0} runs ({liveData?.non_striker?.balls || 0}b)
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.drawerCloseBtn,
                {
                  borderColor: theme.colors.border,
                  borderWidth: 1,
                  marginTop: 20,
                  width: '100%',
                  height: 48,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: theme.radius.sm,
                },
              ]}
              onPress={() => setPartnershipModalVisible(false)}
            >
              <Text style={{ color: theme.colors.textPrimary, fontWeight: '600', fontSize: 15 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
    gap: 16,
    paddingBottom: 40,
  },
  scoreCard: {
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  inningsLabel: {
    color: '#A0DCA0',
    fontSize: 12,
    fontWeight: '800',
  },
  targetLabel: {
    color: '#FFA500',
    fontSize: 12,
    fontWeight: '800',
  },
  scoreText: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: '800',
  },
  oversText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#CCC',
  },
  runRateRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  rrText: {
    color: '#DDD',
    fontSize: 13,
    fontWeight: '600',
  },
  rosterSection: {
    gap: 10,
  },
  playerTile: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 6,
    gap: 8,
  },
  batsmanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerLabel: {
    fontSize: 14,
  },
  playerStatText: {
    fontSize: 13,
    fontWeight: '600',
  },
  trackerSection: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  ballsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  ballBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ballText: {
    fontSize: 14,
    fontWeight: '800',
  },
  scoringPanel: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    gap: 16,
  },
  panelHeader: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  extraSelectorRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  extraBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 4,
  },
  extraBtnText: {
    fontSize: 11,
  },
  runsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  runCard: {
    flex: 1,
    minWidth: '28%',
    height: 48,
    borderWidth: 1,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  runCardText: {
    fontSize: 16,
    fontWeight: '700',
  },
  mainActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wicketBtn: {
    borderColor: '#D32F2F',
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D32F2F',
  },
  undoBtn: {
    borderColor: '#666666',
    borderWidth: 1,
  },
  undoBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666666',
  },
  confirmBtn: {
    flex: 1.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
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
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  modalItemText: {
    fontSize: 14,
  },
  typeScrollView: {
    gap: 8,
    paddingVertical: 4,
  },
  typeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 4,
  },
  typeBtnText: {
    fontSize: 12,
  },
  pickerSection: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  pickerButton: {
    height: 44,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  pickerButtonText: {
    fontSize: 13,
  },
  modalCloseBtn: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    marginTop: 16,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  modalConfirmBtn: {
    flex: 1.5,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  completedTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  completedSub: {
    fontSize: 14,
    textAlign: 'center',
  },
  completedStatsCard: {
    width: '100%',
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    gap: 8,
    alignItems: 'center',
  },
  completedScore: {
    fontSize: 15,
    fontWeight: '700',
  },
  primaryBtn: {
    width: '100%',
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  rowButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  submitButton: {
    width: '100%',
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  drawerContentContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 24,
    paddingBottom: 34,
    paddingTop: 10,
    width: '100%',
  },
  drawerDragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCCCCC',
    alignSelf: 'center',
    marginBottom: 16,
  },
  drawerTitleText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  drawerCloseBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

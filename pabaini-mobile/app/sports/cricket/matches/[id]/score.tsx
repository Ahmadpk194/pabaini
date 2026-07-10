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
import { ArrowLeft, RotateCcw, ShieldAlert, Award, RefreshCw, Info, MoreVertical } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  useRotateStrike,
  useRetireBatsman,
} from '../../../../../src/hooks/useMatches';
import { useAuth } from '../../../../../src/hooks/useAuth';
import { LoginRequiredGate } from '../../../../../src/components/ui/LoginRequiredGate';
import { ScorerConsoleSkeleton } from '../../../../../src/components/skeletons';

interface LineupPlayer {
  id: number;
  player_id: number | null;
  guest_name: string | null;
  name: string;
}

export default function ScorerScreen() {
  const { theme, mode } = useTheme();
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
  const rotateStrikeMutation = useRotateStrike();
  const retireBatsmanMutation = useRetireBatsman();

  // Local state for recording a ball
  const [selectedRuns, setSelectedRuns] = useState<number>(0);
  const [selectedExtra, setSelectedExtra] = useState<'none' | 'wide' | 'no_ball' | 'bye' | 'leg_bye'>('none');

  // Wicket flow modal states
  const [wicketModalVisible, setWicketModalVisible] = useState(false);
  const [wicketType, setWicketType] = useState<'bowled' | 'caught' | 'run_out' | 'lbw' | 'stumped' | 'hit_wicket' | 'retired_hurt' | 'retired_out'>('bowled');
  const [retiringBatsmanType, setRetiringBatsmanType] = useState<'striker' | 'non_striker'>('striker');
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
  const [thisOverModalVisible, setThisOverModalVisible] = useState(false);
  const [extrasModalVisible, setExtrasModalVisible] = useState(false);
  const [expandedOvers, setExpandedOvers] = useState<Record<number, boolean>>({});

  // Helper to parse liveData.extras string
  const parseExtras = (extrasStr: string | null | undefined) => {
    if (!extrasStr) return { total: 0, wides: 0, noBalls: 0, byes: 0, legByes: 0 };
    const totalMatch = extrasStr.match(/^(\d+)/);
    const total = totalMatch ? parseInt(totalMatch[1], 10) : 0;
    
    const wMatch = extrasStr.match(/w\s+(\d+)/);
    const wides = wMatch ? parseInt(wMatch[1], 10) : 0;
    
    const nbMatch = extrasStr.match(/nb\s+(\d+)/);
    const noBalls = nbMatch ? parseInt(nbMatch[1], 10) : 0;
    
    const bMatch = extrasStr.match(/b\s+(\d+)/);
    const byes = bMatch ? parseInt(bMatch[1], 10) : 0;
    
    const lbMatch = extrasStr.match(/lb\s+(\d+)/);
    const legByes = lbMatch ? parseInt(lbMatch[1], 10) : 0;
    
    return { total, wides, noBalls, byes, legByes };
  };

  // Scorer Auth Check & Redirect
  useEffect(() => {
    if (isGuest) return;
    if (myProfile === undefined) return;
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

  const isLoading = !isGuest && (isLoadingMatch || isLoadingLineup || isLoadingLive || myProfile === undefined);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.surface }]} edges={['top', 'left', 'right']}>
        {/* Header Bar */}
        <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color={theme.colors.textPrimary} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Scoring Console</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScorerConsoleSkeleton />
      </SafeAreaView>
    );
  }

  if (isGuest) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.surface }]}>
        {/* Header Bar */}
        <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color={theme.colors.textPrimary} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Scorer Console</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
          <LoginRequiredGate fullscreen={false} />
        </View>
      </SafeAreaView>
    );
  }

  if (!match || !lineups || !liveData) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.surface }]}>
        <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
          <Text style={{ color: theme.colors.textSecondary }}>Failed to load match scoring data.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Handle completed matches
  if (match.status === 'completed') {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.surface }]}>
        <View style={[styles.completedContainer, { backgroundColor: theme.colors.background }]}>
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
      .filter((s) => s.team_id === battingTeamId && s.how_out && s.how_out !== 'not_out' && s.how_out !== 'retired_hurt')
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

  const getAvailableNextBatsmen = () => {
    const squad = battingPlayers;

    const returning = squad.filter(p => {
      // Exclude currently active striker and non-striker
      if (liveData?.striker && (p.player_id ? liveData.striker.id === p.player_id : liveData.striker.name === p.guest_name)) return false;
      if (liveData?.non_striker && (p.player_id ? liveData.non_striker.id === p.player_id : liveData.non_striker.name === p.guest_name)) return false;

      const stat = liveData?.live_player_stats?.find((s: any) =>
        p.player_id ? s.player_id === p.player_id : s.guest_name === p.guest_name
      );
      return stat && stat.status === 'retired_hurt';
    });

    const newBatsmenList = squad.filter(p => {
      // Exclude currently active striker and non-striker
      if (liveData?.striker && (p.player_id ? liveData.striker.id === p.player_id : liveData.striker.name === p.guest_name)) return false;
      if (liveData?.non_striker && (p.player_id ? liveData.non_striker.id === p.player_id : liveData.non_striker.name === p.guest_name)) return false;

      const stat = liveData?.live_player_stats?.find((s: any) =>
        p.player_id ? s.player_id === p.player_id : s.guest_name === p.guest_name
      );
      return !stat || stat.status === 'not_batted';
    });

    return { returning, newBatsmen: newBatsmenList };
  };

  const { returning: returningBatsmen, newBatsmen } = getAvailableNextBatsmen();
  const hasAvailableRemainingBatsmen = returningBatsmen.length > 0 || newBatsmen.length > 0;

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
      extra_runs: selectedExtra === 'wide'
        ? selectedRuns + 1
        : selectedExtra === 'no_ball'
          ? 1
          : selectedExtra !== 'none'
            ? selectedRuns
            : 0,
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

  // Retire Batsman Click Handler
  const handleRetireBatsmanClick = (type: 'striker' | 'non_striker') => {
    const batsman = type === 'striker' ? liveData?.striker : liveData?.non_striker;
    if (!batsman) return;

    Alert.alert(
      'Retire Batsman',
      `Choose retirement outcome for ${batsman.name}:`,
      [
        {
          text: 'Retired Hurt',
          onPress: () => {
            setRetiringBatsmanType(type);
            setWicketType('retired_hurt');
            setWicketModalVisible(true);
          },
        },
        {
          text: 'Retired Out',
          onPress: () => {
            setRetiringBatsmanType(type);
            setWicketType('retired_out');
            setWicketModalVisible(true);
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  // Wicket Recording Submission
  const handleRecordWicket = async () => {
    if (!nextBatsmanKey && hasAvailableRemainingBatsmen) {
      Alert.alert('Next Batsman Required', 'Please select the next batsman.');
      return;
    }

    // Find details of the selected next batsman
    let next_batsman_id: number | undefined;
    let next_batsman_guest_name: string | undefined;

    if (nextBatsmanKey) {
      const nextPlayer = battingPlayers.find((p) => getPlayerKey(p) === nextBatsmanKey);
      if (nextPlayer) {
        if (nextPlayer.player_id) {
          next_batsman_id = nextPlayer.player_id;
        } else {
          next_batsman_guest_name = nextPlayer.guest_name || undefined;
        }
      }
    }

    const isRetirement = wicketType === 'retired_hurt' || wicketType === 'retired_out';

    if (isRetirement) {
      const payload = {
        retirement_type: wicketType as 'retired_hurt' | 'retired_out',
        target: retiringBatsmanType,
        next_batsman_id,
        next_batsman_guest_name,
      };

      const prevWicketType = wicketType;
      const prevNextBatsmanKey = nextBatsmanKey;
      setWicketModalVisible(false);
      setNextBatsmanKey(null);

      try {
        await retireBatsmanMutation.mutateAsync({ id: matchId, payload });
      } catch (err: any) {
        setWicketModalVisible(true);
        setWicketType(prevWicketType);
        setNextBatsmanKey(prevNextBatsmanKey);
        Alert.alert('Retirement Error', err.response?.data?.message || err.message);
      }
      return;
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
      if (retiringBatsmanType === 'non_striker') {
        // Swap strike first
        await rotateStrikeMutation.mutateAsync(matchId);
      }
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

  // Rotate strike manually
  const handleRotateStrike = async () => {
    try {
      await rotateStrikeMutation.mutateAsync(matchId);
    } catch (err: any) {
      Alert.alert('Strike Rotation Error', err.response?.data?.message || err.message);
    }
  };

  // Formatting this over symbols
  const formatOverBallSymbol = (ball: any) => {
    if (ball.is_wicket) {
      if (ball.wicket_type === 'retired_hurt') return 'RH';
      if (ball.wicket_type === 'retired_out') return 'RO';
      return 'W';
    }
    if (ball.extra_type === 'wide') return `${ball.runs || ''}wd`;
    if (ball.extra_type === 'no_ball') return `${ball.runs || ''}nb`;
    if (ball.extra_type === 'bye') return `${ball.runs || ''}B`;
    if (ball.extra_type === 'leg_bye') return `${ball.runs || ''}LB`;
    if (ball.runs === 0) return '•';
    return String(ball.runs);
  };

  const getBallBadgeColor = (ball: any) => {
    if (ball.is_wicket) {
      if (ball.wicket_type === 'retired_hurt') return '#FFF9E6'; // amber bg for retired hurt
      return '#FFEBEB'; // Wicket red bg
    }
    if (ball.extra_type) return '#FFF9E6'; // Extra light amber bg
    if (ball.runs === 4 || ball.runs === 6) return '#EBFBEF'; // Boundary green bg
    return theme.colors.surface; // Normal ball uses theme surface
  };

  const getBallTextColor = (ball: any) => {
    if (ball.is_wicket) {
      if (ball.wicket_type === 'retired_hurt') return '#B78103';
      return '#D32F2F';
    }
    if (ball.extra_type) return '#B78103';
    if (ball.runs === 4 || ball.runs === 6) return '#1B5E20';
    return theme.colors.textPrimary; // Normal text color
  };

  const getBallBorderColor = (ball: any) => {
    if (ball.is_wicket) {
      if (ball.wicket_type === 'retired_hurt') return '#FFE082';
      return '#FFCDD2';
    }
    if (ball.extra_type) return '#FFE082';
    if (ball.runs === 4 || ball.runs === 6) return '#C8E6C9';
    return theme.colors.border;
  };

  const legalBallsThisOver = (liveData.this_over || []).filter(
    (ball: any) => ball.extra_type !== 'wide' && ball.extra_type !== 'no_ball'
  ).length;

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

  const isUndoDisabled =
    !match.last_ball_event_id ||
    undoLastBallMutation.isPending ||
    (liveData.overs === '0.0' && (!liveData.this_over || liveData.this_over.length === 0));

  const currentBattingTeamId = liveData?.current_innings === 1
    ? match?.innings_1_batting_team_id
    : (match?.innings_1_batting_team_id === match?.team_a_id ? match?.team_b_id : match?.team_a_id);

  const battingTeamName = currentBattingTeamId === match?.team_a_id
    ? match?.team_a?.name
    : match?.team_b?.name;

  // Chase progress calculations
  const getChaseProgress = () => {
    if (!liveData?.target) return null;
    let currentRuns = 0;
    let wickets = 0;
    if (liveData.score && typeof liveData.score === 'string') {
      const parts = liveData.score.split('/');
      currentRuns = parseInt(parts[0], 10) || 0;
      wickets = parseInt(parts[1], 10) || 0;
    }
    const runsNeeded = Math.max(0, liveData.target - currentRuns);
    
    let oversBowled = 0;
    if (typeof liveData.overs === 'number') {
      oversBowled = liveData.overs;
    } else if (typeof liveData.overs === 'string') {
      oversBowled = parseFloat(liveData.overs) || 0;
    }
    
    const completedOvers = Math.floor(oversBowled);
    const ballsInOver = Math.round((oversBowled - completedOvers) * 10);
    const totalBallsBowled = (completedOvers * 6) + ballsInOver;
    const totalMatchBalls = (match.overs || 20) * 6;
    const ballsRemaining = Math.max(0, totalMatchBalls - totalBallsBowled);

    return {
      runsNeeded,
      ballsRemaining,
      wicketsRemaining: 10 - wickets,
      target: liveData.target,
    };
  };

  const getMatchSituationMessage = () => {
    const chase = getChaseProgress();
    if (chase) {
      if (chase.runsNeeded === 0) {
        return 'Scores level!';
      }
      return `Need ${chase.runsNeeded} runs from ${chase.ballsRemaining} balls`;
    }

    if (liveData.current_innings === 1) {
      return `1st Innings in progress`;
    }

    return `${battingTeamName || 'Batting team'} leads`;
  };

  const calculateSR = (runs: number, balls: number) => {
    if (balls === 0) return '0.00';
    return ((runs / balls) * 100).toFixed(2);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.surface }]} edges={['top', 'left', 'right']}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace(`/sports/cricket/matches/${matchId}`);
            }
          }}
        >
          <ArrowLeft color={theme.colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Scoring Console</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={[styles.contentArea, { backgroundColor: theme.colors.background }]}>
        {/* Score Panel */}
        <LinearGradient
          colors={['#0E331B', '#071A0E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.scoreCard, { borderColor: theme.colors.border }]}
        >
          <View style={styles.scoreHeader}>
            <Text style={styles.inningsLabel}>
              {battingTeamName ? `${battingTeamName.toUpperCase()} · ` : ''}
              {liveData.current_innings === 1 ? '1ST INNINGS' : '2ND INNINGS'}
            </Text>
            {!!liveData.target && <Text style={styles.targetLabel}>TARGET: {liveData.target}</Text>}
          </View>
          <Text style={styles.scoreText}>
            {liveData.score}
            <Text style={styles.oversText}> ({liveData.overs} ov)</Text>
          </Text>
          <View style={styles.runRateRow}>
            <View style={[styles.rrBadge, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
              <Text style={styles.rrText}>CRR: {liveData.current_run_rate?.toFixed(2) || '0.00'}</Text>
            </View>
            {!!liveData.required_run_rate && (
              <View style={[styles.rrBadge, { backgroundColor: 'rgba(255, 165, 0, 0.15)' }]}>
                <Text style={[styles.rrText, { color: '#FFA500' }]}>RRR: {liveData.required_run_rate?.toFixed(2)}</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Match Situation Card */}
        <View style={[styles.situationCard, { backgroundColor: '#F0F9EB', borderColor: '#E1F3D8' }]}>
          <Text style={[styles.situationText, { color: '#67C23A' }]}>
            📢 {getMatchSituationMessage()}
          </Text>
        </View>

        {/* Refined Batters & Bowler Table Section */}
        <View style={styles.rosterSection}>
          {/* Batters Card - On Top, tapping opens modal */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.rosterCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => setPartnershipModalVisible(true)}
          >
            <View style={[styles.battersGridHeader, { borderBottomColor: theme.colors.border, marginTop: 2, alignItems: 'center' }]}>
              <View style={styles.colName}>
                <Text style={[styles.gridColLabel, { color: theme.colors.textSecondary }]}>Batter</Text>
              </View>
              <View style={styles.colRuns}>
                <Text style={[styles.gridColLabel, { color: theme.colors.textSecondary, textAlign: 'right' }]}>R(B)</Text>
              </View>
              <View style={styles.colBoundaries}>
                <Text style={[styles.gridColLabel, { color: theme.colors.textSecondary, textAlign: 'right' }]}>4s / 6s</Text>
              </View>
              <View style={styles.colSr}>
                <Text style={[styles.gridColLabel, { color: theme.colors.textSecondary, textAlign: 'right' }]}>SR</Text>
              </View>
            </View>

            {/* Striker */}
            <View style={styles.batterGridRow}>
              <View style={styles.colName}>
                <Text style={[styles.batterNameActive, styles.gridRowText, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                  🏏 {liveData.striker?.name || 'No Striker'} *
                </Text>
              </View>
              <View style={styles.colRuns}>
                <Text style={[styles.statValueBold, styles.gridRowText, { color: theme.colors.textPrimary, textAlign: 'right' }]}>
                  {liveData.striker?.runs || 0}({liveData.striker?.balls || 0})
                </Text>
              </View>
              <View style={styles.colBoundaries}>
                <Text style={[styles.gridRowText, { color: theme.colors.textSecondary, textAlign: 'right' }]}>
                  {liveData.striker?.fours || 0} / {liveData.striker?.sixes || 0}
                </Text>
              </View>
              <View style={styles.colSr}>
                <Text style={[styles.gridRowText, { color: theme.colors.textSecondary, textAlign: 'right' }]}>
                  {calculateSR(liveData.striker?.runs || 0, liveData.striker?.balls || 0)}
                </Text>
              </View>
            </View>

            {/* Non-Striker */}
            <View style={styles.batterGridRow}>
              <View style={styles.colName}>
                <Text style={[styles.gridRowText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                  {liveData.non_striker?.name || 'No Non-Striker'}
                </Text>
              </View>
              <View style={styles.colRuns}>
                <Text style={[styles.gridRowText, { color: theme.colors.textPrimary, textAlign: 'right' }]}>
                  {liveData.non_striker?.runs || 0}({liveData.non_striker?.balls || 0})
                </Text>
              </View>
              <View style={styles.colBoundaries}>
                <Text style={[styles.gridRowText, { color: theme.colors.textSecondary, textAlign: 'right' }]}>
                  {liveData.non_striker?.fours || 0} / {liveData.non_striker?.sixes || 0}
                </Text>
              </View>
              <View style={styles.colSr}>
                <Text style={[styles.gridRowText, { color: theme.colors.textSecondary, textAlign: 'right' }]}>
                  {calculateSR(liveData.non_striker?.runs || 0, liveData.non_striker?.balls || 0)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Bowler Card - Below Batters, tapping opens bowler modal, no title/header */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.rosterCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => setBowlerModalVisible(true)}
          >
            <View style={[styles.bowlerGridHeader, { borderBottomColor: theme.colors.border, marginTop: 2, alignItems: 'center' }]}>
              <View style={styles.colName}>
                <Text style={[styles.gridColLabel, { color: theme.colors.textSecondary }]}>Bowler</Text>
              </View>
              <View style={styles.colStat}>
                <Text style={[styles.gridColLabel, { color: theme.colors.textSecondary, textAlign: 'right' }]}>O</Text>
              </View>
              <View style={styles.colStat}>
                <Text style={[styles.gridColLabel, { color: theme.colors.textSecondary, textAlign: 'right' }]}>R</Text>
              </View>
              <View style={styles.colStat}>
                <Text style={[styles.gridColLabel, { color: theme.colors.textSecondary, textAlign: 'right' }]}>W</Text>
              </View>
              <View style={styles.colEcon}>
                <Text style={[styles.gridColLabel, { color: theme.colors.textSecondary, textAlign: 'right' }]}>Econ</Text>
              </View>
            </View>

            <View style={styles.bowlerGridRow}>
              <View style={styles.colName}>
                <Text style={[styles.gridRowText, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                  🔴 {liveData.bowler?.name || 'Select Bowler'}
                </Text>
              </View>
              <View style={styles.colStat}>
                <Text style={[styles.gridRowText, { color: theme.colors.textPrimary, textAlign: 'right' }]}>
                  {liveData.bowler?.overs || '0.0'}
                </Text>
              </View>
              <View style={styles.colStat}>
                <Text style={[styles.gridRowText, { color: theme.colors.textPrimary, textAlign: 'right' }]}>
                  {liveData.bowler?.runs_given || 0}
                </Text>
              </View>
              <View style={styles.colStat}>
                <Text style={[styles.statValueBold, styles.gridRowText, { color: theme.colors.primary, textAlign: 'right' }]}>
                  {liveData.bowler?.wickets || 0}
                </Text>
              </View>
              <View style={styles.colEcon}>
                <Text style={[styles.gridRowText, { color: theme.colors.textSecondary, textAlign: 'right' }]}>
                  {(() => {
                    const overs = parseFloat(liveData.bowler?.overs || '0');
                    if (overs === 0) return '0.00';
                    return (liveData.bowler?.runs_given / overs).toFixed(2);
                  })()}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Refined Over Tracker Card */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.rosterCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          onPress={() => setThisOverModalVisible(true)}
        >
          <View style={styles.trackerTitleRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>This Over</Text>
              <Text style={{ fontSize: 11, color: theme.colors.primary, fontWeight: '700' }}>· View Details</Text>
            </View>
            <Text style={[styles.overCountText, { color: theme.colors.textSecondary }]}>{legalBallsThisOver}/6</Text>
          </View>
          <View style={styles.ballsRow}>
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
              <Text style={{ color: theme.colors.textSecondary, fontStyle: 'italic', fontSize: 13, paddingVertical: 4 }}>
                Starting new over...
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Scoring Console Panel Card */}
        <View style={[styles.scoringPanel, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {/* Extras selector row - ABOVE runs buttons grid, styled as small border chips */}
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
                  {ext === 'none' ? 'Normal' : ext.replace('_', ' ').toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Runs Grid (0, 1, 2, 3, 4, 6) + Other Button */}
          <View style={styles.runsGrid}>
            {[0, 1, 2, 3, 4, 6].map((run) => (
              <TouchableOpacity
                key={run}
                activeOpacity={0.7}
                style={[
                  styles.runCard,
                  {
                    backgroundColor: selectedRuns === run ? theme.colors.primary : theme.colors.elevated,
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
              style={[
                styles.runCard,
                {
                  backgroundColor: theme.colors.elevated,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => setOtherRunsModalVisible(true)}
            >
              <Text style={[styles.runCardText, { fontSize: 13, color: theme.colors.textSecondary }]}>Other</Text>
            </TouchableOpacity>

            {/* Wicket Button in Runs Grid */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.runCard,
                {
                  backgroundColor: theme.colors.elevated,
                  borderColor: '#D32F2F',
                },
              ]}
              onPress={() => {
                setRetiringBatsmanType('striker');
                setWicketType('bowled');
                setWicketModalVisible(true);
              }}
            >
              <Text style={[styles.runCardText, { fontSize: 13, color: '#D32F2F', fontWeight: '700' }]}>Wicket</Text>
            </TouchableOpacity>
          </View>

          {/* Action Row: Undo, Extras, Record Ball */}
          <View style={styles.mainActionsRow}>
            {/* Undo Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.actionBtn,
                styles.undoBtn,
                isUndoDisabled && { opacity: 0.4 },
                { borderColor: theme.colors.border, borderRadius: theme.radius.sm, flex: 1 },
              ]}
              onPress={handleUndo}
              disabled={isUndoDisabled}
            >
              <RotateCcw size={15} color={isUndoDisabled ? theme.colors.textSecondary : theme.colors.textPrimary} style={{ marginRight: 4 }} />
              <Text style={[styles.undoBtnText, { color: isUndoDisabled ? theme.colors.textSecondary : theme.colors.textPrimary }]} numberOfLines={1}>Undo</Text>
            </TouchableOpacity>

            {/* Extras Stats Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.actionBtn,
                {
                  borderColor: theme.colors.border,
                  borderWidth: 1,
                  borderRadius: theme.radius.sm,
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.colors.surface,
                },
              ]}
              onPress={() => setExtrasModalVisible(true)}
            >
              <Info size={15} color={theme.colors.textPrimary} style={{ marginRight: 4 }} />
              <Text style={[styles.undoBtnText, { color: theme.colors.textPrimary }]} numberOfLines={1}>Extras</Text>
            </TouchableOpacity>

            {/* Confirm Ball Button - Rest of the space */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.actionBtn, styles.confirmBtn, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm, flex: 1.8 }]}
              onPress={handleRecordBall}
              disabled={recordBallMutation.isPending}
            >
              {recordBallMutation.isPending ? (
                <ActivityIndicator size="small" color={theme.colors.onPrimary} />
              ) : (
                <Text style={[styles.actionBtnText, { color: theme.colors.onPrimary }]} numberOfLines={1}>Record Ball</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>


      {/* MODAL: This Over Details (Bottom Sheet Style) */}
      <Modal
        visible={thisOverModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setThisOverModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.drawerBackdrop}
          activeOpacity={1}
          onPress={() => setThisOverModalVisible(false)}
        >
          <View style={[styles.drawerContentContainer, { backgroundColor: theme.colors.surface, paddingBottom: Math.max(24, insets.bottom + 12) }]}>
            <View style={styles.drawerDragHandle} />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Info color={theme.colors.primary} size={22} />
              <Text style={[styles.drawerTitleText, { color: theme.colors.textPrimary, marginBottom: 0 }]}>This Over Summary</Text>
            </View>

            <ScrollView style={{ maxHeight: 380 }} contentContainerStyle={{ gap: 14, paddingVertical: 4 }} showsVerticalScrollIndicator={false}>
              {/* CURRENT OVER DETAILS */}
              <View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.primary, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
                  Current Over ({legalBallsThisOver}/6 balls)
                </Text>
                {liveData.this_over && liveData.this_over.length > 0 ? (
                  <View style={{ gap: 8 }}>
                    {liveData.this_over.map((ball: any, idx: number) => (
                      <View key={idx} style={[styles.modalItem, { borderBottomColor: theme.colors.border, flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 8 }]}>
                        <View
                          style={[
                            styles.ballBadge,
                            {
                              backgroundColor: getBallBadgeColor(ball),
                              borderColor: getBallBorderColor(ball),
                              width: 28,
                              height: 28,
                              borderRadius: 14,
                              borderWidth: 1.5,
                              justifyContent: 'center',
                              alignItems: 'center',
                            },
                          ]}
                        >
                          <Text style={{ fontSize: 10, fontWeight: '800', color: getBallTextColor(ball) }}>
                            {formatOverBallSymbol(ball)}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 12.5, color: theme.colors.textPrimary, fontWeight: '500' }}>
                            Ball {idx + 1}: {ball.is_wicket ? `Dismissal: Wicket falls!` : `${ball.runs || 0} run(s) off bat`}
                          </Text>
                          {ball.extra_type && (
                            <Text style={{ fontSize: 11, color: '#A07800', fontWeight: '600', marginTop: 1 }}>
                              Extra: {ball.extra_type.toUpperCase()} ({ball.extra_runs || 0} runs)
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={{ fontStyle: 'italic', color: theme.colors.textSecondary, fontSize: 13 }}>
                    No deliveries recorded in this over yet.
                  </Text>
                )}
              </View>

              {/* PREVIOUS OVERS DETAILS */}
              {(() => {
                const currentInningsEvents = (liveData.all_deliveries || []).filter((e: any) => e.innings === liveData.current_innings);
                const currentOverNumber = liveData.overs ? Math.floor(parseFloat(liveData.overs)) : 0;
                const previousDeliveries = currentInningsEvents.filter((e: any) => e.over_number < currentOverNumber);

                if (previousDeliveries.length === 0) return null;

                const groupedOvers: Record<number, any[]> = {};
                for (const e of previousDeliveries) {
                  if (!groupedOvers[e.over_number]) {
                    groupedOvers[e.over_number] = [];
                  }
                  groupedOvers[e.over_number].push(e);
                }

                const overNumbers = Object.keys(groupedOvers).map(Number).sort((a, b) => b - a);

                return (
                  <View style={{ marginTop: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.textSecondary, textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 }}>
                      Previous Overs History
                    </Text>
                    <View style={{ gap: 10 }}>
                      {overNumbers.map((overNo) => {
                        const balls = groupedOvers[overNo];
                        const runs = balls.reduce((sum, b) => sum + (b.runs || 0) + (b.extra_runs || 0), 0);
                        const wickets = balls.filter(b => b.is_wicket).length;
                        const bowler = balls[0]?.bowler || 'Bowler';
                        const isExpanded = !!expandedOvers[overNo];

                        return (
                          <View
                            key={overNo}
                            style={{
                              borderColor: theme.colors.border,
                              borderWidth: 1,
                              borderRadius: theme.radius.sm,
                              backgroundColor: theme.colors.surface,
                              overflow: 'hidden',
                            }}
                          >
                            {/* Header Clickable */}
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() => setExpandedOvers(prev => ({ ...prev, [overNo]: !prev[overNo] }))}
                              style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingHorizontal: 12,
                                paddingVertical: 10,
                                backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
                              }}
                            >
                              <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.textPrimary }}>
                                  Over {overNo} · by {bowler}
                                </Text>
                                <Text style={{ fontSize: 11.5, color: theme.colors.textSecondary, marginTop: 2 }}>
                                  {runs} runs · {wickets} {wickets === 1 ? 'wicket' : 'wickets'}
                                </Text>
                              </View>
                              <Text style={{ color: theme.colors.primary, fontSize: 11.5, fontWeight: '600' }}>
                                {isExpanded ? 'Hide' : 'Details'}
                              </Text>
                            </TouchableOpacity>

                            {/* Horizontal row of ball badges inside card */}
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 12, paddingBottom: 10, paddingTop: 4 }}>
                              {balls.map((ball, idx) => (
                                <View
                                  key={idx}
                                  style={[
                                    styles.ballBadge,
                                    {
                                      backgroundColor: getBallBadgeColor(ball),
                                      borderColor: getBallBorderColor(ball),
                                      width: 22,
                                      height: 22,
                                      borderRadius: 11,
                                      borderWidth: 1,
                                      justifyContent: 'center',
                                      alignItems: 'center',
                                    },
                                  ]}
                                >
                                  <Text style={{ fontSize: 8.5, fontWeight: '800', color: getBallTextColor(ball) }}>
                                    {formatOverBallSymbol(ball)}
                                  </Text>
                                </View>
                              ))}
                            </View>

                            {/* Expanded Details list */}
                            {isExpanded && (
                              <View style={{ paddingHorizontal: 12, paddingBottom: 10, borderTopWidth: 0.5, borderTopColor: theme.colors.border, gap: 6, paddingTop: 8 }}>
                                {balls.map((ball, idx) => (
                                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={{ fontSize: 11, color: theme.colors.textSecondary, fontWeight: '600', width: 45 }}>
                                      Ball {ball.ball_number}:
                                    </Text>
                                    <Text style={{ fontSize: 11.5, color: theme.colors.textPrimary, flex: 1 }} numberOfLines={1}>
                                      {ball.is_wicket ? `Dismissal (${ball.wicket_type || 'out'})` : `${ball.runs || 0} run(s) off ${ball.batsman}`}
                                      {ball.extra_type ? ` · ${ball.extra_type.toUpperCase()} (+${ball.extra_runs || 0})` : ''}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </View>
                );
              })()}
            </ScrollView>

            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.primaryBtn, {
                borderColor: theme.colors.border,
                borderWidth: 1,
                backgroundColor: 'transparent',
                borderRadius: theme.radius.sm,
                marginTop: 16,
                paddingVertical: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }]}
              onPress={() => setThisOverModalVisible(false)}
            >
              <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>


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
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
              {wicketType === 'retired_hurt' || wicketType === 'retired_out' ? 'Retire Batsman' : 'Record Wicket'}
            </Text>
            <Text style={{ fontSize: 13, color: theme.colors.textSecondary, marginBottom: 12 }}>
              Player: <Text style={{ fontWeight: '700', color: theme.colors.textPrimary }}>{retiringBatsmanType === 'striker' ? (liveData.striker?.name || 'Striker') : (liveData.non_striker?.name || 'Non-Striker')}</Text>
            </Text>

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
                'retired_hurt',
                'retired_out',
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
            {hasAvailableRemainingBatsmen && (
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
                      ? battingPlayers.find((p) => getPlayerKey(p) === nextBatsmanKey)?.name || 'Select player'
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
            
            <ScrollView style={{ width: '100%', marginVertical: 12 }} showsVerticalScrollIndicator={false}>
              {/* Returning Batsmen Group */}
              {returningBatsmen.length > 0 && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: theme.colors.primary + '10', borderRadius: 4, overflow: 'hidden' }}>
                    Returning Batsmen (Retired Hurt)
                  </Text>
                  {returningBatsmen.map((item) => {
                    const stat = liveData.live_player_stats?.find((s: any) =>
                      item.player_id ? s.player_id === item.player_id : s.guest_name === item.guest_name
                    );
                    return (
                      <TouchableOpacity
                        key={getPlayerKey(item)}
                        style={[styles.modalItem, { borderBottomColor: theme.colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                        onPress={() => {
                          setNextBatsmanKey(getPlayerKey(item));
                          setBatsmanPickerVisible(false);
                        }}
                      >
                        <Text style={[styles.modalItemText, { color: theme.colors.textPrimary, fontWeight: '600' }]}>
                          {item.name}
                        </Text>
                        <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                          Resuming at {stat?.runs || 0} ({stat?.balls_faced || 0}b)
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* New Batsmen Group */}
              {newBatsmen.length > 0 && (
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.textSecondary, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: theme.colors.border + '30', borderRadius: 4, overflow: 'hidden' }}>
                    New Batsmen (Not Batted)
                  </Text>
                  {newBatsmen.map((item) => (
                    <TouchableOpacity
                      key={getPlayerKey(item)}
                      style={[styles.modalItem, { borderBottomColor: theme.colors.border }]}
                      onPress={() => {
                        setNextBatsmanKey(getPlayerKey(item));
                        setBatsmanPickerVisible(false);
                      }}
                    >
                      <Text style={[styles.modalItemText, { color: theme.colors.textPrimary }]}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {returningBatsmen.length === 0 && newBatsmen.length === 0 && (
                <Text style={{ textAlign: 'center', color: theme.colors.textSecondary, marginVertical: 24 }}>
                  No available batsmen left.
                </Text>
              )}
            </ScrollView>

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
            <View style={styles.drawerDragHandle} />

            {/* Title + partnership runs */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={[styles.drawerTitleText, { color: theme.colors.textPrimary }]}>Partnership</Text>
              <Text style={{ fontSize: 22, fontWeight: '800', color: theme.colors.primary }}>
                {getPartnershipRuns()} runs
              </Text>
            </View>

            {/* Slim contribution bar */}
            {(() => {
              const sR = liveData?.striker?.runs || 0;
              const nsR = liveData?.non_striker?.runs || 0;
              const total = sR + nsR;
              const sPct = total > 0 ? (sR / total) * 100 : 50;
              const nsPct = 100 - sPct;
              return (
                <View style={{ marginBottom: 14 }}>
                  <View style={{ height: 6, flexDirection: 'row', borderRadius: 3, overflow: 'hidden', backgroundColor: theme.colors.border }}>
                    <View style={{ width: `${sPct}%`, backgroundColor: theme.colors.primary }} />
                    <View style={{ width: `${nsPct}%`, backgroundColor: '#81C784' }} />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
                    <Text style={{ fontSize: 11, color: theme.colors.primary, fontWeight: '600' }}>
                      {liveData?.striker?.name?.split(' ')[0]} · {sPct.toFixed(0)}%
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>
                      {liveData?.non_striker?.name?.split(' ')[0]} · {nsPct.toFixed(0)}%
                    </Text>
                  </View>
                </View>
              );
            })()}

            {/* Divider */}
            <View style={{ height: 0.5, backgroundColor: theme.colors.border, marginBottom: 12 }} />

            {/* Player rows */}
            <View style={{ gap: 10 }}>
              {/* Striker */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: theme.colors.primary }} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary }}>
                    {liveData?.striker?.name || 'Striker'} *
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary }}>
                    {liveData?.striker?.runs || 0} ({liveData?.striker?.balls || 0}b)
                  </Text>
                  {!!liveData?.striker && (
                    <TouchableOpacity
                      onPress={() => {
                        setPartnershipModalVisible(false);
                        handleRetireBatsmanClick('striker');
                      }}
                      style={{ paddingVertical: 4, paddingHorizontal: 8, backgroundColor: theme.colors.elevated, borderRadius: 4, borderWidth: 1, borderColor: theme.colors.border }}
                    >
                      <Text style={{ fontSize: 11, color: '#D32F2F', fontWeight: '600' }}>Retire</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Non-striker */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: theme.colors.border }} />
                  <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.textSecondary }}>
                    {liveData?.non_striker?.name || 'Non-Striker'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 13, color: theme.colors.textSecondary }}>
                    {liveData?.non_striker?.runs || 0} ({liveData?.non_striker?.balls || 0}b)
                  </Text>
                  {!!liveData?.non_striker && (
                    <TouchableOpacity
                      onPress={() => {
                        setPartnershipModalVisible(false);
                        handleRetireBatsmanClick('non_striker');
                      }}
                      style={{ paddingVertical: 4, paddingHorizontal: 8, backgroundColor: theme.colors.elevated, borderRadius: 4, borderWidth: 1, borderColor: theme.colors.border }}
                    >
                      <Text style={{ fontSize: 11, color: '#D32F2F', fontWeight: '600' }}>Retire</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {/* Swap Strike */}
            {liveData?.striker && liveData?.non_striker && (
              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.primaryBtn, {
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.radius.sm,
                  height: 42,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: 16,
                  flexDirection: 'row',
                  gap: 8,
                }]}
                onPress={handleRotateStrike}
                disabled={rotateStrikeMutation.isPending}
              >
                {rotateStrikeMutation.isPending ? (
                  <ActivityIndicator size="small" color={theme.colors.onPrimary} />
                ) : (
                  <>
                    <RefreshCw size={15} color={theme.colors.onPrimary} />
                    <Text style={{ color: theme.colors.onPrimary, fontWeight: '700', fontSize: 13 }}>Swap Strike</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Close */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={{
                borderColor: theme.colors.border,
                borderWidth: 1,
                marginTop: 8,
                height: 42,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: theme.radius.sm,
              }}
              onPress={() => setPartnershipModalVisible(false)}
            >
              <Text style={{ color: theme.colors.textSecondary, fontWeight: '600', fontSize: 14 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL: Extras Breakdown Details (Bottom Sheet Style) */}
      <Modal
        visible={extrasModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setExtrasModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.drawerBackdrop}
          activeOpacity={1}
          onPress={() => setExtrasModalVisible(false)}
        >
          <View style={[styles.drawerContentContainer, { backgroundColor: theme.colors.surface, paddingBottom: Math.max(24, insets.bottom + 12) }]}>
            <View style={styles.drawerDragHandle} />

            {/* Title & Total Extras */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <View>
                <Text style={[styles.drawerTitleText, { color: theme.colors.textPrimary }]}>Extras Summary</Text>
                <Text style={{ fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 }}>
                  {liveData?.current_innings === 1 ? '1st Innings' : '2nd Innings'}
                </Text>
              </View>
              {(() => {
                const ext = parseExtras(liveData?.extras);
                return (
                  <Text style={{ fontSize: 22, fontWeight: '800', color: theme.colors.primary }}>
                    {ext.total} Runs
                  </Text>
                );
              })()}
            </View>

            {/* Divider */}
            <View style={{ height: 0.5, backgroundColor: theme.colors.border, marginBottom: 16 }} />

            {/* Extras Breakdown Grid/List */}
            {(() => {
              const ext = parseExtras(liveData?.extras);
              
              const statsRow = (label: string, value: number, abbrev: string) => (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.primary }} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary }}>{label}</Text>
                    <Text style={{ fontSize: 11, color: theme.colors.textSecondary, textTransform: 'uppercase' }}>({abbrev})</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary }}>
                    {value} {value === 1 ? 'run' : 'runs'}
                  </Text>
                </View>
              );

              return (
                <View style={{ gap: 4, marginBottom: 16 }}>
                  {statsRow('Wides', ext.wides, 'wd')}
                  <View style={{ height: 0.5, backgroundColor: theme.colors.border, opacity: 0.5 }} />
                  {statsRow('No Balls', ext.noBalls, 'nb')}
                  <View style={{ height: 0.5, backgroundColor: theme.colors.border, opacity: 0.5 }} />
                  {statsRow('Byes', ext.byes, 'b')}
                  <View style={{ height: 0.5, backgroundColor: theme.colors.border, opacity: 0.5 }} />
                  {statsRow('Leg Byes', ext.legByes, 'lb')}
                </View>
              );
            })()}

            {/* Divider */}
            <View style={{ height: 0.5, backgroundColor: theme.colors.border, marginBottom: 12 }} />

            {/* Close Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={{
                borderColor: theme.colors.border,
                borderWidth: 1,
                marginTop: 8,
                height: 42,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: theme.radius.sm,
              }}
              onPress={() => setExtrasModalVisible(false)}
            >
              <Text style={{ color: theme.colors.textSecondary, fontWeight: '600', fontSize: 14 }}>Close</Text>
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
  contentArea: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
  },
  gridRowText: {
    fontSize: 13,
  },
  scoreCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.01,
    shadowRadius: 1,
    elevation: 0,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
  },
  inningsLabel: {
    color: '#81C784',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  targetLabel: {
    color: '#FFB74D',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  scoreText: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '800',
  },
  oversText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CCC',
  },
  runRateRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  rrBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rrText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  rosterSection: {
    gap: 6,
  },
  rosterCard: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.01,
    shadowRadius: 1,
    elevation: 0,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  inlineSwapBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 77, 38, 0.05)',
  },
  swapBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  interactiveText: {
    fontSize: 11,
    fontWeight: '700',
  },
  battersGridHeader: {
    flexDirection: 'row',
    paddingBottom: 6,
    borderBottomWidth: 1,
    marginBottom: 6,
  },
  bowlerGridHeader: {
    flexDirection: 'row',
    paddingBottom: 6,
    borderBottomWidth: 1,
    marginBottom: 6,
  },
  gridColLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  colName: {
    flex: 2.2,
  },
  colRuns: {
    flex: 1,
    textAlign: 'right',
  },
  colBoundaries: {
    flex: 1.5,
    textAlign: 'right',
  },
  colSr: {
    flex: 1.2,
    textAlign: 'right',
  },
  colStat: {
    flex: 0.8,
    textAlign: 'right',
  },
  colEcon: {
    flex: 1.2,
    textAlign: 'right',
  },
  batterGridRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    alignItems: 'center',
  },
  batterNameActive: {
    fontWeight: '700',
  },
  statValueBold: {
    fontWeight: '700',
  },
  bowlerGridRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    alignItems: 'center',
  },
  situationCard: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  situationText: {
    fontSize: 12,
    fontWeight: '700',
  },
  trackerSection: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  trackerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  overCountText: {
    fontSize: 13,
    fontWeight: '600',
  },
  ballsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingVertical: 2,
  },
  ballBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ballText: {
    fontSize: 10,
    fontWeight: '800',
  },
  scoringPanel: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 10,
    gap: 8,
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
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: 4,
  },
  extraBtnText: {
    fontSize: 10,
  },
  runsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  runCard: {
    width: '23%',
    height: 34,
    borderWidth: 1,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  runCardText: {
    fontSize: 14,
    fontWeight: '700',
  },
  mainActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  actionBtn: {
    flex: 1,
    height: 34,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  undoBtn: {
    borderColor: '#CCCCCC',
  },
  undoBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  wicketBtn: {
    borderColor: '#D32F2F',
  },
  wicketBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D32F2F',
  },
  otherBtn: {
    borderColor: '#666666',
    borderWidth: 1,
  },
  otherBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666666',
  },
  confirmBtn: {
    borderWidth: 0,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
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

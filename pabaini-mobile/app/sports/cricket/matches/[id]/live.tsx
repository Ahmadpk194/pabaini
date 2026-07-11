import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Clock,
  RefreshCw,
  Trophy,
  ChevronDown,
  Settings,
  Info,
  FileText,
  MessageSquare,
  Activity,
  Award,
  Calendar,
  MapPin,
  User,
  Users,
  Percent,
  Bell,
  BellOff,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../../../src/context/ThemeContext';
import { useMatchDetail, useLiveMatch, useLineup } from '../../../../../src/hooks/useMatches';
import { SkeletonBox, SkeletonCircle } from '../../../../../src/components/skeletons';

const { width: screenWidth } = Dimensions.get('window');

export default function LiveViewerScreen() {
  const { theme, mode } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = Number(id);
  const insets = useSafeAreaInsets();

  // Tab Navigation state
  const [activeTab, setActiveTab] = useState<'summary' | 'scorecard' | 'commentary' | 'stats' | 'info'>('summary');

  // Innings toggle inside Scorecard tab
  const [scorecardInnings, setScorecardInnings] = useState<1 | 2>(1);

  // Bottom Sheet Visibility States
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [battersModalVisible, setBattersModalVisible] = useState(false);
  const [bowlerModalVisible, setBowlerModalVisible] = useState(false);
  const [overModalVisible, setOverModalVisible] = useState(false);
  const [battersListExpanded, setBattersListExpanded] = useState(false);

  // UX Interaction States
  const [isFollowing, setIsFollowing] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Queries
  const { data: match, isLoading: isLoadingMatch, isError: isErrorMatch, refetch: refetchMatch } = useMatchDetail(matchId);
  const { data: liveData, isLoading: isLoadingLive, isError: isErrorLive, refetch } = useLiveMatch(matchId, 5000);
  const { data: lineup, isLoading: isLoadingLineup } = useLineup(matchId);

  const isLoading = isLoadingMatch || (isLoadingLive && !liveData);

  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
    setAlertMessage(!isFollowing ? '🔔 You are now following this match!' : '🔕 Stopped following match.');
    setTimeout(() => setAlertMessage(null), 3000);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.surface }]} edges={['top', 'left', 'right']}>
        {/* Skeleton Sticky Header */}
        <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <SkeletonCircle size={36} />
          <SkeletonBox width={100} height={18} borderRadius={4} />
          <SkeletonCircle size={36} />
        </View>

        {/* Skeleton Match Versus Card */}
        <View style={[styles.matchHeaderCard, { backgroundColor: theme.colors.primary }]}>
          <View style={[styles.versusRow, { opacity: 0.8 }]}>
            <View style={{ flex: 1, height: 16, backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: 4 }} />
            <Text style={[styles.versusText, { color: '#E0E0E0' }]}>VS</Text>
            <View style={{ flex: 1, height: 16, backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: 4 }} />
          </View>
          <View style={{ width: 140, height: 12, backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: 4, marginTop: 6, alignSelf: 'center' }} />
        </View>

        {/* Skeleton Tab Nav */}
        <View style={{ height: 44, borderBottomWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, flexDirection: 'row', paddingHorizontal: 16, alignItems: 'center', gap: 16 }}>
          <SkeletonBox width={60} height={16} borderRadius={4} />
          <SkeletonBox width={65} height={16} borderRadius={4} />
          <SkeletonBox width={80} height={16} borderRadius={4} />
          <SkeletonBox width={50} height={16} borderRadius={4} />
        </View>

        {/* Skeleton Body Scroll */}
        <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={{ height: 120, borderRadius: 12, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, padding: 16, gap: 12 }}>
            <SkeletonBox width={80} height={12} borderRadius={4} />
            <SkeletonBox width={140} height={32} borderRadius={4} />
            <SkeletonBox width={110} height={12} borderRadius={4} />
          </View>
          <View style={{ height: 40, borderRadius: 8, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 16, justifyContent: 'center' }}>
            <SkeletonBox width={150} height={14} borderRadius={4} />
          </View>
          <View style={{ height: 110, borderRadius: 12, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, padding: 16, gap: 10 }}>
            <SkeletonBox width={100} height={14} borderRadius={4} />
            <SkeletonBox width="90%" height={12} borderRadius={4} />
            <SkeletonBox width="70%" height={12} borderRadius={4} />
          </View>
          <View style={{ height: 90, borderRadius: 12, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, padding: 16, gap: 10 }}>
            <SkeletonBox width={80} height={14} borderRadius={4} />
            <SkeletonBox width="60%" height={12} borderRadius={4} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!match || !liveData) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.surface }]}>
        <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
          <Text style={{ color: theme.colors.textSecondary }}>Failed to load live match data.</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: theme.colors.primary, marginTop: 12 }]}
            onPress={() => {
              refetchMatch();
              refetch();
            }}
          >
            <Text style={{ color: theme.colors.onPrimary, fontWeight: '700' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isCompleted = match.status === 'completed' || liveData.status === 'completed';

  // Format ball symbols
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
      if (ball.wicket_type === 'retired_hurt') return '#FFF9E6';
      return '#FFEBEB';
    }
    if (ball.extra_type) return '#FFF8DC';
    if (ball.runs === 4 || ball.runs === 6) return '#EBFBEF';
    return '#F5F5F5';
  };

  const getBallTextColor = (ball: any) => {
    if (ball.is_wicket) {
      if (ball.wicket_type === 'retired_hurt') return '#A07800';
      return '#D32F2F';
    }
    if (ball.extra_type) return '#A07800';
    if (ball.runs === 4 || ball.runs === 6) return '#2E7D32';
    return '#616161';
  };

  const getBallBorderColor = (ball: any) => {
    if (ball.is_wicket) {
      if (ball.wicket_type === 'retired_hurt') return '#FFE082';
      return '#FFCDD2';
    }
    if (ball.extra_type) return '#FFE082';
    if (ball.runs === 4 || ball.runs === 6) return '#C8E6C9';
    return '#BDBDBD';
  };

  const legalBallsThisOver = (liveData.this_over || []).filter(
    (b: any) => b.extra_type !== 'wide' && b.extra_type !== 'no_ball'
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
      const sortedFow = [...currentInningsFow].sort((a, b) => b.score_at_wicket - a.score_at_wicket);
      const lastWicket = sortedFow[0];
      return Math.max(0, currentRuns - lastWicket.score_at_wicket);
    }
    
    return currentRuns;
  };

  // Get current batting team details
  const currentBattingTeamId = liveData?.current_innings === 1
    ? match?.innings_1_batting_team_id
    : (match?.innings_1_batting_team_id === match?.team_a_id ? match?.team_b_id : match?.team_a_id);

  const battingTeamName = currentBattingTeamId === match?.team_a_id
    ? match?.team_a?.name
    : match?.team_b?.name;

  const currentBowlingTeamId = currentBattingTeamId === match?.team_a_id
    ? match?.team_b_id
    : match?.team_a_id;

  const bowlingTeamName = currentBowlingTeamId === match?.team_a_id
    ? match?.team_a?.name
    : match?.team_b?.name;

  // Innings 1 vs 2 status tracking
  const firstInningsScore = liveData.current_innings === 2 ? liveData.innings_1_score : null;

  // Active batsman keys
  const strikerKey = liveData?.striker ? (liveData.striker.id ? `p-${liveData.striker.id}` : null) : null;
  const nonStrikerKey = liveData?.non_striker ? (liveData.non_striker.id ? `p-${liveData.non_striker.id}` : null) : null;

  // Helper to extract player key
  const getPlayerKey = (player: any) => {
    return player.player_id ? `p-${player.player_id}` : `g-${player.guest_name}`;
  };

  const battingPlayers = lineup
    ? (currentBattingTeamId === match?.team_a_id ? lineup.team_a.players : lineup.team_b.players)
    : [];

  // Calculate dynamic stats for chase scenario
  const getChaseProgress = () => {
    if (!liveData.target) return null;
    let currentRuns = 0;
    let wickets = 0;
    if (typeof liveData.score === 'string') {
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

  // Get situation card message
  const getMatchSituationMessage = () => {
    if (isCompleted) {
      if (match.winner_team) {
        return `Winner: ${match.winner_team.name}`;
      }
      return 'Match completed';
    }

    const chase = getChaseProgress();
    if (chase) {
      if (chase.runsNeeded === 0) {
        return 'Scores level!';
      }
      return `Need ${chase.runsNeeded} runs from ${chase.ballsRemaining} balls`;
    }

    if (liveData.current_innings === 1) {
      return `Powerplay active • 1st Innings in progress`;
    }

    return `${battingTeamName || 'Batting team'} leads`;
  };

  // Calculation for strike rate
  const calculateSR = (runs: number, balls: number) => {
    if (balls === 0) return '0.00';
    return ((runs / balls) * 100).toFixed(2);
  };

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'summary':
        const isPreMatch = match.status === 'scheduled' || match.status === 'pending_request';
        const isInningsBreak = match.status === 'live' && !liveData.striker && !liveData.non_striker && !isCompleted;

        if (isPreMatch) {
          return (
            <View style={styles.tabContentContainer}>
              <View style={[styles.rosterCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, padding: 24, alignItems: 'center', gap: 12 }]}>
                <Calendar size={32} color={theme.colors.primary} />
                <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.textPrimary, textAlign: 'center' }}>
                  Match Scheduled
                </Text>
                <Text style={{ fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 18 }}>
                  Play has not started yet. Team lineups are declared. Scoreboard and commentary will update once play begins.
                </Text>
                {match.scheduled_at && (
                  <View style={{ backgroundColor: theme.colors.background, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginTop: 8 }}>
                    <Text style={{ fontSize: 12, color: theme.colors.textSecondary, fontWeight: '600' }}>
                      Starts: {new Date(match.scheduled_at).toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        }

        if (isInningsBreak) {
          return (
            <View style={styles.tabContentContainer}>
              {/* HERO LIVE SCORE CARD */}
              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.heroScoreCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                onPress={() => setScoreModalVisible(true)}
              >
                <View style={styles.heroScoreHeader}>
                  <Text style={[styles.heroInningsLabel, { color: '#FFA500' }]}>
                    INNINGS BREAK
                  </Text>
                  <View style={styles.interactiveIndicator}>
                    <Text style={[styles.interactiveText, { color: theme.colors.textSecondary }]}>Tap for details</Text>
                    <ChevronDown size={14} color={theme.colors.textSecondary} />
                  </View>
                </View>
                
                <View style={styles.heroScoreRow}>
                  <Text style={[styles.heroScoreText, { color: theme.colors.textPrimary }]}>
                    {liveData.score}
                  </Text>
                  <Text style={[styles.heroOversText, { color: theme.colors.textSecondary }]}>
                    ({liveData.overs} ov)
                  </Text>
                </View>

                <View style={styles.heroFooterRow}>
                  <Text style={[styles.heroMetaText, { color: theme.colors.textSecondary }]}>
                    CRR: {liveData.current_run_rate?.toFixed(2) || '0.00'}
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={[styles.rosterCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, padding: 24, alignItems: 'center', gap: 12 }]}>
                <Clock size={32} color="#FFA500" />
                <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.textPrimary, textAlign: 'center' }}>
                  First Innings Finished
                </Text>
                <Text style={{ fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 18 }}>
                  The first innings has completed. Play will resume shortly for the chase.
                </Text>
                {!!liveData.target && (
                  <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.primary, marginTop: 4 }}>
                    Target: {liveData.target} runs
                  </Text>
                )}
              </View>
            </View>
          );
        }

        return (
          <View style={styles.tabContentContainer}>
            {/* HERO LIVE SCORE CARD */}
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.heroScoreCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={() => setScoreModalVisible(true)}
            >
              <View style={styles.heroScoreHeader}>
                <Text style={[styles.heroInningsLabel, { color: theme.colors.primary }]}>
                  {battingTeamName ? battingTeamName.toUpperCase() : 'BATTING TEAM'}
                </Text>
                {!isCompleted && (
                  <View style={styles.interactiveIndicator}>
                    <Text style={[styles.interactiveText, { color: theme.colors.textSecondary }]}>Tap for details</Text>
                    <ChevronDown size={14} color={theme.colors.textSecondary} />
                  </View>
                )}
              </View>
              
              <View style={styles.heroScoreRow}>
                <Text style={[styles.heroScoreText, { color: theme.colors.textPrimary }]}>
                  {liveData.score}
                </Text>
                <Text style={[styles.heroOversText, { color: theme.colors.textSecondary }]}>
                  ({liveData.overs} ov)
                </Text>
              </View>

              <View style={styles.heroFooterRow}>
                <Text style={[styles.heroMetaText, { color: theme.colors.textSecondary }]}>
                  CRR: {liveData.current_run_rate?.toFixed(2) || '0.00'}
                </Text>
                {!!liveData.required_run_rate && (
                  <Text style={[styles.heroMetaText, { color: '#FFA500', marginLeft: 12 }]}>
                    RRR: {liveData.required_run_rate?.toFixed(2)}
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            {/* MATCH SITUATION CARD */}
            <View
              style={[
                styles.situationCard,
                {
                  backgroundColor: mode === 'dark' ? 'rgba(76, 175, 80, 0.12)' : '#F0F9EB',
                  borderColor: mode === 'dark' ? 'rgba(76, 175, 80, 0.25)' : '#E1F3D8',
                },
              ]}
            >
              <Text style={[styles.situationText, { color: mode === 'dark' ? '#81C784' : '#67C23A' }]}>
                📢 {getMatchSituationMessage()}
              </Text>
            </View>

            {!isCompleted && (
              <>
                {/* CURRENT BATTERS CARD */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.rosterCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                  onPress={() => {
                    setBattersListExpanded(false);
                    setBattersModalVisible(true);
                  }}
                >
                  <View style={styles.cardHeaderRow}>
                    <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Batting</Text>
                    <View style={styles.interactiveIndicator}>
                      <Text style={[styles.interactiveText, { color: theme.colors.textSecondary }]}>Breakdown</Text>
                      <ChevronDown size={14} color={theme.colors.textSecondary} />
                    </View>
                  </View>

                  <View style={styles.battersGridHeader}>
                    <Text style={[styles.gridColLabel, styles.colName, { color: theme.colors.textSecondary }]}>Batter</Text>
                    <Text style={[styles.gridColLabel, styles.colRuns, { color: theme.colors.textSecondary }]}>R(B)</Text>
                    <Text style={[styles.gridColLabel, styles.colBoundaries, { color: theme.colors.textSecondary }]}>4s / 6s</Text>
                    <Text style={[styles.gridColLabel, styles.colSr, { color: theme.colors.textSecondary }]}>SR</Text>
                  </View>

                  {/* Striker */}
                  <View style={styles.batterGridRow}>
                    <Text style={[styles.colName, styles.batterNameActive, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                      🏏 {liveData.striker?.name || 'No Striker'} *
                    </Text>
                    <Text style={[styles.colRuns, styles.statValueBold, { color: theme.colors.textPrimary }]}>
                      {liveData.striker?.runs || 0}({liveData.striker?.balls || 0})
                    </Text>
                    <Text style={[styles.colBoundaries, { color: theme.colors.textSecondary }]}>
                      {liveData.striker?.fours || 0} / {liveData.striker?.sixes || 0}
                    </Text>
                    <Text style={[styles.colSr, { color: theme.colors.textSecondary }]}>
                      {calculateSR(liveData.striker?.runs || 0, liveData.striker?.balls || 0)}
                    </Text>
                  </View>

                  {/* Non-Striker */}
                  <View style={styles.batterGridRow}>
                    <Text style={[styles.colName, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                      {liveData.non_striker?.name || 'No Non-Striker'}
                    </Text>
                    <Text style={[styles.colRuns, { color: theme.colors.textPrimary }]}>
                      {liveData.non_striker?.runs || 0}({liveData.non_striker?.balls || 0})
                    </Text>
                    <Text style={[styles.colBoundaries, { color: theme.colors.textSecondary }]}>
                      {liveData.non_striker?.fours || 0} / {liveData.non_striker?.sixes || 0}
                    </Text>
                    <Text style={[styles.colSr, { color: theme.colors.textSecondary }]}>
                      {calculateSR(liveData.non_striker?.runs || 0, liveData.non_striker?.balls || 0)}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* CURRENT BOWLER CARD */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.rosterCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                  onPress={() => setBowlerModalVisible(true)}
                >
                  <View style={styles.cardHeaderRow}>
                    <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Bowling</Text>
                    <View style={styles.interactiveIndicator}>
                      <Text style={[styles.interactiveText, { color: theme.colors.textSecondary }]}>Detailed stats</Text>
                      <ChevronDown size={14} color={theme.colors.textSecondary} />
                    </View>
                  </View>

                  <View style={styles.bowlerGridHeader}>
                    <Text style={[styles.gridColLabel, styles.colName, { color: theme.colors.textSecondary }]}>Bowler</Text>
                    <Text style={[styles.gridColLabel, styles.colStat, { color: theme.colors.textSecondary }]}>O</Text>
                    <Text style={[styles.gridColLabel, styles.colStat, { color: theme.colors.textSecondary }]}>R</Text>
                    <Text style={[styles.gridColLabel, styles.colStat, { color: theme.colors.textSecondary }]}>W</Text>
                    <Text style={[styles.gridColLabel, styles.colEcon, { color: theme.colors.textSecondary }]}>Econ</Text>
                  </View>

                  <View style={styles.bowlerGridRow}>
                    <Text style={[styles.colName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                      🔴 {liveData.bowler?.name || 'No Bowler'}
                    </Text>
                    <Text style={[styles.colStat, { color: theme.colors.textPrimary }]}>
                      {liveData.bowler?.overs || '0.0'}
                    </Text>
                    <Text style={[styles.colStat, { color: theme.colors.textPrimary }]}>
                      {liveData.bowler?.runs_given || 0}
                    </Text>
                    <Text style={[styles.colStat, styles.statValueBold, { color: theme.colors.primary }]}>
                      {liveData.bowler?.wickets || 0}
                    </Text>
                    <Text style={[styles.colEcon, { color: theme.colors.textSecondary }]}>
                      {(() => {
                        const overs = parseFloat(liveData.bowler?.overs || '0');
                        if (overs === 0) return '0.00';
                        return (liveData.bowler?.runs_given / overs).toFixed(2);
                      })()}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* THIS OVER TRACKER */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.rosterCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                  onPress={() => setOverModalVisible(true)}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>This Over</Text>
                      <Text style={[styles.overBallCount, { color: theme.colors.textSecondary }]}>
                        {legalBallsThisOver}/6 balls
                      </Text>
                    </View>
                    <View style={styles.interactiveIndicator}>
                      <Text style={[styles.interactiveText, { color: theme.colors.textSecondary }]}>Commentary</Text>
                      <ChevronDown size={14} color={theme.colors.textSecondary} />
                    </View>
                  </View>

                  <View style={styles.thisOverContainer}>
                    <View style={styles.ballsRow}>
                      {liveData.this_over && liveData.this_over.length > 0 ? (
                        liveData.this_over.map((ball: any, idx: number) => (
                          <View
                            key={idx}
                            style={[
                              styles.ballBadge,
                              {
                                backgroundColor: getBallBadgeColor(ball),
                                borderColor: getBallBorderColor(ball),
                              },
                            ]}
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
                    </View>
                    
                    {liveData.this_over && liveData.this_over.length > 0 && (
                      <View style={[styles.overTotalBadge, { backgroundColor: theme.colors.border }]}>
                        <Text style={[styles.overTotalText, { color: theme.colors.textPrimary }]}>
                          Over runs: {liveData.this_over.reduce((acc: number, b: any) => acc + (b.runs || 0) + (b.extra_runs || 0), 0)}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </>
            )}

            {/* COMPLETION SUMMARY CARD */}
            {isCompleted && (
              <View
                style={[
                  styles.completionCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.md,
                  },
                ]}
              >
                <Trophy size={48} color="#D4A700" style={{ alignSelf: 'center', marginBottom: 12 }} />
                <Text style={[styles.completionTitle, { color: theme.colors.textPrimary }]}>
                  Match Finished
                </Text>
                {match.winner_team && (
                  <Text style={[styles.completionWinnerText, { color: theme.colors.primary }]}>
                    🎉 Winner: {match.winner_team.name}
                  </Text>
                )}
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.fullScorecardBtn, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm }]}
                  onPress={() => router.replace(`/sports/cricket/matches/${matchId}`)}
                >
                  <Text style={{ color: theme.colors.onPrimary, fontWeight: '700' }}>View Full Scorecard</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );

      case 'scorecard':
        const currentScorecardTeamId = scorecardInnings === 1
          ? match.innings_1_batting_team_id
          : (match.innings_1_batting_team_id === match.team_a_id ? match.team_b_id : match.team_a_id);

        const currentScorecardTeamName = currentScorecardTeamId === match.team_a_id
          ? match.team_a.name
          : match.team_b.name;

        const isLive = match.status === 'live' || liveData.status === 'live';
        const statsSource = (isLive && liveData.live_player_stats)
          ? liveData.live_player_stats
          : (match.player_stats || []);

        const fowSource = (isLive && liveData.fall_of_wickets)
          ? liveData.fall_of_wickets
          : (match.fall_of_wickets || []);

        // Filter stats matching current innings team
        const scorecardBattingStats = statsSource.filter((s: any) => s.team_id === currentScorecardTeamId);
        // Bowling stats belong to opponent team
        const opponentTeamId = currentScorecardTeamId === match.team_a_id ? match.team_b_id : match.team_a_id;
        const scorecardBowlingStats = statsSource.filter((s: any) => s.team_id === opponentTeamId && s.overs_bowled > 0);

        return (
          <View style={styles.tabContentContainer}>
            {/* Innings Selector Segment */}
            <View style={[styles.segmentContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <TouchableOpacity
                style={[styles.segmentButton, scorecardInnings === 1 && { backgroundColor: theme.colors.primary }]}
                onPress={() => setScorecardInnings(1)}
              >
                <Text style={[styles.segmentText, { color: scorecardInnings === 1 ? theme.colors.onPrimary : theme.colors.textSecondary }]}>
                  1st Innings
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentButton, scorecardInnings === 2 && { backgroundColor: theme.colors.primary }]}
                onPress={() => setScorecardInnings(2)}
              >
                <Text style={[styles.segmentText, { color: scorecardInnings === 2 ? theme.colors.onPrimary : theme.colors.textSecondary }]}>
                  2nd Innings
                </Text>
              </TouchableOpacity>
            </View>

            {/* BATTING SCORECARD CARD */}
            <View style={[styles.rosterCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.textPrimary, marginBottom: 12 }]}>
                Batting — {currentScorecardTeamName}
              </Text>

              <View style={styles.battersGridHeader}>
                <Text style={[styles.gridColLabel, styles.colName, { color: theme.colors.textSecondary }]}>Batter</Text>
                <Text style={[styles.gridColLabel, styles.colDismissal, { color: theme.colors.textSecondary }]}>Dismissal</Text>
                <Text style={[styles.gridColLabel, styles.colRuns, { color: theme.colors.textSecondary }]}>R</Text>
                <Text style={[styles.gridColLabel, styles.colStat, { color: theme.colors.textSecondary }]}>B</Text>
                <Text style={[styles.gridColLabel, styles.colStat, { color: theme.colors.textSecondary }]}>4s</Text>
                <Text style={[styles.gridColLabel, styles.colStat, { color: theme.colors.textSecondary }]}>6s</Text>
              </View>

              {scorecardBattingStats.length > 0 ? (
                scorecardBattingStats.map((s: any, idx: number) => (
                  <View key={idx} style={styles.batterGridRow}>
                    <Text style={[styles.colName, { color: theme.colors.textPrimary, fontWeight: '600' }]} numberOfLines={1}>
                      {s.name}
                    </Text>
                    <Text style={[styles.colDismissal, { color: theme.colors.textSecondary, fontSize: 11 }]} numberOfLines={1}>
                      {s.how_out ? s.how_out.replace(/_/g, ' ') : (s.is_not_out ? 'not out' : 'dnb')}
                    </Text>
                    <Text style={[styles.colRuns, styles.statValueBold, { color: theme.colors.textPrimary }]}>
                      {s.runs}
                    </Text>
                    <Text style={[styles.colStat, { color: theme.colors.textSecondary }]}>
                      {s.balls_faced}
                    </Text>
                    <Text style={[styles.colStat, { color: theme.colors.textSecondary }]}>
                      {s.fours}
                    </Text>
                    <Text style={[styles.colStat, { color: theme.colors.textSecondary }]}>
                      {s.sixes}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 24, gap: 6 }}>
                  <FileText size={24} color={theme.colors.textSecondary} />
                  <Text style={{ fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center', paddingHorizontal: 16 }}>
                    {match.status === 'scheduled' || match.status === 'pending_request'
                      ? 'Team lineups declared. Individual batting stats will populate once play begins.'
                      : 'No batting statistics recorded yet for this innings.'}
                  </Text>
                </View>
              )}
            </View>

            {/* BOWLING SCORECARD CARD */}
            <View style={[styles.rosterCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.textPrimary, marginBottom: 12 }]}>
                Bowling
              </Text>

              <View style={styles.bowlerGridHeader}>
                <Text style={[styles.gridColLabel, styles.colName, { color: theme.colors.textSecondary }]}>Bowler</Text>
                <Text style={[styles.gridColLabel, styles.colStat, { color: theme.colors.textSecondary }]}>O</Text>
                <Text style={[styles.gridColLabel, styles.colStat, { color: theme.colors.textSecondary }]}>M</Text>
                <Text style={[styles.gridColLabel, styles.colStat, { color: theme.colors.textSecondary }]}>R</Text>
                <Text style={[styles.gridColLabel, styles.colStat, { color: theme.colors.textSecondary }]}>W</Text>
                <Text style={[styles.gridColLabel, styles.colEcon, { color: theme.colors.textSecondary }]}>Econ</Text>
              </View>

              {scorecardBowlingStats.length > 0 ? (
                scorecardBowlingStats.map((s: any, idx: number) => (
                  <View key={idx} style={styles.bowlerGridRow}>
                    <Text style={[styles.colName, { color: theme.colors.textPrimary, fontWeight: '600' }]} numberOfLines={1}>
                      {s.name}
                    </Text>
                    <Text style={[styles.colStat, { color: theme.colors.textPrimary }]}>
                      {s.overs_bowled}
                    </Text>
                    <Text style={[styles.colStat, { color: theme.colors.textPrimary }]}>
                      {s.maidens || 0}
                    </Text>
                    <Text style={[styles.colStat, { color: theme.colors.textPrimary }]}>
                      {s.runs_given}
                    </Text>
                    <Text style={[styles.colStat, styles.statValueBold, { color: theme.colors.primary }]}>
                      {s.wickets}
                    </Text>
                    <Text style={[styles.colEcon, { color: theme.colors.textSecondary }]}>
                      {s.overs_bowled > 0 ? (s.runs_given / s.overs_bowled).toFixed(2) : '0.00'}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 24, gap: 6 }}>
                  <Users size={24} color={theme.colors.textSecondary} />
                  <Text style={{ fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center', paddingHorizontal: 16 }}>
                    {match.status === 'scheduled' || match.status === 'pending_request'
                      ? 'No bowling statistics available until match play starts.'
                      : 'No bowling statistics recorded yet for this innings.'}
                  </Text>
                </View>
              )}
            </View>

            {/* FALL OF WICKETS TIMELINE CARD */}
            <View style={[styles.rosterCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.textPrimary, marginBottom: 12 }]}>
                Fall of Wickets
              </Text>

              {fowSource && fowSource.filter((f: any) => f.innings === scorecardInnings).length > 0 ? (
                fowSource.filter((f: any) => f.innings === scorecardInnings).map((fow: any, idx: number) => (
                  <View key={idx} style={[styles.fowRow, { borderBottomColor: theme.colors.border }]}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.primary }}>
                      {idx + 1}
                    </Text>
                    <View style={{ flex: 1, paddingHorizontal: 12 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.textPrimary }}>
                        {fow.player_name}
                      </Text>
                      <Text style={{ fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 }}>
                        {fow.wicket_type} • Over {fow.over}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.textPrimary }}>
                      {fow.score_at_wicket} Runs
                    </Text>
                  </View>
                ))
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                  <Text style={{ fontSize: 13, color: theme.colors.textSecondary, fontStyle: 'italic' }}>
                    No wickets fallen in this innings.
                  </Text>
                </View>
              )}
            </View>
          </View>
        );

      case 'commentary':
        return (
          <View style={styles.tabContentContainer}>
            {/* Current Over Commentary Feed */}
            <View style={[styles.rosterCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.textPrimary, marginBottom: 12 }]}>
                Active Over Deliveries
              </Text>

              {liveData.this_over && liveData.this_over.length > 0 ? (
                liveData.this_over.map((ball: any, idx: number) => (
                  <View key={idx} style={[styles.commentaryRow, { borderBottomWidth: 0 }]}>
                    {idx < liveData.this_over.length - 1 && (
                      <View style={[styles.timelineConnector, { backgroundColor: theme.colors.border }]} />
                    )}
                    <View style={[styles.commentaryBallBadge, { backgroundColor: getBallBadgeColor(ball), borderColor: getBallBorderColor(ball) }]}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: getBallTextColor(ball) }}>
                        {formatOverBallSymbol(ball)}
                      </Text>
                    </View>
                    <View style={styles.commentaryContent}>
                      <Text style={[styles.commentaryText, { color: theme.colors.textPrimary, fontWeight: '600' }]}>
                        {ball.is_wicket && ball.wicket_type !== 'retired_hurt' ? 'WICKET!' : ball.wicket_type === 'retired_hurt' ? 'Retired Hurt' : `${ball.runs} Run(s)`}
                      </Text>
                      <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 }}>
                        Delivery {idx + 1} of current over.
                        {ball.extra_type ? ` Extra: ${ball.extra_type.toUpperCase()} (+${ball.extra_runs} runs).` : ''}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 24, gap: 6 }}>
                  <MessageSquare size={24} color={theme.colors.textSecondary} />
                  <Text style={{ fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center', paddingHorizontal: 16 }}>
                    {match.status === 'scheduled' || match.status === 'pending_request'
                      ? 'No commentary available until match play starts.'
                      : 'Waiting for the next delivery to start commentary feed...'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        );

      case 'stats':
        const isScheduled = match.status === 'scheduled' || match.status === 'pending_request';
        if (isScheduled) {
          return (
            <View style={styles.tabContentContainer}>
              <View style={[styles.rosterCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, padding: 24, alignItems: 'center', gap: 12 }]}>
                <Activity size={32} color={theme.colors.textSecondary} />
                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary, textAlign: 'center' }}>
                  Analysis Not Available
                </Text>
                <Text style={{ fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 18, paddingHorizontal: 16 }}>
                  Run progression metrics, boundary analytics, and worm charts will populate once match play begins.
                </Text>
              </View>
            </View>
          );
        }

        return (
          <View style={styles.tabContentContainer}>
            {/* Visual Analytics Progression */}
            <View style={[styles.rosterCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.textPrimary, marginBottom: 12 }]}>
                Run Rate Analytics
              </Text>

              <View style={{ gap: 12, marginTop: 8 }}>
                <Text style={{ fontSize: 13, color: theme.colors.textSecondary }}>
                  Comparison of Current Run Rate vs Required Run Rate
                </Text>
                
                {/* CRR Progress Meter */}
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.textPrimary }}>Current RR</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.primary }}>
                      {liveData.current_run_rate?.toFixed(2) || '0.00'}
                    </Text>
                  </View>
                  <View style={{ height: 8, width: '100%', borderRadius: 4, backgroundColor: theme.colors.border, overflow: 'hidden' }}>
                    <View style={{ width: `${Math.min(100, ((liveData.current_run_rate || 0) / 12) * 100)}%`, height: '100%', backgroundColor: theme.colors.primary }} />
                  </View>
                </View>

                {/* RRR Progress Meter */}
                {!!liveData.required_run_rate && (
                  <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.textPrimary }}>Required RR</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFA500' }}>
                        {liveData.required_run_rate?.toFixed(2)}
                      </Text>
                    </View>
                    <View style={{ height: 8, width: '100%', borderRadius: 4, backgroundColor: theme.colors.border, overflow: 'hidden' }}>
                      <View style={{ width: `${Math.min(100, ((liveData.required_run_rate || 0) / 12) * 100)}%`, height: '100%', backgroundColor: '#FFA500' }} />
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Worm Graph Placeholder Architecture */}
            <View style={[styles.rosterCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.textPrimary, marginBottom: 12 }]}>
                Worm Progression Graph
              </Text>
              
              {/* Graphic architecture mockup using pure CSS vectors */}
              <View style={{ height: 120, width: '100%', borderLeftWidth: 1, borderBottomWidth: 1, borderColor: theme.colors.border, justifyContent: 'flex-end', paddingBottom: 10, paddingLeft: 10, gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: '100%', gap: 16 }}>
                  <View style={{ height: '20%', width: 8, backgroundColor: theme.colors.primary, borderRadius: 2 }} />
                  <View style={{ height: '35%', width: 8, backgroundColor: theme.colors.primary, borderRadius: 2 }} />
                  <View style={{ height: '40%', width: 8, backgroundColor: theme.colors.primary, borderRadius: 2 }} />
                  <View style={{ height: '60%', width: 8, backgroundColor: theme.colors.primary, borderRadius: 2 }} />
                  <View style={{ height: '55%', width: 8, backgroundColor: '#81C784', borderRadius: 2 }} />
                  <View style={{ height: '80%', width: 8, backgroundColor: '#81C784', borderRadius: 2 }} />
                </View>
              </View>
              <Text style={{ fontSize: 11, color: theme.colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
                Worm graphs will render live dynamic vector nodes in the next iteration.
              </Text>
            </View>
          </View>
        );

      case 'info':
        return (
          <View style={styles.tabContentContainer}>
            {/* MATCH SPECIFICATION CARD */}
            <View style={[styles.rosterCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.textPrimary, marginBottom: 12 }]}>
                Match Details
              </Text>

              <View style={styles.detailsList}>
                <View style={[styles.detailRow, { borderColor: theme.colors.border }]}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Match Status</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.primary, fontWeight: '700' }]}>
                    {match.status.toUpperCase()}
                  </Text>
                </View>

                <View style={[styles.detailRow, { borderColor: theme.colors.border }]}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Venue</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                    📍 {match.venue || 'TBD'}
                  </Text>
                </View>

                <View style={[styles.detailRow, { borderColor: theme.colors.border }]}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Overs Limit</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                    {match.overs || 20} Overs
                  </Text>
                </View>

                <View style={[styles.detailRow, { borderColor: theme.colors.border }]}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Scheduled Date</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                    {match.scheduled_at ? new Date(match.scheduled_at).toLocaleDateString() : 'TBD'}
                  </Text>
                </View>

                <View style={[styles.detailRow, { borderColor: theme.colors.border }]}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Designated Scorer</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                    👤 {match.scorer?.user?.name || 'TBD'}
                  </Text>
                </View>

                <View style={[styles.detailRow, { borderColor: theme.colors.border }]}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Requested By</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                    {match.requester?.user?.name || 'TBD'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.surface }]} edges={['top', 'left', 'right']}>
      {/* 1. STICKY HEADER */}
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
        
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Live Match</Text>
          {!isCompleted && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveIndicatorText}>LIVE</Text>
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <TouchableOpacity style={styles.backButton} onPress={handleFollowToggle}>
            {isFollowing ? (
              <Bell color={theme.colors.primary} size={20} />
            ) : (
              <BellOff color={theme.colors.textSecondary} size={20} />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => {
            refetchMatch();
            refetch();
          }}>
            <RefreshCw color={theme.colors.primary} size={18} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. MATCH VERSUS HEADER */}
      <View style={[styles.matchHeaderCard, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.versusRow}>
          {/* Team A: Left align text */}
          <View style={styles.versusTeamLeft}>
            <Text style={[styles.versusTeamNameLeft, { color: '#FFFFFF' }]} numberOfLines={1}>
              {match.team_a.name}
            </Text>
          </View>
          
          <Text style={[styles.versusText, { color: '#E0E0E0' }]}>VS</Text>

          {/* Team B: Right align text */}
          <View style={styles.versusTeamRight}>
            <Text style={[styles.versusTeamNameRight, { color: '#FFFFFF' }]} numberOfLines={1}>
              {match.team_b.name}
            </Text>
          </View>
        </View>
        <Text style={[styles.matchMetaText, { color: '#E0E0E0', marginTop: 4 }]}>
          {match.overs || 20} Overs Match • {match.venue || 'TBD'}
        </Text>
      </View>

      {/* 3. BOTTOM NAVIGATION TABS */}
      <View style={{ borderBottomWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsNavContainer}
        >
          {(['summary', 'scorecard', 'commentary', 'stats', 'info'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                activeTab === tab && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 },
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  { color: activeTab === tab ? theme.colors.primary : theme.colors.textSecondary },
                  activeTab === tab && { fontWeight: '700' },
                ]}
              >
                {tab.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* MAIN CONTENT FEED */}
      <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {(isErrorLive || isErrorMatch) && (
          <View style={[styles.networkErrorBanner, { backgroundColor: '#FFF0F0', borderColor: '#FFD2D2' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <Info size={16} color="#D32F2F" />
              <Text style={[styles.networkErrorText, { color: '#D32F2F' }]} numberOfLines={1}>
                Connection lost. Showing cached data.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.retryPill, { backgroundColor: '#D32F2F' }]}
              onPress={() => {
                refetchMatch();
                refetch();
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>RETRY</Text>
            </TouchableOpacity>
          </View>
        )}

        {renderTabContent()}

        {!isCompleted && (
          <View style={styles.pollIndicatorNote}>
            <Clock size={14} color={theme.colors.textSecondary} />
            <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>
              Score updates automatically in real-time (polls every 5s).
            </Text>
          </View>
        )}
      </ScrollView>

      {/* MODAL 1: Innings Summary Bottom Sheet */}
      <Modal
        visible={scoreModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setScoreModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.drawerBackdrop}
          activeOpacity={1}
          onPress={() => setScoreModalVisible(false)}
        >
          <TouchableWithoutFeedback>
            <View style={[styles.drawerContentContainer, { backgroundColor: theme.colors.surface, paddingBottom: Math.max(24, insets.bottom + 12) }]}>
            <View style={styles.drawerDragHandle} />
            <Text style={[styles.drawerTitleText, { color: theme.colors.textPrimary }]}>
              Match Summary Details
            </Text>

            <View style={styles.detailsList}>
              <View style={[styles.detailRow, { borderColor: theme.colors.border }]}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Innings</Text>
                <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                  {liveData.current_innings === 1 ? '1st Innings' : '2nd Innings'}
                </Text>
              </View>

              {liveData.target && (
                <>
                  <View style={[styles.detailRow, { borderColor: theme.colors.border }]}>
                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Target Score</Text>
                    <Text style={[styles.detailValue, { color: theme.colors.textPrimary, fontWeight: '700' }]}>
                      {liveData.target}
                    </Text>
                  </View>

                  {(() => {
                    const chase = getChaseProgress();
                    if (!chase) return null;
                    return (
                      <>
                        <View style={[styles.detailRow, { borderColor: theme.colors.border }]}>
                          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Runs Needed</Text>
                          <Text style={[styles.detailValue, { color: theme.colors.primary, fontWeight: '700' }]}>
                            {chase.runsNeeded}
                          </Text>
                        </View>
                        <View style={[styles.detailRow, { borderColor: theme.colors.border }]}>
                          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Balls Remaining</Text>
                          <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                            {chase.ballsRemaining}
                          </Text>
                        </View>
                      </>
                    );
                  })()}
                </>
              )}

              <View style={[styles.detailRow, { borderColor: theme.colors.border }]}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Current Run Rate (CRR)</Text>
                <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                  {liveData.current_run_rate?.toFixed(2) || '0.00'}
                </Text>
              </View>

              {!!liveData.required_run_rate && (
                <View style={[styles.detailRow, { borderColor: theme.colors.border }]}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Required Run Rate (RRR)</Text>
                  <Text style={[styles.detailValue, { color: '#FFA500', fontWeight: '700' }]}>
                    {liveData.required_run_rate?.toFixed(2)}
                  </Text>
                </View>
              )}

              <View style={[styles.detailRow, { borderColor: theme.colors.border }]}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Extras</Text>
                <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                  {liveData.extras || '0 (w 0, nb 0, b 0, lb 0)'}
                </Text>
              </View>

              <View style={[styles.detailRow, { borderColor: theme.colors.border }]}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Active Partnership</Text>
                <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                  {getPartnershipRuns()} Runs
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.drawerCloseBtn, { borderColor: theme.colors.border }]}
              onPress={() => setScoreModalVisible(false)}
            >
              <Text style={{ color: theme.colors.textPrimary, fontWeight: '600', fontSize: 15 }}>Close</Text>
            </TouchableOpacity>
          </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

      {/* MODAL 2: Current Batters & Partnership Bottom Sheet */}
      <Modal
        visible={battersModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setBattersModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.drawerBackdrop}
          activeOpacity={1}
          onPress={() => setBattersModalVisible(false)}
        >
          <TouchableWithoutFeedback>
            <View style={[styles.drawerContentContainer, { backgroundColor: theme.colors.surface, paddingBottom: Math.max(24, insets.bottom + 12) }]}>
            <View style={styles.drawerDragHandle} />

            {/* Title + partnership runs */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={[styles.drawerTitleText, { color: theme.colors.textPrimary, marginBottom: 0 }]}>Partnership</Text>
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
                </View>
              </View>
            </View>

            {/* Divider */}
            <View style={{ height: 0.5, backgroundColor: theme.colors.border, marginVertical: 14 }} />

            {/* Innings Lineup Section Header */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setBattersListExpanded(!battersListExpanded)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Users size={15} color={theme.colors.primary} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.textPrimary }}>
                  Batting Order & Status
                </Text>
              </View>
              <Text style={{ fontSize: 11, color: theme.colors.primary, fontWeight: '700' }}>
                {battersListExpanded ? 'Collapse' : 'Expand'}
              </Text>
            </TouchableOpacity>

            {battersListExpanded && (
              <ScrollView
                style={{ maxHeight: 150, marginTop: 4 }}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{ gap: 6 }}
              >
                {battingPlayers.map((player, idx) => {
                  const stat = liveData.live_player_stats?.find((s: any) =>
                    player.player_id ? s.player_id === player.player_id : s.guest_name === player.guest_name
                  );
                  const status = stat?.status || 'not_batted';
                  const runs = stat?.runs || 0;
                  const balls = stat?.balls_faced || 0;

                  // Determine styling and badges based on status
                  let statusLabel = '';
                  let statusBg = 'transparent';
                  let statusColor = theme.colors.textSecondary;
                  let isBold = false;
                  let namePrefix = `${idx + 1}. `;

                  if (status === 'batting') {
                    const isStriker = strikerKey === getPlayerKey(player);
                    statusLabel = isStriker ? 'Batting *' : 'Batting';
                    statusBg = theme.colors.primary + '15';
                    statusColor = theme.colors.primary;
                    isBold = true;
                  } else if (status === 'out') {
                    const howOutText = stat?.how_out ? stat.how_out.replace('_', ' ') : 'out';
                    statusLabel = `Out (${howOutText})`;
                    statusBg = mode === 'dark' ? 'rgba(239, 83, 80, 0.15)' : '#FFCDD2';
                    statusColor = mode === 'dark' ? '#E57373' : '#C62828';
                  } else if (status === 'retired_hurt') {
                    statusLabel = 'Retired Hurt';
                    statusBg = mode === 'dark' ? 'rgba(255, 179, 0, 0.15)' : '#FFF9C4';
                    statusColor = mode === 'dark' ? '#FFB300' : '#F57F17';
                  } else if (status === 'retired_out') {
                    statusLabel = 'Retired Out';
                    statusBg = mode === 'dark' ? 'rgba(120, 144, 156, 0.15)' : '#CFD8DC';
                    statusColor = mode === 'dark' ? '#90A4AE' : '#37474F';
                  } else {
                    statusLabel = 'Yet to bat';
                    statusBg = mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F5F5F5';
                    statusColor = theme.colors.textSecondary;
                  }

                  return (
                    <View
                      key={getPlayerKey(player)}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 4,
                        paddingHorizontal: 6,
                        borderRadius: 4,
                        backgroundColor: status === 'batting' ? (mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)') : 'transparent',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12.5,
                          color: isBold ? theme.colors.textPrimary : theme.colors.textSecondary,
                          fontWeight: isBold ? '700' : '400',
                          flex: 1,
                        }}
                        numberOfLines={1}
                      >
                        {namePrefix}{player.name}
                      </Text>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {(status === 'batting' || status === 'out' || status === 'retired_hurt' || status === 'retired_out') && (
                          <Text style={{ fontSize: 12, fontWeight: isBold ? '700' : '500', color: theme.colors.textPrimary }}>
                            {runs} ({balls}b)
                          </Text>
                        )}
                        <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: statusBg }}>
                          <Text style={{ fontSize: 9.5, fontWeight: '700', color: statusColor, textTransform: 'capitalize' }}>
                            {statusLabel}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}

            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.drawerCloseBtn, { borderColor: theme.colors.border }]}
              onPress={() => setBattersModalVisible(false)}
            >
              <Text style={{ color: theme.colors.textPrimary, fontWeight: '600', fontSize: 15 }}>Close</Text>
            </TouchableOpacity>
          </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

      {/* MODAL 3: Bowler Details Bottom Sheet */}
      <Modal
        visible={bowlerModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setBowlerModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.drawerBackdrop}
          activeOpacity={1}
          onPress={() => setBowlerModalVisible(false)}
        >
          <TouchableWithoutFeedback>
            <View style={[styles.drawerContentContainer, { backgroundColor: theme.colors.surface, paddingBottom: Math.max(24, insets.bottom + 12) }]}>
            <View style={styles.drawerDragHandle} />
            <Text style={[styles.drawerTitleText, { color: theme.colors.textPrimary }]}>
              Bowling Performance Details
            </Text>

            <View style={styles.detailsList}>
              <View style={[styles.detailRow, { borderColor: theme.colors.border }]}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Bowler Name</Text>
                <Text style={[styles.detailValue, { color: theme.colors.textPrimary, fontWeight: '700' }]}>
                  {liveData.bowler?.name || 'No Bowler'}
                </Text>
              </View>
              <View style={[styles.detailRow, { borderColor: theme.colors.border }]}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Overs Bowled</Text>
                <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                  {liveData.bowler?.overs || '0.0'}
                </Text>
              </View>
              <View style={[styles.detailRow, { borderColor: theme.colors.border }]}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Runs Conceded</Text>
                <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                  {liveData.bowler?.runs_given || 0}
                </Text>
              </View>
              <View style={[styles.detailRow, { borderColor: theme.colors.border }]}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Wickets Taken</Text>
                <Text style={[styles.detailValue, { color: theme.colors.primary, fontWeight: '700' }]}>
                  {liveData.bowler?.wickets || 0}
                </Text>
              </View>
              <View style={[styles.detailRow, { borderColor: theme.colors.border }]}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Economy Rate</Text>
                <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                  {(() => {
                    const overs = parseFloat(liveData.bowler?.overs || '0');
                    if (overs === 0) return '0.00';
                    return (liveData.bowler?.runs_given / overs).toFixed(2);
                  })()}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.drawerCloseBtn, { borderColor: theme.colors.border }]}
              onPress={() => setBowlerModalVisible(false)}
            >
              <Text style={{ color: theme.colors.textPrimary, fontWeight: '600', fontSize: 15 }}>Close</Text>
            </TouchableOpacity>
          </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

      {/* MODAL 4: Over Details Bottom Sheet */}
      <Modal
        visible={overModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setOverModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.drawerBackdrop}
          activeOpacity={1}
          onPress={() => setOverModalVisible(false)}
        >
          <TouchableWithoutFeedback>
            <View style={[styles.drawerContentContainer, { backgroundColor: theme.colors.surface, paddingBottom: Math.max(24, insets.bottom + 12) }]}>
            <View style={styles.drawerDragHandle} />
            <Text style={[styles.drawerTitleText, { color: theme.colors.textPrimary }]}>
              Over Ball-by-Ball Summary
            </Text>

            <View style={styles.detailsList}>
              {liveData.this_over && liveData.this_over.length > 0 ? (
                liveData.this_over.map((ball: any, idx: number) => (
                  <View key={idx} style={[styles.commentaryRow, { borderColor: theme.colors.border }]}>
                    <View style={[styles.commentaryBallBadge, { backgroundColor: getBallBadgeColor(ball), borderColor: getBallBorderColor(ball) }]}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: getBallTextColor(ball) }}>
                        {formatOverBallSymbol(ball)}
                      </Text>
                    </View>
                    <View style={styles.commentaryContent}>
                      <Text style={[styles.commentaryText, { color: theme.colors.textPrimary }]}>
                        {ball.is_wicket && ball.wicket_type !== 'retired_hurt'
                          ? `Dismissal: Wicket falls!`
                          : ball.wicket_type === 'retired_hurt'
                            ? `Batsman Retired Hurt`
                            : `Delivery: ${ball.runs || 0} run(s) scored.`}
                      </Text>
                      {ball.extra_type && (
                        <Text style={{ fontSize: 11, color: '#A07800', marginTop: 2 }}>
                          Extra: {ball.extra_type.toUpperCase()} ({ball.extra_runs || 0} runs)
                        </Text>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <Text style={{ textAlign: 'center', paddingVertical: 20, color: theme.colors.textSecondary }}>
                  No ball events recorded in this over.
                </Text>
              )}
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.drawerCloseBtn, { borderColor: theme.colors.border }]}
              onPress={() => setOverModalVisible(false)}
            >
              <Text style={{ color: theme.colors.textPrimary, fontWeight: '600', fontSize: 15 }}>Close</Text>
            </TouchableOpacity>
          </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

      {/* FLOATING TOAST ALERT SYSTEM */}
      {!!alertMessage && (
        <View style={[styles.toastAlert, { backgroundColor: '#EBFBEF', borderColor: '#C8E6C9' }]}>
          <Text style={[styles.toastText, { color: '#2E7D32' }]}>{alertMessage}</Text>
        </View>
      )}
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
  retryBtn: {
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderRadius: 4,
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    borderColor: '#FFD2D2',
    borderWidth: 0.5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D32F2F',
  },
  liveIndicatorText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D32F2F',
  },
  matchHeaderCard: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  versusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  versusTeamLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    gap: 4,
  },
  versusTeamRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
    gap: 4,
  },
  teamAvatarPlaceholder: {
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
  },
  versusTeamNameLeft: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  versusTeamNameRight: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'left',
    flex: 1,
  },
  versusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    paddingHorizontal: 4,
  },
  matchMetaText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  tabsNavContainer: {
    flexDirection: 'row',
    height: 38,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tabButton: {
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  tabButtonText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 8,
    gap: 8,
    paddingBottom: 16,
  },
  tabContentContainer: {
    gap: 6,
  },
  heroScoreCard: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.01,
    shadowRadius: 1,
    elevation: 0,
    gap: 4,
  },
  heroScoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroInningsLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  interactiveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  interactiveText: {
    fontSize: 11,
  },
  heroScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  heroScoreText: {
    fontSize: 28,
    fontWeight: '800',
  },
  heroOversText: {
    fontSize: 15,
    fontWeight: '600',
  },
  heroFooterRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  heroMetaText: {
    fontSize: 12,
    fontWeight: '700',
  },
  situationCard: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  situationText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
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
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  segmentContainer: {
    flexDirection: 'row',
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    overflow: 'hidden',
  },
  segmentButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
  },
  battersGridHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 8,
  },
  bowlerGridHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 8,
  },
  gridColLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  colName: {
    flex: 2.2,
  },
  colDismissal: {
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
    paddingVertical: 5,
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
    paddingVertical: 5,
    alignItems: 'center',
  },
  thisOverContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  overBallCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  ballsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  ballBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ballText: {
    fontSize: 10,
    fontWeight: '700',
  },
  overTotalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 12,
  },
  overTotalText: {
    fontSize: 11,
    fontWeight: '700',
  },
  fowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  completionCard: {
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  completionTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  completionWinnerText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  fullScorecardBtn: {
    width: '100%',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  placeholderContainer: {
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  placeholderTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 4,
  },
  placeholderDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  pollIndicatorNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    marginTop: 12,
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
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  detailsList: {
    gap: 2,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  commentaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  commentaryBallBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  commentaryContent: {
    flex: 1,
  },
  commentaryText: {
    fontSize: 13,
    lineHeight: 18,
  },
  drawerCloseBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    height: 48,
    borderRadius: 6,
    marginTop: 8,
  },
  networkErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
  },
  networkErrorText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  retryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastAlert: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  timelineConnector: {
    position: 'absolute',
    left: 24,
    top: 28,
    bottom: -12,
    width: 2,
    zIndex: 1,
  },
});

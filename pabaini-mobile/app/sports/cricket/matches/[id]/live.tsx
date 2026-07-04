import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Clock, RefreshCw, Trophy } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../../../src/context/ThemeContext';
import { useMatchDetail, useLiveMatch } from '../../../../../src/hooks/useMatches';

export default function LiveViewerScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = Number(id);
  const insets = useSafeAreaInsets();

  const [partnershipModalVisible, setPartnershipModalVisible] = useState(false);

  // Queries (Poll live details every 5 seconds)
  const { data: match, isLoading: isLoadingMatch } = useMatchDetail(matchId);
  const { data: liveData, isLoading: isLoadingLive, refetch } = useLiveMatch(matchId, 5000);

  const isLoading = isLoadingMatch || (isLoadingLive && !liveData);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.surface }]}>
        <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
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
            onPress={() => refetch()}
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
    if (ball.is_wicket) return 'W';
    if (ball.extra_type === 'wide') return `${ball.runs || ''}wd`;
    if (ball.extra_type === 'no_ball') return `${ball.runs || ''}nb`;
    if (ball.extra_type === 'bye') return `${ball.runs || ''}B`;
    if (ball.extra_type === 'leg_bye') return `${ball.runs || ''}LB`;
    if (ball.runs === 0) return '•';
    return String(ball.runs);
  };

  const getBallBadgeColor = (ball: any) => {
    if (ball.is_wicket) return '#FFEBEB';
    if (ball.extra_type) return '#FFF8DC';
    if (ball.runs === 4 || ball.runs === 6) return '#EBFBEF';
    return '#F5F5F5';
  };

  const getBallTextColor = (ball: any) => {
    if (ball.is_wicket) return '#D32F2F';
    if (ball.extra_type) return '#A07800';
    if (ball.runs === 4 || ball.runs === 6) return '#2E7D32';
    return '#616161';
  };

  const getBallBorderColor = (ball: any) => {
    if (ball.is_wicket) return '#FFCDD2';
    if (ball.extra_type) return '#FFE082';
    if (ball.runs === 4 || ball.runs === 6) return '#C8E6C9';
    return '#BDBDBD'; // clearly visible border for normal/dot balls
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
      // Sort to get the last wicket fall
      const sortedFow = [...currentInningsFow].sort((a, b) => b.score_at_wicket - a.score_at_wicket);
      const lastWicket = sortedFow[0];
      return Math.max(0, currentRuns - lastWicket.score_at_wicket);
    }
    
    return currentRuns;
  };

  const currentBattingTeamId = liveData?.current_innings === 1
    ? match?.innings_1_batting_team_id
    : (match?.innings_1_batting_team_id === match?.team_a_id ? match?.team_b_id : match?.team_a_id);

  const battingTeamName = currentBattingTeamId === match?.team_a_id
    ? match?.team_a?.name
    : match?.team_b?.name;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.surface }]} edges={['top', 'left', 'right']}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace(`/sports/cricket/matches/${matchId}`)}>
          <ArrowLeft color={theme.colors.textPrimary} size={24} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Live Match Feed</Text>
          {!isCompleted && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveIndicatorText}>LIVE</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.backButton} onPress={() => refetch()}>
          <RefreshCw color={theme.colors.primary} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Match Versus Banner */}
        <View style={[styles.versusCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.md }]}>
          <View style={styles.versusRow}>
            <View style={styles.versusTeam}>
              <Text style={[styles.versusTeamName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                {match.team_a.name}
              </Text>
              {match.status === 'completed' && match.winner_team_id === match.team_a_id && (
                <Trophy size={16} color="#D4A700" style={{ marginTop: 4 }} />
              )}
            </View>
            <Text style={[styles.versusText, { color: theme.colors.textSecondary }]}>VS</Text>
            <View style={styles.versusTeam}>
              <Text style={[styles.versusTeamName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                {match.team_b.name}
              </Text>
              {match.status === 'completed' && match.winner_team_id === match.team_b_id && (
                <Trophy size={16} color="#D4A700" style={{ marginTop: 4 }} />
              )}
            </View>
          </View>
        </View>

        {/* Score Panel */}
        <LinearGradient
          colors={['#0E331B', '#071A0E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.scoreCard, { borderColor: theme.colors.border }]}
        >
          <View style={styles.scoreHeader}>
            <Text style={styles.inningsLabel}>
              {isCompleted ? 'MATCH COMPLETED' : (
                <>
                  {battingTeamName ? `${battingTeamName.toUpperCase()} · ` : ''}
                  {liveData.current_innings === 1 ? '1ST INNINGS' : '2ND INNINGS'}
                </>
              )}
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

        {/* Active Batsmen & Bowler Cards */}
        {!isCompleted && (
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

            <View style={[styles.playerTile, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
              <Text style={[styles.playerLabel, { color: theme.colors.textPrimary }]}>
                🔴 Bowler: <Text style={{ fontWeight: '700' }}>{liveData.bowler?.name || 'Select Bowler'}</Text>
              </Text>
              <Text style={[styles.playerStatText, { color: theme.colors.textSecondary }]}>
                {liveData.bowler?.wickets || 0} - {liveData.bowler?.runs_given || 0} ({liveData.bowler?.overs || '0'} ov)
              </Text>
            </View>
          </View>
        )}

        {/* This Over Tracker */}
        {!isCompleted && (
          <View style={styles.trackerSection}>
            <View style={styles.trackerTitleRow}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>This Over</Text>
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
                <Text style={{ color: theme.colors.textSecondary, fontStyle: 'italic', fontSize: 13 }}>
                  Starting new over...
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Completion summary layout */}
        {isCompleted && (
          <View style={[styles.completionSummaryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.md }]}>
            <Trophy size={48} color="#D4A700" style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={[styles.completionTitle, { color: theme.colors.textPrimary }]}>Match Finished</Text>
            
            {match.winner_team && (
              <Text style={[styles.completionWinnerText, { color: theme.colors.primary }]}>
                🎉 Winner: {match.winner_team.name}
              </Text>
            )}
            
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.scorecardLinkBtn, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm }]}
              onPress={() => router.replace(`/sports/cricket/matches/${matchId}`)}
            >
              <Text style={{ color: theme.colors.onPrimary, fontWeight: '700' }}>View Full Scorecard</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Automatic updates indicator note */}
        {!isCompleted && (
          <View style={styles.pollIndicatorNote}>
            <Clock size={16} color={theme.colors.textSecondary} />
            <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
              Score updates automatically in real-time (polls every 5s).
            </Text>
          </View>
        )}
      </ScrollView>

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
    backgroundColor: '#FFEBEB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
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
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  versusCard: {
    padding: 16,
    borderWidth: 1,
  },
  versusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  versusTeam: {
    flex: 1,
    alignItems: 'center',
  },
  versusTeamName: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  versusText: {
    fontSize: 14,
    fontWeight: '800',
    fontStyle: 'italic',
    paddingHorizontal: 12,
  },
  scoreCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
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
    fontSize: 40,
    fontWeight: '800',
  },
  oversText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#CCC',
  },
  runRateRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
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
    gap: 10,
  },
  playerTile: {
    padding: 14,
    borderWidth: 1,
    borderRadius: 10,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
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
  trackerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    paddingVertical: 4,
  },
  ballBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ballText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pollIndicatorNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    marginTop: 12,
  },
  completionSummaryCard: {
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
  scorecardLinkBtn: {
    width: '100%',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
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

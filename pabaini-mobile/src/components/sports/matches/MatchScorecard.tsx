import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Trophy, Award, ChevronDown, ChevronUp, Clock } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { CricketMatch, MatchPlayerStat } from '../../../types/sports.types';
import { Avatar } from '../../ui/Avatar';
import { getTeamColor } from '../teams/TeamCard';

interface LineupPlayer {
  id: number;
  batting_order: number;
  player_id: number | null;
  guest_name: string | null;
  name: string;
  avatar_url: string | null;
}

interface LineupData {
  team_a: {
    lineup_set: boolean;
    players: LineupPlayer[];
  };
  team_b: {
    lineup_set: boolean;
    players: LineupPlayer[];
  };
}

interface MatchScorecardProps {
  match: CricketMatch;
  lineups?: LineupData | null;
}

const parseScore = (scoreStr: string | null) => {
  if (!scoreStr) return { runs: 0, wickets: 0, overs: 0 };
  const match = scoreStr.match(/^(\d+)[-/](\d+)(?:\s*\((\d+(?:\.\d+)?)\))?/);
  if (match) {
    return {
      runs: parseInt(match[1], 10) || 0,
      wickets: parseInt(match[2], 10) || 0,
      overs: parseFloat(match[3]) || 0,
    };
  }
  return { runs: 0, wickets: 0, overs: 0 };
};

export function MatchScorecard({ match, lineups }: MatchScorecardProps) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'scorecard' | 'overs'>('scorecard');
  const [expandedTeams, setExpandedTeams] = useState<Record<number, boolean>>({
    [match.team_a_id]: true,
    [match.team_b_id]: true,
  });

  const toggleTeamExpand = (teamId: number) => {
    setExpandedTeams((prev) => ({
      ...prev,
      [teamId]: !prev[teamId],
    }));
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  };

  // True Economy Rate Calculation: (runs_given * 6) / total_balls
  const calculateEconomyRate = (runsGiven: number, oversBowled: number): string => {
    if (oversBowled <= 0) return '0.00';
    const overStr = oversBowled.toFixed(1);
    const parts = overStr.split('.');
    const wholeOvers = parseInt(parts[0], 10) || 0;
    const balls = parseInt(parts[1], 10) || 0;
    
    const totalBalls = wholeOvers * 6 + balls;
    if (totalBalls <= 0) return '0.00';
    
    const er = (runsGiven * 6) / totalBalls;
    return er.toFixed(2);
  };

  // Sort batsmen based on lineup declared batting order (1 to 11)
  const getSortedBatsmen = (
    battingStats: MatchPlayerStat[],
    lineupPlayers?: LineupPlayer[]
  ) => {
    const activeBatsmen = battingStats.filter(
      (s) => s.runs > 0 || s.balls_faced > 0 || s.how_out || s.is_not_out
    );

    if (!lineupPlayers || lineupPlayers.length === 0) {
      return activeBatsmen;
    }

    return [...activeBatsmen].sort((a, b) => {
      const orderA = lineupPlayers.find((p) => {
        if (a.player_id && p.player_id) return a.player_id === p.player_id;
        if (!a.player_id && !p.player_id && a.guest_name && p.guest_name) {
          return a.guest_name.toLowerCase() === p.guest_name.toLowerCase();
        }
        return false;
      })?.batting_order ?? 999;

      const orderB = lineupPlayers.find((p) => {
        if (b.player_id && p.player_id) return b.player_id === p.player_id;
        if (!b.player_id && !p.player_id && b.guest_name && p.guest_name) {
          return b.guest_name.toLowerCase() === p.guest_name.toLowerCase();
        }
        return false;
      })?.batting_order ?? 999;

      return orderA - orderB;
    });
  };

  // Sum extras conceded by opposing bowlers
  const sumOpponentExtras = (
    opposingBowlerStats: MatchPlayerStat[],
    byes: number = 0,
    legByes: number = 0
  ) => {
    let wides = 0;
    let noBalls = 0;
    opposingBowlerStats.forEach((b) => {
      if (b.overs_bowled > 0) {
        wides += b.wides || 0;
        noBalls += b.no_balls || 0;
      }
    });
    return {
      wides,
      noBalls,
      byes,
      legByes,
      total: wides + noBalls + byes + legByes,
    };
  };

  // Setup data
  const stats = match.player_stats || [];
  const teamAStats = stats.filter((s) => s.team_id === match.team_a_id);
  const teamBStats = stats.filter((s) => s.team_id === match.team_b_id);

  const getWinnerMessage = () => {
    if (match.is_tie || (!match.winner_team_id && match.status === 'completed')) {
      return 'Match Tied';
    }
    const winner = match.winner_team?.name || 
      (match.winner_team_id === match.team_a_id ? match.team_a.name : 
       match.winner_team_id === match.team_b_id ? match.team_b.name : null);
    
    if (!winner) return null;

    const scoreA = parseScore(match.team_a_score);
    const scoreB = parseScore(match.team_b_score);

    if (match.batting_first_team_id) {
      const firstBattingId = match.batting_first_team_id;
      const secondBattingId = firstBattingId === match.team_a_id ? match.team_b_id : match.team_a_id;
      
      const scoreFirst = firstBattingId === match.team_a_id ? scoreA : scoreB;
      const scoreSecond = firstBattingId === match.team_a_id ? scoreB : scoreA;
      
      if (match.winner_team_id === firstBattingId) {
        const runsDiff = scoreFirst.runs - scoreSecond.runs;
        if (runsDiff > 0) {
          return `${winner} won by ${runsDiff} run${runsDiff > 1 ? 's' : ''}`;
        }
      } else if (match.winner_team_id === secondBattingId) {
        const storedMaxWickets = match.winner_team_id === match.team_a_id
          ? match.team_a_max_wickets
          : match.team_b_max_wickets;
        const lineupCount = match.winner_team_id === match.team_a_id 
          ? lineups?.team_a?.players?.length 
          : lineups?.team_b?.players?.length;
        const maxWickets = storedMaxWickets ?? (lineupCount && lineupCount > 1 ? lineupCount - 1 : 10);
        const wicketsDiff = maxWickets - scoreSecond.wickets;
        if (wicketsDiff > 0) {
          return `${winner} won by ${wicketsDiff} wicket${wicketsDiff > 1 ? 's' : ''}`;
        }
      }
    } else {
      // Fallback when batting_first_team_id is not set
      const runsDiff = Math.abs(scoreA.runs - scoreB.runs);
      if (runsDiff > 0) {
        return `${winner} won by ${runsDiff} run${runsDiff > 1 ? 's' : ''}`;
      }
    }

    return `${winner} won`;
  };

  const hasManOfMatch = !!(match.man_of_match || match.man_of_match_guest_name);
  const momName = match.man_of_match?.user?.name || match.man_of_match_guest_name;
  const momAvatar = match.man_of_match?.user?.avatar_url;

  const renderTeamSection = (
    team: typeof match.team_a,
    battingStats: MatchPlayerStat[],
    bowlingStats: MatchPlayerStat[],
    score: string | null,
    lineupPlayers?: LineupPlayer[]
  ) => {
    const isExpanded = !!expandedTeams[team.id];
    const sortedBatsmen = getSortedBatsmen(battingStats, lineupPlayers);
    const activeBowlers = bowlingStats.filter((s) => s.overs_bowled > 0);

    const isTeamA = team.id === match.team_a_id;
    const battingFirstId = match.batting_first_team_id;
    
    let inningsNum = isTeamA ? 1 : 2;
    if (battingFirstId) {
      if (isTeamA) {
        inningsNum = battingFirstId === match.team_a_id ? 1 : 2;
      } else {
        inningsNum = battingFirstId === match.team_b_id ? 1 : 2;
      }
    }

    const byes = inningsNum === 1 ? (match.innings_1_byes || 0) : (match.innings_2_byes || 0);
    const legByes = inningsNum === 1 ? (match.innings_1_leg_byes || 0) : (match.innings_2_leg_byes || 0);

    const extras = sumOpponentExtras(bowlingStats, byes, legByes); // Opponent bowlers' stats concede extras
    const teamFow = match.fall_of_wickets?.filter((f) => f.innings === inningsNum) || [];
    const teamColor = getTeamColor(team.name);
    const initials = getInitials(team.name);

    return (
      <View style={[styles.teamCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]} key={team.id}>
        {/* Section Header Row */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.teamHeader, { backgroundColor: theme.colors.primary }]}
          onPress={() => toggleTeamExpand(team.id)}
        >
          <View style={styles.teamHeaderLeft}>
            {team.logo_url ? (
              <Image source={{ uri: team.logo_url }} style={styles.teamLogoSmall} />
            ) : (
              <View style={[styles.teamInitialsSmall, { backgroundColor: theme.colors.surface + '20' }]}>
                <Text style={styles.teamInitialsTextSmall}>{initials}</Text>
              </View>
            )}
            <Text style={styles.teamNameText} numberOfLines={1}>
              {team.name}
            </Text>
          </View>
          <View style={styles.teamHeaderRight}>
            <Text style={styles.teamScoreText}>{score || '0-0 (0.0)'}</Text>
            {isExpanded ? (
              <ChevronUp size={20} color="#FFFFFF" />
            ) : (
              <ChevronDown size={20} color="#FFFFFF" />
            )}
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.teamCardContent}>
            {/* Batsmen Table */}
            <View style={styles.table}>
              <View style={[styles.tableHeader, { backgroundColor: theme.colors.border + '25' }]}>
                <Text style={[styles.th, styles.colLeft, { color: theme.colors.textSecondary, flex: 3.5 }]}>Batsman</Text>
                <Text style={[styles.th, styles.colRight, { color: theme.colors.textSecondary, flex: 0.9 }]}>R</Text>
                <Text style={[styles.th, styles.colRight, { color: theme.colors.textSecondary, flex: 0.9 }]}>B</Text>
                <Text style={[styles.th, styles.colRight, { color: theme.colors.textSecondary, flex: 0.8 }]}>4s</Text>
                <Text style={[styles.th, styles.colRight, { color: theme.colors.textSecondary, flex: 0.8 }]}>6s</Text>
                <Text style={[styles.th, styles.colRight, { color: theme.colors.textSecondary, flex: 1.4, fontSize: 10 }]}>SR</Text>
              </View>
              {sortedBatsmen.length === 0 ? (
                <View style={styles.emptyRow}>
                  <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No batting statistics recorded</Text>
                </View>
              ) : (
                sortedBatsmen.map((player, index) => {
                  const strikeRate = player.balls_faced > 0 
                    ? ((player.runs / player.balls_faced) * 100).toFixed(2) 
                    : '0.00';
                  const displayName = player.name || player.guest_name || 'Guest';

                  let dismissalText = 'Not Out';
                  if (!player.is_not_out) {
                    if (player.how_out) {
                      dismissalText = player.how_out.replace(/_/g, ' ');
                      dismissalText = dismissalText.charAt(0).toUpperCase() + dismissalText.slice(1);
                    } else {
                      dismissalText = 'Out';
                    }
                  }

                  const isAlt = index % 2 === 1;

                  return (
                    <View
                      key={player.id || index}
                      style={[
                        styles.tableRow,
                        { 
                          backgroundColor: isAlt ? theme.colors.background : 'transparent',
                          borderBottomColor: theme.colors.border,
                        }
                      ]}
                    >
                      <View style={[styles.colLeft, { flex: 3.5 }]}>
                        <Text style={[styles.playerNameText, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                          {displayName}
                        </Text>
                        <Text style={[styles.dismissalText, { color: theme.colors.textSecondary }]}>
                          {dismissalText}
                        </Text>
                      </View>
                      <Text style={[styles.td, styles.colRight, { color: theme.colors.textPrimary, flex: 0.9, fontWeight: '700' }]}>{player.runs}</Text>
                      <Text style={[styles.td, styles.colRight, { color: theme.colors.textSecondary, flex: 0.9 }]}>{player.balls_faced}</Text>
                      <Text style={[styles.td, styles.colRight, { color: theme.colors.textSecondary, flex: 0.8 }]}>{player.fours}</Text>
                      <Text style={[styles.td, styles.colRight, { color: theme.colors.textSecondary, flex: 0.8 }]}>{player.sixes}</Text>
                      <Text style={[styles.td, styles.colRight, { color: theme.colors.textPrimary, flex: 1.4, fontSize: 11 }]}>{strikeRate}</Text>
                    </View>
                  );
                })
              )}
            </View>

            {/* Bowlers Table */}
            <View style={[styles.table, { marginTop: 16 }]}>
              <View style={[styles.tableHeader, { backgroundColor: theme.colors.border + '25' }]}>
                <Text style={[styles.th, styles.colLeft, { color: theme.colors.textSecondary, flex: 3.5 }]}>Bowler</Text>
                <Text style={[styles.th, styles.colRight, { color: theme.colors.textSecondary, flex: 0.9 }]}>O</Text>
                <Text style={[styles.th, styles.colRight, { color: theme.colors.textSecondary, flex: 0.9 }]}>M</Text>
                <Text style={[styles.th, styles.colRight, { color: theme.colors.textSecondary, flex: 0.9 }]}>R</Text>
                <Text style={[styles.th, styles.colRight, { color: theme.colors.textSecondary, flex: 0.9 }]}>W</Text>
                <Text style={[styles.th, styles.colRight, { color: theme.colors.textSecondary, flex: 1.4, fontSize: 10 }]}>ER</Text>
              </View>
              {activeBowlers.length === 0 ? (
                <View style={styles.emptyRow}>
                  <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No bowling statistics recorded</Text>
                </View>
              ) : (
                activeBowlers.map((player, index) => {
                  const er = calculateEconomyRate(player.runs_given, player.overs_bowled);
                  const displayName = player.name || player.guest_name || 'Guest';
                  const isAlt = index % 2 === 1;

                  return (
                    <View
                      key={player.id || index}
                      style={[
                        styles.tableRow,
                        { 
                          backgroundColor: isAlt ? theme.colors.background : 'transparent',
                          borderBottomColor: theme.colors.border,
                        }
                      ]}
                    >
                      <View style={[styles.colLeft, { flex: 3.5 }]}>
                        <Text style={[styles.playerNameText, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                          {displayName}
                        </Text>
                      </View>
                      <Text style={[styles.td, styles.colRight, { color: theme.colors.textPrimary, flex: 0.9 }]}>
                        {player.overs_bowled.toFixed(1)}
                      </Text>
                      <Text style={[styles.td, styles.colRight, { color: theme.colors.textSecondary, flex: 0.9 }]}>
                        {player.maidens || 0}
                      </Text>
                      <Text style={[styles.td, styles.colRight, { color: theme.colors.textSecondary, flex: 0.9 }]}>{player.runs_given}</Text>
                      <Text style={[styles.td, styles.colRight, { color: theme.colors.textPrimary, flex: 0.9, fontWeight: '700' }]}>{player.wickets}</Text>
                      <Text style={[styles.td, styles.colRight, { color: theme.colors.textPrimary, flex: 1.4, fontSize: 11 }]}>{er}</Text>
                    </View>
                  );
                })
              )}
            </View>

            {/* Extras Row */}
            <View style={[styles.extrasContainer, { borderTopColor: theme.colors.border }]}>
              <Text style={[styles.extrasText, { color: theme.colors.textPrimary }]}>
                Total extras: <Text style={{ fontWeight: '700' }}>{extras.total}</Text>    WD {extras.wides}, NB {extras.noBalls}, Bye {extras.byes}, LBye {extras.legByes}
              </Text>
            </View>

            {/* Fall of Wickets Section */}
            <View style={[styles.fowContainer, { borderTopColor: theme.colors.border }]}>
              <View style={styles.fowHeader}>
                <Text style={[styles.fowHeaderTitle, { color: theme.colors.textSecondary, flex: 3.5, textAlign: 'left' }]}>Fall of wickets</Text>
                <Text style={[styles.fowHeaderTitle, { color: theme.colors.textSecondary, flex: 1.5, textAlign: 'right' }]}>Score</Text>
                <Text style={[styles.fowHeaderTitle, { color: theme.colors.textSecondary, flex: 1, textAlign: 'right' }]}>Over</Text>
              </View>
              {teamFow.length === 0 ? (
                <View style={styles.fowRow}>
                  <Text style={[styles.fowText, { color: theme.colors.textSecondary, flex: 1, textAlign: 'left', fontStyle: 'italic' }]}>
                    {match.scoring_mode === 'simple' ? 'Fall of wickets data not available' : 'No wickets fell'}
                  </Text>
                </View>
              ) : (
                teamFow.map((f, idx) => (
                  <View key={idx} style={styles.fowRow}>
                    <Text style={[styles.fowText, { color: theme.colors.textPrimary, flex: 3.5, textAlign: 'left' }]} numberOfLines={1}>
                      {f.player_name} ({f.wicket_type.replace(/_/g, ' ')})
                    </Text>
                    <Text style={[styles.fowText, { color: theme.colors.textPrimary, flex: 1.5, textAlign: 'right', fontWeight: '600' }]}>
                      {f.score_at_wicket}
                    </Text>
                    <Text style={[styles.fowText, { color: theme.colors.textSecondary, flex: 1, textAlign: 'right' }]}>
                      {f.over}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Tab bar */}
      <View style={[styles.tabBar, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'scorecard' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('scorecard')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'scorecard' ? theme.colors.primary : theme.colors.textSecondary },
              activeTab === 'scorecard' && { fontWeight: '700' },
            ]}
          >
            Score card
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'overs' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('overs')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'overs' ? theme.colors.primary : theme.colors.textSecondary },
              activeTab === 'overs' && { fontWeight: '700' },
            ]}
          >
            Overs
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'overs' ? (
        <View style={[styles.placeholderCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Clock size={36} color={theme.colors.textSecondary} style={{ marginBottom: 8 }} />
          <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
            Overs view coming soon
          </Text>
        </View>
      ) : (
        <View style={styles.scorecardBody}>
          {/* Winner Banner */}
          {getWinnerMessage() ? (
            <View style={[styles.winnerBanner, { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary }]}>
              <Trophy size={18} color="#D4A700" />
              <Text style={[styles.winnerBannerText, { color: theme.colors.textPrimary }]}>
                {getWinnerMessage()}
              </Text>
            </View>
          ) : null}

          {/* Man of the Match Row */}
          {hasManOfMatch && (
            <View style={[styles.momCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Avatar uri={momAvatar} size={32} name={momName || '?'} />
              <View style={styles.momInfo}>
                <Text style={[styles.momTitle, { color: theme.colors.textPrimary }]}>
                  {momName}
                </Text>
                <Text style={[styles.momLabel, { color: theme.colors.textSecondary }]}>
                  Player of the Match
                </Text>
              </View>
              <Award size={20} color={theme.colors.primary} style={styles.momBadge} />
            </View>
          )}

          {/* Collapsible team card 1 - Team A batting */}
          {renderTeamSection(
            match.team_a,
            teamAStats, // Team A's player stats contains their batting stats
            teamBStats, // Team B's player stats contains Team B's bowling stats (who bowled in Team A's innings)
            match.team_a_score,
            lineups?.team_a?.players
          )}

          {/* Collapsible team card 2 - Team B batting */}
          {renderTeamSection(
            match.team_b,
            teamBStats, // Team B's player stats contains their batting stats
            teamAStats, // Team A's player stats contains Team A's bowling stats (who bowled in Team B's innings)
            match.team_b_score,
            lineups?.team_b?.players
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  placeholderCard: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scorecardBody: {
    gap: 12,
  },
  winnerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    gap: 8,
    marginBottom: 4,
  },
  winnerBannerText: {
    fontSize: 14,
    fontWeight: '700',
  },
  momCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 4,
  },
  momInfo: {
    flex: 1,
    marginLeft: 12,
  },
  momTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  momLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  momBadge: {
    marginLeft: 8,
  },
  teamCard: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  teamHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  teamLogoSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    resizeMode: 'cover',
  },
  teamInitialsSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  teamInitialsTextSmall: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  teamNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  teamHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamScoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  teamCardContent: {
    paddingBottom: 8,
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  th: {
    fontSize: 11,
    fontWeight: '600',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    alignItems: 'center',
  },
  td: {
    fontSize: 12,
  },
  colLeft: {
    textAlign: 'left',
    justifyContent: 'center',
  },
  colRight: {
    textAlign: 'right',
  },
  playerNameText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dismissalText: {
    fontSize: 10,
    marginTop: 2,
  },
  emptyRow: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  extrasContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 0.5,
  },
  extrasText: {
    fontSize: 11,
  },
  fowContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 0.5,
  },
  fowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fowHeaderTitle: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  fowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  fowText: {
    fontSize: 11,
  },
});

import { CricketMatch, MatchPlayerStat } from '../../../../types/sports.types';

// ==========================================
// DATA DISPLAY MODELS (Pure presentational)
// ==========================================

export interface HighlightCardData {
  matchTitle: string;
  matchMeta: string;
  teamAName: string;
  teamBName: string;
  teamAScore: string;
  teamBScore: string;
  winnerMessage: string | null;
  hasManOfMatch: boolean;
  momName: string | null;
  momAvatar: string | null;
  topBatsmanA: {
    name: string;
    teamName: string;
    avatarUrl: string | null;
    runs: number;
    balls: number;
  } | null;
  topBatsmanB: {
    name: string;
    teamName: string;
    avatarUrl: string | null;
    runs: number;
    balls: number;
  } | null;
  topBowlerA: {
    name: string;
    teamName: string;
    avatarUrl: string | null;
    wickets: number;
    runsGiven: number;
    overs: number;
  } | null;
  topBowlerB: {
    name: string;
    teamName: string;
    avatarUrl: string | null;
    wickets: number;
    runsGiven: number;
    overs: number;
  } | null;
}

export interface TeamScorecardCardData {
  matchTitle: string;
  teamSubtitle: string;
  teamName: string;
  scoreStr: string;
  batsmen: Array<{
    name: string;
    dismissal: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    strikeRate: string;
  }>;
  bowlers: Array<{
    name: string;
    overs: string;
    maidens: number;
    runsGiven: number;
    wickets: number;
    economyRate: string;
  }>;
  extras: {
    total: number;
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
  };
}

export interface FullScorecardCardData {
  teamAData: TeamScorecardCardData;
  teamBData: TeamScorecardCardData;
}

// ==========================================
// CORE HELPERS / MAPPER CALCULATIONS
// ==========================================

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

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

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

// ==========================================
// MAPPER EXPORTS
// ==========================================

export function mapMatchToHighlightData(match: CricketMatch): HighlightCardData {
  const stats = match.player_stats || [];
  const teamAStats = stats.filter((s) => s.team_id === match.team_a_id);
  const teamBStats = stats.filter((s) => s.team_id === match.team_b_id);

  // Top performers lookup
  const getTopBatsman = (teamStats: MatchPlayerStat[]) => {
    const active = teamStats.filter((s) => s.runs > 0 || s.balls_faced > 0);
    if (active.length === 0) return null;
    return active.reduce((top, p) => (p.runs > top.runs ? p : top), active[0]);
  };

  const getTopBowler = (teamStats: MatchPlayerStat[]) => {
    const active = teamStats.filter((s) => s.overs_bowled > 0);
    if (active.length === 0) return null;
    return active.reduce((top, p) => {
      if (p.wickets > top.wickets) return p;
      if (p.wickets === top.wickets) {
        return p.runs_given < top.runs_given ? p : top;
      }
      return top;
    }, active[0]);
  };

  const topBatsmanA = getTopBatsman(teamAStats);
  const topBatsmanB = getTopBatsman(teamBStats);
  const topBowlerA = getTopBowler(teamAStats);
  const topBowlerB = getTopBowler(teamBStats);

  // Winner string logic
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
        const maxWickets = 10;
        const wicketsDiff = maxWickets - scoreSecond.wickets;
        if (wicketsDiff > 0) {
          return `${winner} won by ${wicketsDiff} wicket${wicketsDiff > 1 ? 's' : ''}`;
        }
      }
    } else {
      const runsDiff = Math.abs(scoreA.runs - scoreB.runs);
      if (runsDiff > 0) {
        return `${winner} won by ${runsDiff} run${runsDiff > 1 ? 's' : ''}`;
      }
    }
    return `${winner} won`;
  };

  const hasManOfMatch = !!(match.man_of_match || match.man_of_match_guest_name);
  const momName = match.man_of_match?.user?.name || match.man_of_match_guest_name || null;
  const momAvatar = match.man_of_match?.user?.avatar_url || null;

  return {
    matchTitle: `${match.team_a.name} vs ${match.team_b.name}`,
    matchMeta: `${match.venue || 'Venue TBD'} • ${formatDate(match.scheduled_at)} • ${match.overs} Overs`,
    teamAName: match.team_a.name,
    teamBName: match.team_b.name,
    teamAScore: match.team_a_score || '0/0 (0.0)',
    teamBScore: match.team_b_score || '0/0 (0.0)',
    winnerMessage: getWinnerMessage(),
    hasManOfMatch,
    momName,
    momAvatar,
    topBatsmanA: topBatsmanA ? {
      name: topBatsmanA.name || topBatsmanA.guest_name || 'Guest',
      teamName: match.team_a.name,
      avatarUrl: topBatsmanA.avatar_url || null,
      runs: topBatsmanA.runs,
      balls: topBatsmanA.balls_faced,
    } : null,
    topBatsmanB: topBatsmanB ? {
      name: topBatsmanB.name || topBatsmanB.guest_name || 'Guest',
      teamName: match.team_b.name,
      avatarUrl: topBatsmanB.avatar_url || null,
      runs: topBatsmanB.runs,
      balls: topBatsmanB.balls_faced,
    } : null,
    topBowlerA: topBowlerA ? {
      name: topBowlerA.name || topBowlerA.guest_name || 'Guest',
      teamName: match.team_a.name,
      avatarUrl: topBowlerA.avatar_url || null,
      wickets: topBowlerA.wickets,
      runsGiven: topBowlerA.runs_given,
      overs: topBowlerA.overs_bowled,
    } : null,
    topBowlerB: topBowlerB ? {
      name: topBowlerB.name || topBowlerB.guest_name || 'Guest',
      teamName: match.team_b.name,
      avatarUrl: topBowlerB.avatar_url || null,
      wickets: topBowlerB.wickets,
      runsGiven: topBowlerB.runs_given,
      overs: topBowlerB.overs_bowled,
    } : null,
  };
}

export function mapMatchToTeamScorecardData(
  match: CricketMatch,
  teamId: number,
  lineups?: any | null,
  isMyTeamShare: boolean = false
): TeamScorecardCardData {
  const stats = match.player_stats || [];
  const team = teamId === match.team_a_id ? match.team_a : match.team_b;
  const battingStats = stats.filter((s) => s.team_id === teamId);
  const opposingBowlerStats = stats.filter((s) => s.team_id !== teamId);

  const isTeamA = teamId === match.team_a_id;
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

  // Sorting batsmen
  const activeBatsmen = battingStats.filter(
    (s) => s.runs > 0 || s.balls_faced > 0 || s.how_out || s.is_not_out
  );
  const teamLineup = isTeamA ? lineups?.team_a?.players : lineups?.team_b?.players;

  const sortedBatsmen = (() => {
    if (!teamLineup || teamLineup.length === 0) {
      return activeBatsmen;
    }
    return [...activeBatsmen].sort((a, b) => {
      const orderA = teamLineup.find((p: any) => {
        if (a.player_id && p.player_id) return a.player_id === p.player_id;
        if (!a.player_id && !p.player_id && a.guest_name && p.guest_name) {
          return a.guest_name.toLowerCase() === p.guest_name.toLowerCase();
        }
        return false;
      })?.batting_order ?? 999;

      const orderB = teamLineup.find((p: any) => {
        if (b.player_id && p.player_id) return b.player_id === p.player_id;
        if (!b.player_id && !p.player_id && b.guest_name && p.guest_name) {
          return b.guest_name.toLowerCase() === p.guest_name.toLowerCase();
        }
        return false;
      })?.batting_order ?? 999;

      return orderA - orderB;
    });
  })();

  const activeBowlers = opposingBowlerStats.filter((s) => s.overs_bowled > 0);

  // Sum extras conceded by opposing bowlers
  let wides = 0;
  let noBalls = 0;
  opposingBowlerStats.forEach((b) => {
    if (b.overs_bowled > 0) {
      wides += b.wides || 0;
      noBalls += b.no_balls || 0;
    }
  });

  const totalExtras = wides + noBalls + byes + legByes;
  const scoreStr = isTeamA ? match.team_a_score : match.team_b_score;

  return {
    matchTitle: `${match.team_a.name} vs ${match.team_b.name}`,
    teamSubtitle: isMyTeamShare ? `My team scorecard` : `${team.name} scorecard`,
    teamName: team.name,
    scoreStr: scoreStr || '0/0 (0.0)',
    batsmen: sortedBatsmen.map((player) => {
      const strikeRate = player.balls_faced > 0
        ? ((player.runs / player.balls_faced) * 100).toFixed(2)
        : '0.00';

      let dismissal = 'Not Out';
      if (!player.is_not_out) {
        if (player.how_out) {
          dismissal = player.how_out.replace(/_/g, ' ');
          dismissal = dismissal.charAt(0).toUpperCase() + dismissal.slice(1);
        } else {
          dismissal = 'Out';
        }
      }

      return {
        name: player.name || player.guest_name || 'Guest',
        dismissal,
        runs: player.runs,
        balls: player.balls_faced,
        fours: player.fours,
        sixes: player.sixes,
        strikeRate,
      };
    }),
    bowlers: activeBowlers.map((player) => {
      const economyRate = calculateEconomyRate(player.runs_given, player.overs_bowled);
      return {
        name: player.name || player.guest_name || 'Guest',
        overs: player.overs_bowled.toFixed(1),
        maidens: player.maidens || 0,
        runsGiven: player.runs_given,
        wickets: player.wickets,
        economyRate,
      };
    }),
    extras: {
      total: totalExtras,
      wides,
      noBalls,
      byes,
      legByes,
    },
  };
}

export function mapMatchToFullScorecardData(
  match: CricketMatch,
  lineups?: any | null
): FullScorecardCardData {
  return {
    teamAData: mapMatchToTeamScorecardData(match, match.team_a_id, lineups, false),
    teamBData: mapMatchToTeamScorecardData(match, match.team_b_id, lineups, false),
  };
}

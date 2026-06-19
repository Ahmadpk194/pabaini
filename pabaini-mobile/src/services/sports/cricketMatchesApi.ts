import client from '../../api/client';
import {
  CricketMatch,
  RequestMatchPayload,
  UpdateMatchPayload,
} from '../../types/sports.types';

export async function requestMatch(payload: RequestMatchPayload): Promise<CricketMatch> {
  const response = await client.post('/sports/cricket/matches/request', payload);
  return response.data.data;
}

export async function getAllMatches(params?: {
  status?: string;
  team_id?: number;
  page?: number;
  limit?: number;
}): Promise<{ data: CricketMatch[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
  const response = await client.get('/sports/cricket/matches', { params });
  return response.data.data;
}

export async function getMatchById(id: number): Promise<CricketMatch> {
  const response = await client.get(`/sports/cricket/matches/${id}`);
  return response.data.data;
}

export async function acceptMatch(id: number): Promise<CricketMatch> {
  const response = await client.patch(`/sports/cricket/matches/${id}/accept`);
  return response.data.data;
}

export async function declineMatch(id: number): Promise<{ message: string }> {
  const response = await client.patch(`/sports/cricket/matches/${id}/decline`);
  return response.data;
}

export async function updateMatch(id: number, payload: UpdateMatchPayload): Promise<CricketMatch> {
  const response = await client.patch(`/sports/cricket/matches/${id}`, payload);
  return response.data.data;
}

export async function cancelMatch(id: number): Promise<{ message: string }> {
  const response = await client.patch(`/sports/cricket/matches/${id}/cancel`);
  return response.data;
}

export async function declareLineup(
  id: number,
  payload: {
    players: Array<{
      player_id?: number;
      guest_name?: string;
      batting_order: number;
    }>;
  }
): Promise<{ message: string; lineup: any[] }> {
  const response = await client.post(`/sports/cricket/matches/${id}/lineup`, payload);
  return response.data;
}

export async function getLineup(id: number): Promise<{
  team_a: {
    lineup_set: boolean;
    players: Array<{
      id: number;
      batting_order: number;
      player_id: number | null;
      guest_name: string | null;
      name: string;
      avatar_url: string | null;
    }>;
  };
  team_b: {
    lineup_set: boolean;
    players: Array<{
      id: number;
      batting_order: number;
      player_id: number | null;
      guest_name: string | null;
      name: string;
      avatar_url: string | null;
    }>;
  };
}> {
  const response = await client.get(`/sports/cricket/matches/${id}/lineup`);
  return response.data.data;
}

export async function submitMatchResult(
  id: number,
  payload: {
    winner_team_id: number;
    man_of_match_id?: number;
    team_a_score: string;
    team_b_score: string;
    player_stats: Array<{
      player_id?: number;
      guest_name?: string;
      team_id: number;
      runs: number;
      balls_faced: number;
      fours: number;
      sixes: number;
      how_out?: string;
      is_not_out: boolean;
      overs_bowled: number;
      runs_given: number;
      wickets: number;
      wides: number;
      no_balls: number;
    }>;
  }
): Promise<CricketMatch> {
  const response = await client.post(`/sports/cricket/matches/${id}/result`, payload);
  return response.data.data;
}

export async function editMatchResult(
  id: number,
  payload: {
    winner_team_id?: number;
    man_of_match_id?: number;
    team_a_score?: string;
    team_b_score?: string;
    player_stats?: Array<{
      player_id?: number;
      guest_name?: string;
      team_id: number;
      runs: number;
      balls_faced: number;
      fours: number;
      sixes: number;
      how_out?: string;
      is_not_out: boolean;
      overs_bowled: number;
      runs_given: number;
      wickets: number;
      wides: number;
      no_balls: number;
    }>;
  }
): Promise<CricketMatch> {
  const response = await client.patch(`/sports/cricket/matches/${id}/result`, payload);
  return response.data.data;
}

export async function startLiveMatch(
  id: number,
  payload: {
    scorer_id?: number;
    toss_winner_team_id: number;
    batting_first_team_id: number;
    opening_striker_id?: number;
    opening_striker_guest_name?: string;
    opening_non_striker_id?: number;
    opening_non_striker_guest_name?: string;
    opening_bowler_id?: number;
    opening_bowler_guest_name?: string;
  }
): Promise<CricketMatch> {
  const response = await client.patch(`/sports/cricket/matches/${id}/start`, payload);
  return response.data.data;
}

export async function recordBall(
  id: number,
  payload: {
    runs: number;
    extra_type?: 'wide' | 'no_ball' | 'bye' | 'leg_bye';
    extra_runs?: number;
    is_wicket: boolean;
    wicket_type?: 'bowled' | 'caught' | 'run_out' | 'lbw' | 'stumped' | 'hit_wicket' | 'retired';
    next_batsman_id?: number;
    next_batsman_guest_name?: string;
  }
): Promise<CricketMatch> {
  const response = await client.post(`/sports/cricket/matches/${id}/balls`, payload);
  return response.data.data;
}

export async function changeBowler(
  id: number,
  payload: {
    bowler_id?: number;
    bowler_guest_name?: string;
  }
): Promise<CricketMatch> {
  const response = await client.patch(`/sports/cricket/matches/${id}/bowler`, payload);
  return response.data.data;
}

export async function startSecondInnings(
  id: number,
  payload: {
    opening_striker_id?: number;
    opening_striker_guest_name?: string;
    opening_non_striker_id?: number;
    opening_non_striker_guest_name?: string;
    opening_bowler_id?: number;
    opening_bowler_guest_name?: string;
  }
): Promise<CricketMatch> {
  const response = await client.patch(`/sports/cricket/matches/${id}/innings/start`, payload);
  return response.data.data;
}

export async function undoLastBall(id: number): Promise<CricketMatch> {
  const response = await client.patch(`/sports/cricket/matches/${id}/balls/undo`);
  return response.data.data;
}

export async function getLiveMatchDetails(id: number): Promise<any> {
  const response = await client.get(`/sports/cricket/matches/${id}/live`);
  return response.data.data;
}



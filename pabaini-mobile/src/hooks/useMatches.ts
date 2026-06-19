import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../constants/queryKeys';
import {
  getAllMatches,
  getMatchById,
  requestMatch,
  acceptMatch,
  declineMatch,
  updateMatch,
  cancelMatch,
  declareLineup,
  getLineup,
  submitMatchResult,
  editMatchResult,
  startLiveMatch,
  recordBall,
  changeBowler,
  startSecondInnings,
  undoLastBall,
  getLiveMatchDetails,
} from '../services/sports/cricketMatchesApi';
import {
  RequestMatchPayload,
  UpdateMatchPayload,
} from '../types/sports.types';

export function useMatches(filters?: { status?: string; team_id?: number; page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.matches.list(filters),
    queryFn: () => getAllMatches(filters),
    staleTime: 1000 * 10, // 10 seconds
  });
}

export function useMatchDetail(id: number) {
  return useQuery({
    queryKey: queryKeys.matches.detail(id),
    queryFn: () => getMatchById(id),
    enabled: !!id && !isNaN(id),
    staleTime: 1000 * 5, // 5 seconds
  });
}

export function useRequestMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RequestMatchPayload) => requestMatch(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
    },
  });
}

export function useAcceptMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => acceptMatch(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matches.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
    },
  });
}

export function useDeclineMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => declineMatch(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matches.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
    },
  });
}

export function useUpdateMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateMatchPayload }) =>
      updateMatch(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matches.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
    },
  });
}

export function useCancelMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => cancelMatch(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matches.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
    },
  });
}

export function useLineup(id: number) {
  return useQuery({
    queryKey: queryKeys.matches.lineup(id),
    queryFn: () => getLineup(id),
    enabled: !!id && !isNaN(id),
    staleTime: 1000 * 5, // 5 seconds
  });
}

export function useDeclareLineup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: {
        players: Array<{
          player_id?: number;
          guest_name?: string;
          batting_order: number;
        }>;
      };
    }) => declareLineup(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matches.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.matches.lineup(variables.id) });
    },
  });
}

export function useSubmitResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
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
      };
    }) => submitMatchResult(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matches.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
    },
  });
}

export function useEditResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
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
      };
    }) => editMatchResult(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matches.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
    },
  });
}

export function useLiveMatch(id: number, interval?: number) {
  return useQuery({
    queryKey: ['matches', 'live', id],
    queryFn: () => getLiveMatchDetails(id),
    enabled: !!id && !isNaN(id),
    refetchInterval: interval,
  });
}

export function useStartLiveMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
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
      };
    }) => startLiveMatch(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matches.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
    },
  });
}

export function useRecordBall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: {
        runs: number;
        extra_type?: 'wide' | 'no_ball' | 'bye' | 'leg_bye';
        extra_runs?: number;
        is_wicket: boolean;
        wicket_type?: 'bowled' | 'caught' | 'run_out' | 'lbw' | 'stumped' | 'hit_wicket' | 'retired';
        next_batsman_id?: number;
        next_batsman_guest_name?: string;
      };
    }) => recordBall(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matches.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['matches', 'live', variables.id] });
      queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
    },
  });
}

export function useChangeBowler() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: {
        bowler_id?: number;
        bowler_guest_name?: string;
      };
    }) => changeBowler(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matches.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['matches', 'live', variables.id] });
    },
  });
}

export function useStartSecondInnings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: {
        opening_striker_id?: number;
        opening_striker_guest_name?: string;
        opening_non_striker_id?: number;
        opening_non_striker_guest_name?: string;
        opening_bowler_id?: number;
        opening_bowler_guest_name?: string;
      };
    }) => startSecondInnings(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matches.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['matches', 'live', variables.id] });
    },
  });
}

export function useUndoLastBall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => undoLastBall(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matches.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['matches', 'live', id] });
      queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
    },
  });
}



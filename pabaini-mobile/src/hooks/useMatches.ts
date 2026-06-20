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
        man_of_match_guest_name?: string;
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
        man_of_match_guest_name?: string;
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
    onMutate: async ({ id, payload }) => {
      // 1. Cancel outgoing query refetches to prevent overwriting optimistic cache updates
      await queryClient.cancelQueries({ queryKey: ['matches', 'live', id] });

      // 2. Snapshot the current live data cache
      const previousLive = queryClient.getQueryData(['matches', 'live', id]);

      // 3. Perform the optimistic calculation and update the query cache
      if (previousLive) {
        queryClient.setQueryData(['matches', 'live', id], (old: any) => {
          if (!old) return old;

          const newBall = {
            runs: payload.runs,
            is_wicket: payload.is_wicket,
            extra_type: payload.extra_type || null,
          };

          let runs = 0;
          let wickets = 0;
          if (old.score && typeof old.score === 'string') {
            const parts = old.score.split('/');
            runs = parseInt(parts[0], 10) || 0;
            wickets = parseInt(parts[1], 10) || 0;
          }

          let overs = 0;
          let balls = 0;
          if (old.overs && typeof old.overs === 'string') {
            const parts = old.overs.split('.');
            overs = parseInt(parts[0], 10) || 0;
            balls = parseInt(parts[1], 10) || 0;
          }

          // Runs: Extras Wide & No-Ball add 1 extra run + any runs run on delivery.
          let runsAdded = payload.runs;
          if (payload.extra_type === 'wide' || payload.extra_type === 'no_ball') {
            runsAdded += payload.extra_runs || 1;
          } else if (payload.extra_type === 'bye' || payload.extra_type === 'leg_bye') {
            runsAdded += payload.extra_runs || 0;
          }
          runs += runsAdded;

          if (payload.is_wicket) {
            wickets += 1;
          }

          // Legal deliveries: Wides & No-Balls are not legal balls and do not count towards the over.
          let overEnded = false;
          const isLegalDelivery = payload.extra_type !== 'wide' && payload.extra_type !== 'no_ball';
          if (isLegalDelivery) {
            balls += 1;
            if (balls >= 6) {
              overs += 1;
              balls = 0;
              overEnded = true;
            }
          }

          const updatedThisOver = overEnded ? [] : [...(old.this_over || []), newBall];

          // Striker / Non-Striker stats
          let updatedStriker = old.striker ? { ...old.striker } : null;
          let updatedNonStriker = old.non_striker ? { ...old.non_striker } : null;

          if (updatedStriker) {
            if (isLegalDelivery) {
              updatedStriker.balls = (updatedStriker.balls || 0) + 1;
              if (payload.extra_type !== 'bye' && payload.extra_type !== 'leg_bye') {
                updatedStriker.runs = (updatedStriker.runs || 0) + payload.runs;
              }
            } else if (payload.extra_type === 'no_ball') {
              updatedStriker.balls = (updatedStriker.balls || 0) + 1;
              updatedStriker.runs = (updatedStriker.runs || 0) + payload.runs;
            }
          }

          // Strike rotation on odd runs (only when batsman remains active)
          if (payload.runs % 2 === 1 && !payload.is_wicket) {
            const temp = updatedStriker;
            updatedStriker = updatedNonStriker;
            updatedNonStriker = temp;
          }

          // Strike rotation on over completion (swap striker/non-striker)
          if (overEnded) {
            const temp = updatedStriker;
            updatedStriker = updatedNonStriker;
            updatedNonStriker = temp;
          }

          // Bowler stats
          let updatedBowler = old.bowler ? { ...old.bowler } : null;
          if (updatedBowler) {
            if (payload.is_wicket) {
              const isBowlerWicket = payload.wicket_type !== 'run_out' && payload.wicket_type !== 'retired';
              if (isBowlerWicket) {
                updatedBowler.wickets = (updatedBowler.wickets || 0) + 1;
              }
            }

            if (payload.extra_type !== 'bye' && payload.extra_type !== 'leg_bye') {
              let bowlerRunsAdded = payload.runs;
              if (payload.extra_type === 'wide' || payload.extra_type === 'no_ball') {
                bowlerRunsAdded += payload.extra_runs || 1;
              }
              updatedBowler.runs_given = (updatedBowler.runs_given || 0) + bowlerRunsAdded;
            }

            if (isLegalDelivery) {
              let bowlerBalls = 0;
              let bowlerOvers = 0;
              if (updatedBowler.overs && typeof updatedBowler.overs === 'string') {
                const parts = updatedBowler.overs.split('.');
                bowlerOvers = parseInt(parts[0], 10) || 0;
                bowlerBalls = parseInt(parts[1], 10) || 0;
              }
              bowlerBalls += 1;
              if (bowlerBalls >= 6) {
                bowlerOvers += 1;
                bowlerBalls = 0;
              }
              updatedBowler.overs = `${bowlerOvers}.${bowlerBalls}`;
            }

            // Clear bowler on over completion
            if (overEnded) {
              updatedBowler = null;
            }
          }

          return {
            ...old,
            score: `${runs}/${wickets}`,
            overs: `${overs}.${balls}`,
            this_over: updatedThisOver,
            striker: updatedStriker,
            non_striker: updatedNonStriker,
            bowler: updatedBowler,
          };
        });
      }

      // Return previous context state to revert on failure
      return { previousLive };
    },
    onError: (err, variables, context) => {
      if (context?.previousLive) {
        queryClient.setQueryData(['matches', 'live', variables.id], context.previousLive);
      }
    },
    onSettled: (data, error, variables) => {
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
        bypass_consecutive_check?: boolean;
      };
    }) => changeBowler(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['matches', 'live', id] });
      const previousLive = queryClient.getQueryData(['matches', 'live', id]);

      if (previousLive) {
        queryClient.setQueryData(['matches', 'live', id], (old: any) => {
          if (!old) return old;
          const updatedBowler = {
            id: payload.bowler_id || null,
            name: payload.bowler_guest_name || 'Selected Bowler',
            overs: '0.0',
            runs_given: 0,
            wickets: 0,
          };
          return {
            ...old,
            bowler: updatedBowler,
          };
        });
      }
      return { previousLive };
    },
    onError: (err, variables, context) => {
      if (context?.previousLive) {
        queryClient.setQueryData(['matches', 'live', variables.id], context.previousLive);
      }
    },
    onSettled: (data, error, variables) => {
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
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['matches', 'live', id] });
      const previousLive = queryClient.getQueryData(['matches', 'live', id]);

      if (previousLive) {
        queryClient.setQueryData(['matches', 'live', id], (old: any) => {
          if (!old) return old;
          const updatedStriker = {
            id: payload.opening_striker_id || null,
            name: payload.opening_striker_guest_name || 'Selected Striker',
            runs: 0,
            balls: 0,
          };
          const updatedNonStriker = {
            id: payload.opening_non_striker_id || null,
            name: payload.opening_non_striker_guest_name || 'Selected Non-Striker',
            runs: 0,
            balls: 0,
          };
          const updatedBowler = {
            id: payload.opening_bowler_id || null,
            name: payload.opening_bowler_guest_name || 'Selected Bowler',
            overs: '0.0',
            runs_given: 0,
            wickets: 0,
          };
          return {
            ...old,
            current_innings: 2,
            score: '0/0',
            overs: '0.0',
            this_over: [],
            striker: updatedStriker,
            non_striker: updatedNonStriker,
            bowler: updatedBowler,
          };
        });
      }
      return { previousLive };
    },
    onError: (err, variables, context) => {
      if (context?.previousLive) {
        queryClient.setQueryData(['matches', 'live', variables.id], context.previousLive);
      }
    },
    onSettled: (data, error, variables) => {
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



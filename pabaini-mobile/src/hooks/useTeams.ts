import { useQuery } from '@tanstack/react-query';
import { getAllTeams, getTeamById } from '../services/sports/cricketTeamsApi';

export function useAllTeams() {
  return useQuery({
    queryKey: ['teams', 'list'],
    queryFn: getAllTeams,
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useTeamDetail(id: number) {
  return useQuery({
    queryKey: ['teams', 'detail', id],
    queryFn: () => getTeamById(id),
    enabled: !!id && !isNaN(id),
    staleTime: 1000 * 30, // 30 seconds
  });
}

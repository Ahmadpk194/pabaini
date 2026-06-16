import { create } from 'zustand';
import { getMyTeams } from '../../services/sports/cricketTeamsApi';
import { MyTeamResponse } from '../../types/sports.types';

interface TeamsStore {
  myTeams: MyTeamResponse[];
  isLoadingMyTeams: boolean;
  error: string | null;
  fetchMyTeams: () => Promise<void>;
  clearMyTeams: () => void;
}

export const useTeamsStore = create<TeamsStore>((set) => ({
  myTeams: [],
  isLoadingMyTeams: false,
  error: null,
  fetchMyTeams: async () => {
    set({ isLoadingMyTeams: true, error: null });
    try {
      const teams = await getMyTeams();
      set({ myTeams: teams || [], isLoadingMyTeams: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch my teams', isLoadingMyTeams: false });
    }
  },
  clearMyTeams: () => set({ myTeams: [] }),
}));

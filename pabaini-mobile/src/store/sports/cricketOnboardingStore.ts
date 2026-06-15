import { create } from 'zustand';
import { CricketRole, BattingHand, BowlingArm, BowlingType } from '../../types/sports.types';

interface CricketOnboardingStore {
  role: CricketRole | null;
  batting_hand: BattingHand | null;
  bowling_arm: BowlingArm | null;
  bowling_type: BowlingType | null;

  setRole: (role: CricketRole) => void;
  setStyle: (
    batting_hand: BattingHand,
    bowling_arm: BowlingArm,
    bowling_type: BowlingType
  ) => void;
  reset: () => void;
}

export const useCricketOnboardingStore = create<CricketOnboardingStore>((set) => ({
  role: null,
  batting_hand: null,
  bowling_arm: null,
  bowling_type: null,

  setRole: (role) => set({ role }),
  setStyle: (batting_hand, bowling_arm, bowling_type) =>
    set({ batting_hand, bowling_arm, bowling_type }),
  reset: () =>
    set({
      role: null,
      batting_hand: null,
      bowling_arm: null,
      bowling_type: null,
    }),
}));

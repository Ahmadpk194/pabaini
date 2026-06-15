export interface SportConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  onboardingSteps: string[];
  profileRoute: string;
  apiBase: string;
}

export type CricketRole = 'batsman' | 'bowler' | 'allrounder' | 'keeper';
export type BattingHand = 'right' | 'left';
export type BowlingArm = 'right' | 'left' | 'none';
export type BowlingType = 'fast' | 'medium' | 'spin' | 'none';

export interface CricketOnboardingData {
  role: CricketRole | null;
  batting_hand: BattingHand | null;
  bowling_arm: BowlingArm | null;
  bowling_type: BowlingType | null;
}

export interface CricketPlayerProfile {
  id: number;
  role: CricketRole;
  batting_hand: BattingHand;
  bowling_arm: BowlingArm;
  bowling_type: BowlingType;
  is_active: boolean;
  user: {
    id: number;
    name: string;
    avatar_url: string | null;
  };
}

export interface PlayerRegistration {
  sportId: string;
  isRegistered: boolean;
  profile: CricketPlayerProfile | null;
}

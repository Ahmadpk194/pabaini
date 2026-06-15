import { SportConfig } from '../../types/sports.types';

export const cricketConfig: SportConfig = {
  id: 'cricket',
  name: 'Cricket',
  icon: '🏏',
  description: 'Track matches, build your player profile, join teams and compete in village tournaments',
  onboardingSteps: [
    '/sports/cricket/onboarding/role',
    '/sports/cricket/onboarding/style',
    '/sports/cricket/onboarding/preview',
  ],
  profileRoute: '/sports/cricket/profile',
  apiBase: '/sports/cricket/players',
};

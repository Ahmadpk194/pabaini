import { Injectable } from '@nestjs/common';

export interface CricketTierStats {
  matches: number;
  innings: number;
  runs: number;
  highest_score: number;
  average: number;
  strike_rate: number;
  fours: number;
  sixes: number;
  wickets: number;
  best_bowling: string | null;
  economy: number;
}

@Injectable()
export class CricketStatsService {
  async getStatsForPlayer(playerId: number): Promise<{
    competitive: CricketTierStats;
    casual: CricketTierStats;
  }> {
    const empty: CricketTierStats = {
      matches: 0,
      innings: 0,
      runs: 0,
      highest_score: 0,
      average: 0,
      strike_rate: 0,
      fours: 0,
      sixes: 0,
      wickets: 0,
      best_bowling: null,
      economy: 0,
    };
    // TODO Phase 4: replace with real aggregation queries against match/innings/ball
    // tables once they exist, scoped by tier (competitive vs casual) and this playerId.
    // The return shape below must remain stable — only the values become real.
    return {
      competitive: { ...empty },
      casual: { ...empty },
    };
  }
}

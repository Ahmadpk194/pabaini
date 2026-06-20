import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CricketPlayerMatchStats } from '../matches/entities/cricket-player-match-stats.entity';
import { MatchStatus } from '../matches/enums/matches.enums';

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
  constructor(
    @InjectRepository(CricketPlayerMatchStats)
    private readonly statsRepo: Repository<CricketPlayerMatchStats>,
  ) {}

  async getStatsForPlayer(playerId: number): Promise<{
    competitive: CricketTierStats;
    casual: CricketTierStats;
  }> {
    const statsList = await this.statsRepo.find({
      where: {
        player_id: playerId,
        match: { status: MatchStatus.COMPLETED },
      },
      relations: { match: true },
    });

    const competitiveStats = statsList.filter(
      (s) => s.match && (s.match.series_id !== null || s.match.tournament_id !== null),
    );

    const casualStats = statsList.filter(
      (s) => s.match && s.match.series_id === null && s.match.tournament_id === null,
    );

    return {
      competitive: this.calculateTierStats(competitiveStats),
      casual: this.calculateTierStats(casualStats),
    };
  }

  private calculateTierStats(statsGroup: CricketPlayerMatchStats[]): CricketTierStats {
    const matches = statsGroup.length;
    
    // innings is counted if the player batted (runs > 0, balls_faced > 0, how_out is set, or they are marked is_not_out)
    const battingInnings = statsGroup.filter(
      (s) => (s.runs > 0 || s.balls_faced > 0 || s.how_out || s.is_not_out),
    );
    const innings = battingInnings.length;

    const runs = statsGroup.reduce((sum, s) => sum + (s.runs || 0), 0);
    const highest_score = statsGroup.reduce((max, s) => Math.max(max, s.runs || 0), 0);
    const fours = statsGroup.reduce((sum, s) => sum + (s.fours || 0), 0);
    const sixes = statsGroup.reduce((sum, s) => sum + (s.sixes || 0), 0);
    const wickets = statsGroup.reduce((sum, s) => sum + (s.wickets || 0), 0);

    const totalBallsFaced = statsGroup.reduce((sum, s) => sum + (s.balls_faced || 0), 0);
    const strike_rate = totalBallsFaced > 0 ? Number(((runs / totalBallsFaced) * 100).toFixed(1)) : 0;

    // Average = runs / dismissals
    // A player is dismissed if they played in the innings and was not marked as is_not_out
    const dismissals = battingInnings.filter((s) => !s.is_not_out).length;
    const average = dismissals > 0 ? Number((runs / dismissals).toFixed(1)) : runs;

    // Bowling Economy & Best Bowling
    let totalBallsBowled = 0;
    let runsGiven = 0;
    let bestBowlStat: CricketPlayerMatchStats | null = null;

    for (const s of statsGroup) {
      if (s.overs_bowled) {
        // overs_bowled is a decimal number (like 3.4 for 3 overs 4 balls)
        const overs = Math.floor(s.overs_bowled);
        const balls = Math.round((s.overs_bowled - overs) * 10);
        const matchBalls = overs * 6 + balls;
        totalBallsBowled += matchBalls;
        runsGiven += s.runs_given || 0;
        
        // Track best bowling in a single match
        if (!bestBowlStat) {
          bestBowlStat = s;
        } else {
          // Compare wickets (higher is better)
          if ((s.wickets || 0) > (bestBowlStat.wickets || 0)) {
            bestBowlStat = s;
          } else if ((s.wickets || 0) === (bestBowlStat.wickets || 0)) {
            // Compare runs given (lower is better)
            if ((s.runs_given || 0) < (bestBowlStat.runs_given || 0)) {
              bestBowlStat = s;
            }
          }
        }
      }
    }

    const economy = totalBallsBowled > 0 ? Number(((runsGiven / totalBallsBowled) * 6).toFixed(2)) : 0;
    const best_bowling = bestBowlStat && bestBowlStat.overs_bowled > 0
      ? `${bestBowlStat.wickets}/${bestBowlStat.runs_given}`
      : null;

    return {
      matches,
      innings,
      runs,
      highest_score,
      average,
      strike_rate,
      fours,
      sixes,
      wickets,
      best_bowling,
      economy,
    };
  }
}

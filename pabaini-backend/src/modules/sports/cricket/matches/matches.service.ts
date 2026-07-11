import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { CricketMatch } from './entities/cricket-match.entity';
import { CricketSeries } from './entities/cricket-series.entity';
import { CricketMatchPlayer } from './entities/cricket-match-player.entity';
import { CricketPlayerMatchStats } from './entities/cricket-player-match-stats.entity';
import { CricketBallEvent } from './entities/cricket-ball-event.entity';
import { Team } from '../teams/entities/team.entity';
import { TeamMember } from '../teams/entities/team-member.entity';
import { CricketPlayerProfile } from '../entities/cricket-player-profile.entity';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { NotificationType } from 'src/modules/notifications/enums/notification-type.enum';
import { MatchStatus, MatchScoringMode, BallExtraType, HowOut } from './enums/matches.enums';
import { TeamMemberStatus } from '../teams/enums/team-member-status.enum';
import { RequestMatchDto } from './dto/request-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { QueryMatchesDto } from './dto/query-matches.dto';
import { DeclareLineupDto } from './dto/declare-lineup.dto';
import { SubmitResultDto } from './dto/submit-result.dto';
import { EditResultDto } from './dto/edit-result.dto';
import { StartMatchDto } from './dto/start-match.dto';
import { RecordBallDto } from './dto/record-ball.dto';
import { SelectBowlerDto } from './dto/select-bowler.dto';
import { StartSecondInningsDto } from './dto/start-second-innings.dto';
import { RetireBatsmanDto } from './dto/retire-batsman.dto';


@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(CricketMatch)
    private readonly matchRepo: Repository<CricketMatch>,
    @InjectRepository(CricketSeries)
    private readonly seriesRepo: Repository<CricketSeries>,
    @InjectRepository(CricketMatchPlayer)
    private readonly matchPlayerRepo: Repository<CricketMatchPlayer>,
    @InjectRepository(CricketPlayerMatchStats)
    private readonly statsRepo: Repository<CricketPlayerMatchStats>,
    @InjectRepository(CricketBallEvent)
    private readonly ballEventRepo: Repository<CricketBallEvent>,
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
    @InjectRepository(TeamMember)
    private readonly teamMemberRepo: Repository<TeamMember>,
    @InjectRepository(CricketPlayerProfile)
    private readonly playerProfileRepo: Repository<CricketPlayerProfile>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getCurrentPlayerProfile(userId: number): Promise<CricketPlayerProfile> {
    const profile = await this.playerProfileRepo.findOne({
      where: { user: { id: userId } },
    });
    if (!profile) {
      throw new NotFoundException('You must set up a cricket player profile first');
    }
    return profile;
  }

  async requestMatch(dto: RequestMatchDto, userId: number): Promise<CricketMatch> {
    const playerProfile = await this.getCurrentPlayerProfile(userId);

    const captainTeam = await this.teamRepo.findOne({
      where: { captain_id: playerProfile.id, is_active: true },
    });
    if (!captainTeam) {
      throw new ForbiddenException('Only team captains can perform this action');
    }

    const opponentTeam = await this.teamRepo.findOne({
      where: { id: dto.opponent_team_id, is_active: true },
      relations: { captain: { user: true } },
    });
    if (!opponentTeam) {
      throw new NotFoundException('Opponent team not found or is inactive');
    }

    if (opponentTeam.id === captainTeam.id) {
      throw new BadRequestException('You cannot challenge your own team');
    }

    const existingPending = await this.matchRepo.findOne({
      where: [
        { team_a_id: captainTeam.id, team_b_id: opponentTeam.id, status: MatchStatus.PENDING_REQUEST },
        { team_a_id: opponentTeam.id, team_b_id: captainTeam.id, status: MatchStatus.PENDING_REQUEST },
      ],
    });
    if (existingPending) {
      throw new ConflictException('A pending match request already exists between these two teams');
    }

    const savedMatch = await this.matchRepo.manager.transaction(async (manager) => {
      const match = manager.create(CricketMatch, {
        team_a_id: captainTeam.id,
        team_b_id: opponentTeam.id,
        requested_by: playerProfile.id,
        overs: dto.overs,
        venue: dto.venue || undefined,
        scheduled_at: dto.scheduled_at ? new Date(dto.scheduled_at) : undefined,
        scoring_mode: dto.scoring_mode,
        status: MatchStatus.PENDING_REQUEST,
      });
      return await manager.save(CricketMatch, match);
    });

    try {
      if (opponentTeam.captain?.user) {
        await this.notificationsService.create({
          user_id: opponentTeam.captain.user.id,
          type: NotificationType.MATCH_REQUEST,
          title: `Match request from ${captainTeam.name}`,
          body: `${dto.overs} overs at ${dto.venue || 'venue TBD'}`,
          deep_link: `/sports/cricket/matches/${savedMatch.id}`,
          metadata: { match_id: savedMatch.id },
        });
      }
    } catch (err: any) {
      console.warn(`Failed to send match request notification: ${err.message}`);
    }

    return this.findOneMatch(savedMatch.id);
  }

  async acceptMatch(matchId: number, userId: number): Promise<CricketMatch> {
    const playerProfile = await this.getCurrentPlayerProfile(userId);

    const match = await this.matchRepo.findOne({
      where: { id: matchId },
      relations: {
        team_a: { captain: { user: true } },
        team_b: { captain: { user: true } },
      },
    });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.status !== MatchStatus.PENDING_REQUEST) {
      throw new BadRequestException('Match is not in pending request status');
    }

    if (match.team_b.captain_id !== playerProfile.id) {
      throw new ForbiddenException('Only the opponent team captain can accept this match request');
    }

    const updatedMatch = await this.matchRepo.manager.transaction(async (manager) => {
      match.status = MatchStatus.SCHEDULED;
      return await manager.save(CricketMatch, match);
    });

    try {
      if (match.team_a.captain?.user) {
        await this.notificationsService.create({
          user_id: match.team_a.captain.user.id,
          type: NotificationType.MATCH_ACCEPTED,
          title: 'Match request accepted',
          body: `${match.team_b.name} accepted your match challenge.`,
          deep_link: `/sports/cricket/matches/${match.id}`,
          metadata: { match_id: match.id },
        });
      }
    } catch (err: any) {
      console.warn(`Failed to send match accepted notification: ${err.message}`);
    }

    return this.findOneMatch(updatedMatch.id);
  }

  async declineMatch(matchId: number, userId: number): Promise<{ message: string }> {
    const playerProfile = await this.getCurrentPlayerProfile(userId);

    const match = await this.matchRepo.findOne({
      where: { id: matchId },
      relations: {
        team_a: { captain: { user: true } },
        team_b: { captain: { user: true } },
      },
    });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.status !== MatchStatus.PENDING_REQUEST) {
      throw new BadRequestException('Match is not in pending request status');
    }

    if (match.team_b.captain_id !== playerProfile.id) {
      throw new ForbiddenException('Only the opponent team captain can decline this match request');
    }

    await this.matchRepo.manager.transaction(async (manager) => {
      match.status = MatchStatus.CANCELLED;
      return await manager.save(CricketMatch, match);
    });

    try {
      if (match.team_a.captain?.user) {
        await this.notificationsService.create({
          user_id: match.team_a.captain.user.id,
          type: NotificationType.MATCH_DECLINED,
          title: 'Match request declined',
          body: `${match.team_b.name} declined your match challenge.`,
          deep_link: `/sports/cricket/matches/${match.id}`,
          metadata: { match_id: match.id },
        });
      }
    } catch (err: any) {
      console.warn(`Failed to send match declined notification: ${err.message}`);
    }

    return { message: 'Match request declined' };
  }

  async updateMatch(matchId: number, dto: UpdateMatchDto, userId: number): Promise<CricketMatch> {
    const playerProfile = await this.getCurrentPlayerProfile(userId);

    const match = await this.matchRepo.findOne({
      where: { id: matchId },
    });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.status !== MatchStatus.PENDING_REQUEST) {
      throw new BadRequestException(
        'Match can only be edited while pending. Cancel and create a new request if needed.',
      );
    }

    if (match.requested_by !== playerProfile.id) {
      throw new ForbiddenException('Only the captain who requested the match can edit it');
    }

    if (dto.venue !== undefined) match.venue = dto.venue;
    if (dto.scheduled_at !== undefined) {
      match.scheduled_at = dto.scheduled_at ? new Date(dto.scheduled_at) : undefined;
    }
    if (dto.overs !== undefined) match.overs = dto.overs;
    if (dto.scoring_mode !== undefined) match.scoring_mode = dto.scoring_mode;

    await this.matchRepo.save(match);
    return this.findOneMatch(match.id);
  }

  async cancelMatch(matchId: number, userId: number): Promise<{ message: string }> {
    const playerProfile = await this.getCurrentPlayerProfile(userId);

    const match = await this.matchRepo.findOne({
      where: { id: matchId },
      relations: {
        team_a: { captain: { user: true } },
        team_b: { captain: { user: true } },
      },
    });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.status !== MatchStatus.PENDING_REQUEST && match.status !== MatchStatus.SCHEDULED) {
      throw new BadRequestException('Only pending or scheduled matches can be cancelled');
    }

    if (match.status === MatchStatus.PENDING_REQUEST) {
      if (match.requested_by !== playerProfile.id) {
        throw new ForbiddenException('Only the requesting captain can cancel a pending match request');
      }
    } else {
      if (match.team_a.captain_id !== playerProfile.id && match.team_b.captain_id !== playerProfile.id) {
        throw new ForbiddenException('Only the captain of Team A or Team B can cancel a scheduled match');
      }
    }

    const otherCaptain = playerProfile.id === match.team_a.captain_id ? match.team_b.captain : match.team_a.captain;
    const cancelingTeamName = playerProfile.id === match.team_a.captain_id ? match.team_a.name : match.team_b.name;

    await this.matchRepo.manager.transaction(async (manager) => {
      match.status = MatchStatus.CANCELLED;
      return await manager.save(CricketMatch, match);
    });

    try {
      if (otherCaptain?.user) {
        await this.notificationsService.create({
          user_id: otherCaptain.user.id,
          type: NotificationType.MATCH_CANCELLED,
          title: `Match cancelled by ${cancelingTeamName}`,
          body: `The match scheduled has been cancelled.`,
          deep_link: `/sports/cricket/matches/${match.id}`,
          metadata: { match_id: match.id },
        });
      }
    } catch (err: any) {
      console.warn(`Failed to send match cancelled notification: ${err.message}`);
    }

    return { message: 'Match cancelled' };
  }

  async findAllMatches(query: QueryMatchesDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.matchRepo.createQueryBuilder('match')
      .leftJoinAndSelect('match.team_a', 'team_a')
      .leftJoinAndSelect('match.team_b', 'team_b')
      .orderBy('match.created_at', 'DESC');

    if (query.status) {
      qb.andWhere('match.status = :status', { status: query.status });
    }

    if (query.team_id) {
      qb.andWhere('(match.team_a_id = :teamId OR match.team_b_id = :teamId)', { teamId: query.team_id });
    }

    if (query.search && query.search.trim() !== '') {
      const searchPattern = `%${query.search.trim()}%`;
      qb.andWhere(
        '(team_a.name ILIKE :search OR team_b.name ILIKE :search OR match.venue ILIKE :search)',
        { search: searchPattern }
      );
    }

    const [data, total] = await qb
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneMatch(matchId: number): Promise<any> {
    const match = await this.matchRepo.findOne({
      where: { id: matchId },
      relations: {
        team_a: { captain: { user: true } },
        team_b: { captain: { user: true } },
        series: true,
        winner_team: true,
        man_of_match: { user: true },
        requester: { user: true },
        scorer: { user: true },
      },
    });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const playerStats = await this.statsRepo.find({
      where: { match_id: matchId },
      relations: { player: { user: true } },
    });

    const now = new Date();
    const is_result_editable =
      match.status === MatchStatus.COMPLETED &&
      match.result_locked_at &&
      new Date(match.result_locked_at) > now;

    let ballEvents: CricketBallEvent[] = [];
    const bowlerMaidenCounts: Record<string, number> = {};
    let innings_1_byes: number | null = null;
    let innings_1_leg_byes: number | null = null;
    let innings_2_byes: number | null = null;
    let innings_2_leg_byes: number | null = null;
    let fall_of_wickets: any[] | null = null;

    if (match.status === MatchStatus.COMPLETED) {
      if (match.scoring_mode === MatchScoringMode.LIVE) {
        ballEvents = await this.ballEventRepo.find({
          where: { match_id: matchId },
          relations: { batsman: { user: true } },
          order: { innings: 'ASC', over_number: 'ASC', ball_number: 'ASC' },
        });

        // 1. Group events by bowler and over to calculate maidens
        const overEvents: Record<string, CricketBallEvent[]> = {};
        for (const event of ballEvents) {
          const bowlerKey = event.bowler_id ? `id_${event.bowler_id}` : `guest_${event.bowler_guest_name}`;
          const overKey = `${bowlerKey}::${event.innings}::${event.over_number}`;
          if (!overEvents[overKey]) {
            overEvents[overKey] = [];
          }
          overEvents[overKey].push(event);
        }

        for (const [overKey, events] of Object.entries(overEvents)) {
          const [bowlerKey] = overKey.split('::');
          // Filter out wides and no-balls
          const legalDeliveries = events.filter(
            (e) => e.extra_type !== BallExtraType.WIDE && e.extra_type !== BallExtraType.NO_BALL
          );
          // Sum runs + extra_runs for legal deliveries
          const totalRuns = legalDeliveries.reduce((sum, e) => sum + (e.runs || 0) + (e.extra_runs || 0), 0);
          if (totalRuns === 0) {
            bowlerMaidenCounts[bowlerKey] = (bowlerMaidenCounts[bowlerKey] || 0) + 1;
          }
        }

        // 2. Sum byes and leg-byes per innings
        innings_1_byes = 0;
        innings_1_leg_byes = 0;
        innings_2_byes = 0;
        innings_2_leg_byes = 0;
        for (const event of ballEvents) {
          if (event.innings === 1) {
            if (event.extra_type === BallExtraType.BYE) {
              innings_1_byes += event.extra_runs || 0;
            } else if (event.extra_type === BallExtraType.LEG_BYE) {
              innings_1_leg_byes += event.extra_runs || 0;
            }
          } else if (event.innings === 2) {
            if (event.extra_type === BallExtraType.BYE) {
              innings_2_byes += event.extra_runs || 0;
            } else if (event.extra_type === BallExtraType.LEG_BYE) {
              innings_2_leg_byes += event.extra_runs || 0;
            }
          }
        }

        // 3. Fall of wickets
        let innings1Score = 0;
        let innings2Score = 0;
        fall_of_wickets = [];
        for (const event of ballEvents) {
          const runsConceded = (event.runs || 0) + (event.extra_runs || 0);
          if (event.innings === 1) {
            innings1Score += runsConceded;
          } else if (event.innings === 2) {
            innings2Score += runsConceded;
          }

          if (event.is_wicket) {
            const playerName = event.batsman_guest_name || event.batsman?.user?.name || 'Guest';
            const wicketType = event.wicket_type || 'out';
            const overStr = `${event.over_number}.${event.ball_number}`;
            const scoreAtWicket = event.innings === 1 ? innings1Score : innings2Score;

            fall_of_wickets.push({
              player_name: playerName,
              wicket_type: wicketType,
              over: overStr,
              score_at_wicket: scoreAtWicket,
              innings: event.innings,
            });
          }
        }
      } else {
        // Completed but simple mode matches
        innings_1_byes = 0;
        innings_1_leg_byes = 0;
        innings_2_byes = 0;
        innings_2_leg_byes = 0;
        fall_of_wickets = [];
      }
    }

    const formattedStats = playerStats.map((s) => {
      let maidens: number | null = null;
      if (match.status === MatchStatus.COMPLETED) {
        if (match.scoring_mode === MatchScoringMode.LIVE) {
          const key = s.player_id ? `id_${s.player_id}` : `guest_${s.guest_name}`;
          maidens = bowlerMaidenCounts[key] || 0;
        } else {
          maidens = 0;
        }
      }

      return {
        id: s.id,
        match_id: s.match_id,
        team_id: s.team_id,
        player_id: s.player_id || null,
        guest_name: s.guest_name || null,
        name: s.player?.user?.name || s.guest_name,
        avatar_url: s.player?.user?.avatar_url || null,
        runs: s.runs,
        balls_faced: s.balls_faced,
        fours: s.fours,
        sixes: s.sixes,
        how_out: s.how_out || null,
        is_not_out: s.is_not_out,
        overs_bowled: s.overs_bowled,
        runs_given: s.runs_given,
        wickets: s.wickets,
        wides: s.wides,
        no_balls: s.no_balls,
        maidens,
        created_at: s.created_at,
        updated_at: s.updated_at,
      };
    });

    return {
      ...match,
      player_stats: formattedStats,
      is_result_editable: !!is_result_editable,
      innings_1_byes,
      innings_1_leg_byes,
      innings_2_byes,
      innings_2_leg_byes,
      fall_of_wickets,
    };
  }

  async aggregatePlayerStats(playerId: number, entityManager: EntityManager): Promise<void> {
    const oversToBalls = (overs: number): number => {
      const completedOvers = Math.floor(overs);
      const balls = Math.round((overs - completedOvers) * 10);
      return completedOvers * 6 + balls;
    };

    const ballsToOvers = (balls: number): number => {
      const completedOvers = Math.floor(balls / 6);
      const remainingBalls = balls % 6;
      return completedOvers + remainingBalls / 10;
    };

    const statsList = await entityManager.find(CricketPlayerMatchStats, {
      where: {
        player_id: playerId,
        match: { status: MatchStatus.COMPLETED },
      },
      relations: { match: true },
    });

    const totalMatches = new Set(statsList.map((s) => s.match_id)).size;
    const totalRuns = statsList.reduce((sum, s) => sum + (s.runs || 0), 0);
    const totalBallsFaced = statsList.reduce((sum, s) => sum + (s.balls_faced || 0), 0);
    const totalFours = statsList.reduce((sum, s) => sum + (s.fours || 0), 0);
    const totalSixes = statsList.reduce((sum, s) => sum + (s.sixes || 0), 0);
    const highestScore = statsList.reduce((max, s) => Math.max(max, s.runs || 0), 0);
    const totalWickets = statsList.reduce((sum, s) => sum + (s.wickets || 0), 0);
    const totalRunsGiven = statsList.reduce((sum, s) => sum + (s.runs_given || 0), 0);

    let totalBalls = 0;
    for (const s of statsList) {
      if (s.overs_bowled) {
        totalBalls += oversToBalls(Number(s.overs_bowled));
      }
    }
    const totalOversBowled = ballsToOvers(totalBalls);

    await entityManager.update(CricketPlayerProfile, { id: playerId }, {
      total_matches: totalMatches,
      total_runs: totalRuns,
      total_balls_faced: totalBallsFaced,
      total_fours: totalFours,
      total_sixes: totalSixes,
      highest_score: highestScore,
      total_wickets: totalWickets,
      total_overs_bowled: totalOversBowled,
      total_runs_given: totalRunsGiven,
    });
  }

  async submitResult(matchId: number, dto: SubmitResultDto, userId: number): Promise<any> {
    const playerProfile = await this.getCurrentPlayerProfile(userId);

    const match = await this.matchRepo.findOne({
      where: { id: matchId },
      relations: {
        team_a: { captain: { user: true } },
        team_b: { captain: { user: true } },
      },
    });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.status !== MatchStatus.SCHEDULED) {
      throw new BadRequestException('Match is not in scheduled status');
    }

    if (match.scoring_mode && match.scoring_mode !== MatchScoringMode.SIMPLE) {
      throw new BadRequestException('Match is not in simple scoring mode');
    }

    const isTeamACaptain = match.team_a.captain_id === playerProfile.id;
    const isTeamBCaptain = match.team_b.captain_id === playerProfile.id;
    if (!isTeamACaptain && !isTeamBCaptain) {
      throw new ForbiddenException('Only the captain of Team A or Team B can submit results');
    }

    if (!dto.player_stats || dto.player_stats.length === 0) {
      throw new BadRequestException('Player stats cannot be empty');
    }

    if (dto.winner_team_id !== match.team_a_id && dto.winner_team_id !== match.team_b_id) {
      throw new BadRequestException('Winner team must be one of the participating teams');
    }

    const matchPlayers = await this.matchPlayerRepo.find({
      where: { match_id: match.id },
    });

    if (matchPlayers.length === 0) {
      throw new BadRequestException('Playing XI lineup has not been declared for this match');
    }

    for (const stat of dto.player_stats) {
      if (stat.team_id !== match.team_a_id && stat.team_id !== match.team_b_id) {
        throw new BadRequestException(`Team ID ${stat.team_id} is not part of this match`);
      }
      if (stat.player_id && stat.guest_name) {
        throw new BadRequestException('Each player stat must have either player_id or guest_name, not both');
      }
      if (!stat.player_id && (!stat.guest_name || !stat.guest_name.trim())) {
        throw new BadRequestException('Each player stat must have either player_id or guest_name');
      }

      const foundPlayer = matchPlayers.find((mp) => {
        if (mp.team_id !== stat.team_id) return false;
        if (stat.player_id) {
          return mp.player_id === stat.player_id;
        } else {
          return mp.guest_name === stat.guest_name;
        }
      });

      if (!foundPlayer) {
        const identifier = stat.player_id ? `player ID ${stat.player_id}` : `guest "${stat.guest_name}"`;
        throw new BadRequestException(
          `Player ${identifier} is not in the declared Playing XI lineup for team ${stat.team_id}`,
        );
      }
    }

    if (dto.man_of_match_id) {
      const isMomInLineup = matchPlayers.some((mp) => mp.player_id === dto.man_of_match_id);
      if (!isMomInLineup) {
        throw new BadRequestException('Man of the match must be a registered player in the match lineup');
      }
    } else if (dto.man_of_match_guest_name) {
      const isMomInLineup = matchPlayers.some((mp) => mp.guest_name === dto.man_of_match_guest_name);
      if (!isMomInLineup) {
        throw new BadRequestException('Man of the match must be a guest player in the match lineup');
      }
    }

    await this.matchRepo.manager.transaction(async (manager) => {
      await manager.delete(CricketPlayerMatchStats, { match_id: match.id });

      const newStats = dto.player_stats.map((s) => {
        return manager.create(CricketPlayerMatchStats, {
          match_id: match.id,
          team_id: s.team_id,
          player_id: s.player_id || undefined,
          guest_name: s.guest_name || undefined,
          runs: s.runs,
          balls_faced: s.balls_faced,
          fours: s.fours,
          sixes: s.sixes,
          how_out: s.how_out || undefined,
          is_not_out: s.is_not_out,
          overs_bowled: s.overs_bowled,
          runs_given: s.runs_given,
          wickets: s.wickets,
          wides: s.wides,
          no_balls: s.no_balls,
        });
      });
      await manager.save(CricketPlayerMatchStats, newStats);

      const now = new Date();
      const lockedAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      match.status = MatchStatus.COMPLETED;
      match.winner_team_id = dto.winner_team_id;
      match.man_of_match_id = dto.man_of_match_id || null as any;
      match.man_of_match_guest_name = dto.man_of_match_guest_name || null as any;
      match.team_a_score = dto.team_a_score;
      match.team_b_score = dto.team_b_score;
      match.result_submitted_at = now;
      match.result_locked_at = lockedAt;
      match.scoring_mode = MatchScoringMode.SIMPLE;
      await manager.save(CricketMatch, match);

      const registeredPlayerIds = Array.from(
        new Set(
          dto.player_stats
            .map((s) => s.player_id)
            .filter((id): id is number => !!id),
        ),
      );

      for (const pId of registeredPlayerIds) {
        await this.aggregatePlayerStats(pId, manager);
      }
    });

    try {
      const otherCaptain = playerProfile.id === match.team_a.captain_id ? match.team_b.captain : match.team_a.captain;
      const submittingTeamName = playerProfile.id === match.team_a.captain_id ? match.team_a.name : match.team_b.name;
      if (otherCaptain?.user) {
        await this.notificationsService.create({
          user_id: otherCaptain.user.id,
          type: NotificationType.MATCH_RESULT_SUBMITTED,
          title: `Match result submitted by ${submittingTeamName}`,
          body: `${match.team_a.name} vs ${match.team_b.name} scorecard is now available.`,
          deep_link: `/sports/cricket/matches/${match.id}`,
          metadata: { match_id: match.id },
        });
      }
    } catch (err: any) {
      console.warn(`Failed to send match result submission notification: ${err.message}`);
    }

    return this.findOneMatch(match.id);
  }

  async editResult(matchId: number, dto: EditResultDto, userId: number): Promise<any> {
    const playerProfile = await this.getCurrentPlayerProfile(userId);

    const match = await this.matchRepo.findOne({
      where: { id: matchId },
      relations: {
        team_a: { captain: { user: true } },
        team_b: { captain: { user: true } },
      },
    });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.status !== MatchStatus.COMPLETED) {
      throw new BadRequestException('Match is not completed');
    }

    const now = new Date();
    if (match.result_locked_at && new Date(match.result_locked_at) < now) {
      throw new BadRequestException('Match results are locked and can no longer be edited');
    }

    const isTeamACaptain = match.team_a.captain_id === playerProfile.id;
    const isTeamBCaptain = match.team_b.captain_id === playerProfile.id;
    if (!isTeamACaptain && !isTeamBCaptain) {
      throw new ForbiddenException('Only the captain of Team A or Team B can edit results');
    }

    const matchPlayers = await this.matchPlayerRepo.find({
      where: { match_id: match.id },
    });

    if (dto.player_stats) {
      if (dto.player_stats.length === 0) {
        throw new BadRequestException('Player stats cannot be empty if provided');
      }
      for (const stat of dto.player_stats) {
        if (stat.team_id !== match.team_a_id && stat.team_id !== match.team_b_id) {
          throw new BadRequestException(`Team ID ${stat.team_id} is not part of this match`);
        }
        if (stat.player_id && stat.guest_name) {
          throw new BadRequestException('Each player stat must have either player_id or guest_name, not both');
        }
        if (!stat.player_id && (!stat.guest_name || !stat.guest_name.trim())) {
          throw new BadRequestException('Each player stat must have either player_id or guest_name');
        }

        const foundPlayer = matchPlayers.find((mp) => {
          if (mp.team_id !== stat.team_id) return false;
          if (stat.player_id) {
            return mp.player_id === stat.player_id;
          } else {
            return mp.guest_name === stat.guest_name;
          }
        });

        if (!foundPlayer) {
          const identifier = stat.player_id ? `player ID ${stat.player_id}` : `guest "${stat.guest_name}"`;
          throw new BadRequestException(
            `Player ${identifier} is not in the declared Playing XI lineup for team ${stat.team_id}`,
          );
        }
      }
    }

    if (dto.winner_team_id !== undefined) {
      if (dto.winner_team_id !== match.team_a_id && dto.winner_team_id !== match.team_b_id) {
        throw new BadRequestException('Winner team must be one of the participating teams');
      }
    }

    if (dto.man_of_match_id) {
      const isMomInLineup = matchPlayers.some((mp) => mp.player_id === dto.man_of_match_id);
      if (!isMomInLineup) {
        throw new BadRequestException('Man of the match must be a registered player in the match lineup');
      }
    } else if (dto.man_of_match_guest_name) {
      const isMomInLineup = matchPlayers.some((mp) => mp.guest_name === dto.man_of_match_guest_name);
      if (!isMomInLineup) {
        throw new BadRequestException('Man of the match must be a guest player in the match lineup');
      }
    }

    const oldStats = await this.statsRepo.find({
      where: { match_id: match.id },
    });
    const oldRegisteredPlayerIds = Array.from(
      new Set(
        oldStats
          .map((s) => s.player_id)
          .filter((id): id is number => !!id),
      ),
    );

    await this.matchRepo.manager.transaction(async (manager) => {
      let newRegisteredPlayerIds: number[] = [];
      if (dto.player_stats) {
        await manager.delete(CricketPlayerMatchStats, { match_id: match.id });

        const newStats = dto.player_stats.map((s) => {
          return manager.create(CricketPlayerMatchStats, {
            match_id: match.id,
            team_id: s.team_id,
            player_id: s.player_id || undefined,
            guest_name: s.guest_name || undefined,
            runs: s.runs,
            balls_faced: s.balls_faced,
            fours: s.fours,
            sixes: s.sixes,
            how_out: s.how_out || undefined,
            is_not_out: s.is_not_out,
            overs_bowled: s.overs_bowled,
            runs_given: s.runs_given,
            wickets: s.wickets,
            wides: s.wides,
            no_balls: s.no_balls,
          });
        });
        await manager.save(CricketPlayerMatchStats, newStats);

        newRegisteredPlayerIds = Array.from(
          new Set(
            dto.player_stats
              .map((s) => s.player_id)
              .filter((id): id is number => !!id),
          ),
        );
      }

      if (dto.winner_team_id !== undefined) match.winner_team_id = dto.winner_team_id;
      if (dto.man_of_match_id !== undefined) {
        match.man_of_match_id = dto.man_of_match_id || null as any;
        if (dto.man_of_match_id) {
          match.man_of_match_guest_name = null as any;
        }
      }
      if (dto.man_of_match_guest_name !== undefined) {
        match.man_of_match_guest_name = dto.man_of_match_guest_name || null as any;
        if (dto.man_of_match_guest_name) {
          match.man_of_match_id = null as any;
        }
      }
      if (dto.team_a_score !== undefined) match.team_a_score = dto.team_a_score;
      if (dto.team_b_score !== undefined) match.team_b_score = dto.team_b_score;

      await manager.save(CricketMatch, match);

      if (dto.player_stats) {
        const allAffectedPlayerIds = Array.from(
          new Set([...oldRegisteredPlayerIds, ...newRegisteredPlayerIds]),
        );
        for (const pId of allAffectedPlayerIds) {
          await this.aggregatePlayerStats(pId, manager);
        }
      }
    });

    return this.findOneMatch(match.id);
  }

  async declareLineup(matchId: number, dto: DeclareLineupDto, userId: number) {
    const playerProfile = await this.getCurrentPlayerProfile(userId);

    const match = await this.matchRepo.findOne({
      where: { id: matchId },
      relations: {
        team_a: true,
        team_b: true,
      },
    });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.status !== MatchStatus.SCHEDULED) {
      throw new BadRequestException('Lineups can only be declared for scheduled matches');
    }

    const isTeamACaptain = match.team_a.captain_id === playerProfile.id;
    const isTeamBCaptain = match.team_b.captain_id === playerProfile.id;
    if (!isTeamACaptain && !isTeamBCaptain) {
      throw new ForbiddenException('Only the captain of Team A or Team B can declare lineups');
    }

    const teamId = isTeamACaptain ? match.team_a_id : match.team_b_id;

    if (dto.players.length < 6 || dto.players.length > 11) {
      throw new BadRequestException('Playing XI must have between 6 and 11 players');
    }

    for (const player of dto.players) {
      if (!player.player_id && (!player.guest_name || !player.guest_name.trim())) {
        throw new BadRequestException('Each player in the lineup must have either a player_id or a guest_name');
      }
      if (player.player_id && player.guest_name) {
        throw new BadRequestException('Each player in the lineup cannot have both a player_id and a guest_name');
      }
    }

    for (const player of dto.players) {
      if (player.player_id) {
        const activeMember = await this.teamMemberRepo.findOne({
          where: {
            team_id: teamId,
            player_id: player.player_id,
            status: TeamMemberStatus.ACTIVE,
          },
        });
        if (!activeMember) {
          throw new BadRequestException(`Player ${player.player_id} is not an active member of your team`);
        }
      }
    }

    const battingOrders = dto.players.map((p) => p.batting_order);
    const uniqueOrders = new Set(battingOrders);
    if (uniqueOrders.size !== dto.players.length) {
      throw new BadRequestException('Each player must have a unique batting order');
    }
    for (const order of battingOrders) {
      if (order < 1 || order > dto.players.length) {
        throw new BadRequestException(`Batting order must be between 1 and ${dto.players.length}`);
      }
    }

    const resultLineup = await this.matchRepo.manager.transaction(async (manager) => {
      await manager.delete(CricketMatchPlayer, {
        match_id: match.id,
        team_id: teamId,
      });

      const matchPlayers = dto.players.map((p) => {
        return manager.create(CricketMatchPlayer, {
          match_id: match.id,
          team_id: teamId,
          player_id: p.player_id || undefined,
          guest_name: p.guest_name || undefined,
          batting_order: p.batting_order,
        });
      });
      await manager.save(CricketMatchPlayer, matchPlayers);

      if (isTeamACaptain) {
        match.team_a_lineup_set = true;
        match.team_a_player_count = dto.players.length;
      } else {
        match.team_b_lineup_set = true;
        match.team_b_player_count = dto.players.length;
      }
      await manager.save(CricketMatch, match);

      return matchPlayers;
    });

    return { message: 'Lineup declared successfully', lineup: resultLineup };
  }

  async getLineups(matchId: number) {
    const match = await this.matchRepo.findOne({
      where: { id: matchId },
    });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const teamAPlayers = await this.matchPlayerRepo.find({
      where: { match_id: matchId, team_id: match.team_a_id },
      relations: { player: { user: true } },
      order: { batting_order: 'ASC' },
    });

    const teamBPlayers = await this.matchPlayerRepo.find({
      where: { match_id: matchId, team_id: match.team_b_id },
      relations: { player: { user: true } },
      order: { batting_order: 'ASC' },
    });

    return {
      team_a: {
        lineup_set: match.team_a_lineup_set,
        players: teamAPlayers.map((p) => ({
          id: p.id,
          batting_order: p.batting_order,
          player_id: p.player_id || null,
          guest_name: p.guest_name || null,
          name: p.player?.user?.name || p.guest_name,
          avatar_url: p.player?.user?.avatar_url || null,
        })),
      },
      team_b: {
        lineup_set: match.team_b_lineup_set,
        players: teamBPlayers.map((p) => ({
          id: p.id,
          batting_order: p.batting_order,
          player_id: p.player_id || null,
          guest_name: p.guest_name || null,
          name: p.player?.user?.name || p.guest_name,
          avatar_url: p.player?.user?.avatar_url || null,
        })),
      },
    };
  }

  async startMatch(matchId: number, dto: StartMatchDto, userId: number): Promise<any> {
    const playerProfile = await this.getCurrentPlayerProfile(userId);

    const match = await this.matchRepo.findOne({
      where: { id: matchId },
      relations: {
        team_a: { captain: { user: true } },
        team_b: { captain: { user: true } },
      },
    });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.status !== MatchStatus.SCHEDULED) {
      throw new BadRequestException('Match is not in scheduled status');
    }

    if (match.scoring_mode !== MatchScoringMode.LIVE) {
      throw new BadRequestException('This match is not set to live scoring mode');
    }

    if (!match.team_a_lineup_set || !match.team_b_lineup_set) {
      throw new BadRequestException('Both teams must declare their Playing XI before starting');
    }

    const isTeamACaptain = match.team_a.captain_id === playerProfile.id;
    const isTeamBCaptain = match.team_b.captain_id === playerProfile.id;
    if (!isTeamACaptain && !isTeamBCaptain) {
      throw new ForbiddenException('Only the captain of Team A or Team B can start the match');
    }

    if (dto.batting_first_team_id !== match.team_a_id && dto.batting_first_team_id !== match.team_b_id) {
      throw new BadRequestException('Batting first team must be one of the participating teams');
    }

    const defaultScorerId = playerProfile.id;
    const finalScorerId = dto.scorer_id || defaultScorerId;

    if (dto.scorer_id) {
      // Verifies that the selected scorer is a registered, active player in the system.
      // Neutral scorers (non-team members) are allowed.
      const scorerProfile = await this.playerProfileRepo.findOne({
        where: { id: dto.scorer_id, is_active: true },
      });
      if (!scorerProfile) {
        throw new BadRequestException('The selected scorer must be a valid, active cricket player');
      }
    }

    const matchPlayers = await this.matchPlayerRepo.find({
      where: { match_id: matchId },
    });

    const battingLineup = matchPlayers.filter(mp => mp.team_id === dto.batting_first_team_id);
    const bowlingTeamId = dto.batting_first_team_id === match.team_a_id ? match.team_b_id : match.team_a_id;
    const bowlingLineup = matchPlayers.filter(mp => mp.team_id === bowlingTeamId);

    // Striker validation
    if (dto.opening_striker_id) {
      const ok = battingLineup.some(mp => mp.player_id === dto.opening_striker_id);
      if (!ok) throw new BadRequestException('Opening striker must be in the batting team Playing XI');
    } else if (dto.opening_striker_guest_name && dto.opening_striker_guest_name.trim()) {
      const ok = battingLineup.some(mp => mp.guest_name === dto.opening_striker_guest_name);
      if (!ok) throw new BadRequestException('Opening striker guest must be in the batting team Playing XI');
    } else {
      throw new BadRequestException('Opening striker is required');
    }

    // Non-striker validation
    if (dto.opening_non_striker_id) {
      const ok = battingLineup.some(mp => mp.player_id === dto.opening_non_striker_id);
      if (!ok) throw new BadRequestException('Opening non-striker must be in the batting team Playing XI');
    } else if (dto.opening_non_striker_guest_name && dto.opening_non_striker_guest_name.trim()) {
      const ok = battingLineup.some(mp => mp.guest_name === dto.opening_non_striker_guest_name);
      if (!ok) throw new BadRequestException('Opening non-striker guest must be in the batting team Playing XI');
    } else {
      throw new BadRequestException('Opening non-striker is required');
    }

    // Bowler validation
    if (dto.opening_bowler_id) {
      const ok = bowlingLineup.some(mp => mp.player_id === dto.opening_bowler_id);
      if (!ok) throw new BadRequestException('Opening bowler must be in the bowling team Playing XI');
    } else if (dto.opening_bowler_guest_name && dto.opening_bowler_guest_name.trim()) {
      const ok = bowlingLineup.some(mp => mp.guest_name === dto.opening_bowler_guest_name);
      if (!ok) throw new BadRequestException('Opening bowler guest must be in the bowling team Playing XI');
    } else {
      throw new BadRequestException('Opening bowler is required');
    }

    await this.matchRepo.manager.transaction(async (manager) => {
      match.status = MatchStatus.LIVE;
      match.scorer_id = finalScorerId;
      match.current_innings = 1;
      match.current_over = 0;
      match.current_ball = 0;
      match.current_batting_team_id = dto.batting_first_team_id;
      match.innings_1_batting_team_id = dto.batting_first_team_id;
      match.innings_2_batting_team_id = bowlingTeamId;

      match.team_a_max_wickets = (match.team_a_player_count ?? 11) - 1;
      match.team_b_max_wickets = (match.team_b_player_count ?? 11) - 1;

      match.striker_id = dto.opening_striker_id || null as any;
      match.striker_guest_name = dto.opening_striker_guest_name || null as any;
      match.non_striker_id = dto.opening_non_striker_id || null as any;
      match.non_striker_guest_name = dto.opening_non_striker_guest_name || null as any;
      match.current_bowler_id = dto.opening_bowler_id || null as any;
      match.current_bowler_guest_name = dto.opening_bowler_guest_name || null as any;

      await manager.save(CricketMatch, match);
    });

    try {
      const captains = [match.team_a.captain?.user, match.team_b.captain?.user].filter(u => !!u);
      for (const captainUser of captains) {
        await this.notificationsService.create({
          user_id: captainUser.id,
          type: NotificationType.MATCH_STARTED,
          title: 'Match is live',
          body: `${match.team_a.name} vs ${match.team_b.name} is now live! Watch ball-by-ball scoring.`,
          deep_link: `/sports/cricket/matches/${match.id}`,
          metadata: { match_id: match.id },
        });
      }
    } catch (err: any) {
      console.warn(`Failed to send match started notification: ${err.message}`);
    }

    return this.findOneMatch(match.id);
  }

  async selectBowler(matchId: number, dto: SelectBowlerDto, userId: number): Promise<any> {
    const playerProfile = await this.getCurrentPlayerProfile(userId);

    const match = await this.matchRepo.findOne({
      where: { id: matchId },
      relations: {
        team_a: true,
        team_b: true,
      },
    });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.status !== MatchStatus.LIVE) {
      throw new BadRequestException('Match is not live');
    }

    if (match.scorer_id !== playerProfile.id) {
      throw new ForbiddenException('Only the assigned scorer can select bowlers');
    }

    if (match.current_bowler_id || match.current_bowler_guest_name) {
      const isSameBowler =
        (dto.bowler_id && match.current_bowler_id === dto.bowler_id) ||
        (dto.bowler_guest_name && match.current_bowler_guest_name === dto.bowler_guest_name);
      if (isSameBowler) {
        return this.findOneMatch(match.id);
      }
      throw new BadRequestException('A bowler is already set for the current over');
    }

    const matchPlayers = await this.matchPlayerRepo.find({
      where: { match_id: match.id },
    });

    const bowlingTeamId = match.current_batting_team_id === match.team_a_id ? match.team_b_id : match.team_a_id;
    const bowlingLineup = matchPlayers.filter(mp => mp.team_id === bowlingTeamId);

    if (dto.bowler_id) {
      const ok = bowlingLineup.some(mp => mp.player_id === dto.bowler_id);
      if (!ok) throw new BadRequestException('Selected bowler must be in the bowling team Playing XI');
    } else if (dto.bowler_guest_name && dto.bowler_guest_name.trim()) {
      const ok = bowlingLineup.some(mp => mp.guest_name === dto.bowler_guest_name);
      if (!ok) throw new BadRequestException('Selected bowler guest must be in the bowling team Playing XI');
    } else {
      throw new BadRequestException('Bowler is required');
    }

    if (!dto.bypass_consecutive_check && match.last_ball_event_id) {
      const lastBall = await this.ballEventRepo.findOne({
        where: { id: match.last_ball_event_id },
      });
      if (lastBall && lastBall.over_number === match.current_over - 1) {
        if (dto.bowler_id && lastBall.bowler_id === dto.bowler_id) {
          throw new BadRequestException('Bowler cannot bowl two consecutive overs');
        }
        if (dto.bowler_guest_name && lastBall.bowler_guest_name === dto.bowler_guest_name) {
          throw new BadRequestException('Bowler cannot bowl two consecutive overs');
        }
      }
    }

    match.current_bowler_id = dto.bowler_id || null as any;
    match.current_bowler_guest_name = dto.bowler_guest_name || null as any;

    await this.matchRepo.save(match);
    return this.findOneMatch(match.id);
  }

  async startSecondInnings(matchId: number, dto: StartSecondInningsDto, userId: number): Promise<any> {
    const playerProfile = await this.getCurrentPlayerProfile(userId);

    const match = await this.matchRepo.findOne({
      where: { id: matchId },
      relations: {
        team_a: true,
        team_b: true,
      },
    });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.status !== MatchStatus.LIVE) {
      throw new BadRequestException('Match is not live');
    }

    if (match.current_innings !== 2) {
      throw new BadRequestException('Second innings is not active');
    }

    if (match.striker_id || match.striker_guest_name) {
      return this.findOneMatch(match.id);
    }

    if (match.scorer_id !== playerProfile.id) {
      throw new ForbiddenException('Only the assigned scorer can start the second innings');
    }

    const matchPlayers = await this.matchPlayerRepo.find({
      where: { match_id: match.id },
    });

    const battingTeamId = match.current_batting_team_id;
    const bowlingTeamId = battingTeamId === match.team_a_id ? match.team_b_id : match.team_a_id;

    const battingLineup = matchPlayers.filter(mp => mp.team_id === battingTeamId);
    const bowlingLineup = matchPlayers.filter(mp => mp.team_id === bowlingTeamId);

    // Striker validation
    if (dto.opening_striker_id) {
      const ok = battingLineup.some(mp => mp.player_id === dto.opening_striker_id);
      if (!ok) throw new BadRequestException('Opening striker must be in the batting team Playing XI');
    } else if (dto.opening_striker_guest_name && dto.opening_striker_guest_name.trim()) {
      const ok = battingLineup.some(mp => mp.guest_name === dto.opening_striker_guest_name);
      if (!ok) throw new BadRequestException('Opening striker guest must be in the batting team Playing XI');
    } else {
      throw new BadRequestException('Opening striker is required');
    }

    // Non-striker validation
    if (dto.opening_non_striker_id) {
      const ok = battingLineup.some(mp => mp.player_id === dto.opening_non_striker_id);
      if (!ok) throw new BadRequestException('Opening non-striker must be in the batting team Playing XI');
    } else if (dto.opening_non_striker_guest_name && dto.opening_non_striker_guest_name.trim()) {
      const ok = battingLineup.some(mp => mp.guest_name === dto.opening_non_striker_guest_name);
      if (!ok) throw new BadRequestException('Opening non-striker guest must be in the batting team Playing XI');
    } else {
      throw new BadRequestException('Opening non-striker is required');
    }

    // Bowler validation
    if (dto.opening_bowler_id) {
      const ok = bowlingLineup.some(mp => mp.player_id === dto.opening_bowler_id);
      if (!ok) throw new BadRequestException('Opening bowler must be in the bowling team Playing XI');
    } else if (dto.opening_bowler_guest_name && dto.opening_bowler_guest_name.trim()) {
      const ok = bowlingLineup.some(mp => mp.guest_name === dto.opening_bowler_guest_name);
      if (!ok) throw new BadRequestException('Opening bowler guest must be in the bowling team Playing XI');
    } else {
      throw new BadRequestException('Opening bowler is required');
    }

    match.striker_id = dto.opening_striker_id || null as any;
    match.striker_guest_name = dto.opening_striker_guest_name || null as any;
    match.non_striker_id = dto.opening_non_striker_id || null as any;
    match.non_striker_guest_name = dto.opening_non_striker_guest_name || null as any;
    match.current_bowler_id = dto.opening_bowler_id || null as any;
    match.current_bowler_guest_name = dto.opening_bowler_guest_name || null as any;

    await this.matchRepo.save(match);
    return this.findOneMatch(match.id);
  }

  private async transitionInnings(match: CricketMatch, entityManager: EntityManager): Promise<void> {
    if (match.current_innings === 1) {
      match.target = match.innings_1_score + 1;
      match.current_innings = 2;
      match.current_over = 0;
      match.current_ball = 0;
      const nextBattingTeamId = match.innings_1_batting_team_id === match.team_a_id ? match.team_b_id : match.team_a_id;
      match.current_batting_team_id = nextBattingTeamId;
      match.innings_2_batting_team_id = nextBattingTeamId;

      match.striker_id = null as any;
      match.striker_guest_name = null as any;
      match.non_striker_id = null as any;
      match.non_striker_guest_name = null as any;
      match.current_bowler_id = null as any;
      match.current_bowler_guest_name = null as any;

      await entityManager.save(CricketMatch, match);
    } else if (match.current_innings === 2) {
      await this.completeMatch(match, entityManager);
    }
  }

  private async completeMatch(match: CricketMatch, entityManager: EntityManager): Promise<void> {
    let winner_team_id: number | null = null;
    let is_tie = false;

    const score2 = match.innings_2_score;
    const targetVal = match.target || 0;

    if (score2 >= targetVal) {
      winner_team_id = match.innings_2_batting_team_id || null;
    } else if (score2 < targetVal - 1) {
      winner_team_id = match.innings_1_batting_team_id || null;
    } else {
      is_tie = true;
      winner_team_id = null;
    }

    match.winner_team_id = winner_team_id || undefined;
    match.is_tie = is_tie;

    const score1Str = `${match.innings_1_score}/${match.innings_1_wickets} (${match.innings_1_overs})`;
    const score2Str = `${match.innings_2_score}/${match.innings_2_wickets} (${match.innings_2_overs})`;

    if (match.innings_1_batting_team_id === match.team_a_id) {
      match.team_a_score = score1Str;
      match.team_b_score = score2Str;
    } else {
      match.team_a_score = score2Str;
      match.team_b_score = score1Str;
    }

    const now = new Date();
    const lockedAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    match.status = MatchStatus.COMPLETED;
    match.result_submitted_at = now;
    match.result_locked_at = lockedAt;

    await entityManager.save(CricketMatch, match);

    const ballEvents = await entityManager.find(CricketBallEvent, {
      where: { match_id: match.id },
    });

    const matchPlayers = await entityManager.find(CricketMatchPlayer, {
      where: { match_id: match.id },
    });

    const existingStats = await entityManager.find(CricketPlayerMatchStats, {
      where: { match_id: match.id },
    });

    const statsToSave: CricketPlayerMatchStats[] = [];

    const strikerKey = match.striker_id ? `p-${match.striker_id}` : (match.striker_guest_name ? `g-${match.striker_guest_name}` : null);
    const nonStrikerKey = match.non_striker_id ? `p-${match.non_striker_id}` : (match.non_striker_guest_name ? `g-${match.non_striker_guest_name}` : null);

    for (const mp of matchPlayers) {
      const battingEvents = ballEvents.filter(e =>
        mp.player_id ? e.batsman_id === mp.player_id : e.batsman_guest_name === mp.guest_name
      );

      const bowlingEvents = ballEvents.filter(e =>
        mp.player_id ? e.bowler_id === mp.player_id : e.bowler_guest_name === mp.guest_name
      );

      const runs = battingEvents.reduce((sum, e) => sum + (e.runs || 0), 0);
      const ballsFaced = battingEvents.filter(e => e.extra_type !== BallExtraType.WIDE).length;
      const fours = battingEvents.filter(e => e.extra_type !== BallExtraType.WIDE && e.runs === 4).length;
      const sixes = battingEvents.filter(e => e.extra_type !== BallExtraType.WIDE && e.runs === 6).length;

      // Sort batting events to get the most recent wicket event
      const sortedBattingEvents = [...battingEvents].sort((a, b) => a.innings - b.innings || a.over_number - b.over_number || a.ball_number - b.ball_number);
      const wicketEvents = sortedBattingEvents.filter(e => e.is_wicket);
      const lastWicketEvent = wicketEvents.length > 0 ? wicketEvents[wicketEvents.length - 1] : undefined;

      const howOut = lastWicketEvent ? (lastWicketEvent.wicket_type as HowOut) : undefined;
      const isNotOut = !lastWicketEvent || lastWicketEvent.wicket_type === HowOut.RETIRED_HURT;

      const legalBowledEvents = bowlingEvents.filter(e => e.extra_type !== BallExtraType.WIDE && e.extra_type !== BallExtraType.NO_BALL);
      const legalBalls = legalBowledEvents.length;
      const oversBowled = Math.floor(legalBalls / 6) + (legalBalls % 6) / 10;

      const runsGiven = bowlingEvents.reduce((sum, e) => {
        if (e.extra_type === BallExtraType.BYE || e.extra_type === BallExtraType.LEG_BYE) {
          return sum;
        }
        return sum + (e.runs || 0) + (e.extra_runs || 0);
      }, 0);

      const wickets = bowlingEvents.filter(e =>
        e.is_wicket && e.wicket_type !== HowOut.RUN_OUT && e.wicket_type !== HowOut.RETIRED_HURT && e.wicket_type !== HowOut.RETIRED_OUT
      ).length;

      const wides = bowlingEvents.filter(e => e.extra_type === BallExtraType.WIDE).length;
      const noBalls = bowlingEvents.filter(e => e.extra_type === BallExtraType.NO_BALL).length;

      const mpKey = mp.player_id ? `p-${mp.player_id}` : (mp.guest_name ? `g-${mp.guest_name}` : null);
      const isStriker = mpKey && strikerKey === mpKey;
      const isNonStriker = mpKey && nonStrikerKey === mpKey;

      const existingStat = existingStats.find(s =>
        mp.player_id ? s.player_id === mp.player_id : s.guest_name === mp.guest_name
      );

      let status: 'not_batted' | 'batting' | 'out' | 'retired_hurt' | 'retired_out' = 'not_batted';
      let finalHowOut = howOut;
      let finalIsNotOut = isNotOut;

      if (isStriker || isNonStriker) {
        status = 'batting';
        finalHowOut = undefined;
        finalIsNotOut = true;
      } else if (existingStat && (existingStat.status === 'retired_hurt' || existingStat.status === 'retired_out')) {
        status = existingStat.status;
        finalHowOut = existingStat.how_out;
        finalIsNotOut = existingStat.is_not_out;
      } else if (battingEvents.length > 0) {
        if (lastWicketEvent) {
          if (lastWicketEvent.wicket_type === HowOut.RETIRED_HURT) {
            status = 'retired_hurt';
            finalHowOut = HowOut.RETIRED_HURT;
            finalIsNotOut = true;
          } else if (lastWicketEvent.wicket_type === HowOut.RETIRED_OUT) {
            status = 'retired_out';
            finalHowOut = HowOut.RETIRED_OUT;
            finalIsNotOut = false;
          } else {
            status = 'out';
            finalHowOut = lastWicketEvent.wicket_type as HowOut;
            finalIsNotOut = false;
          }
        } else {
          status = 'out';
          finalHowOut = undefined;
          finalIsNotOut = false;
        }
      }

      const statRecord = entityManager.create(CricketPlayerMatchStats, {
        id: existingStat?.id,
        match_id: match.id,
        team_id: mp.team_id,
        player_id: mp.player_id || undefined,
        guest_name: mp.guest_name || undefined,
        runs,
        balls_faced: ballsFaced,
        fours,
        sixes,
        how_out: finalHowOut || undefined,
        is_not_out: finalIsNotOut,
        overs_bowled: oversBowled,
        runs_given: runsGiven,
        wickets,
        wides,
        no_balls: noBalls,
        status,
      });

      statsToSave.push(statRecord);
    }

    await entityManager.save(CricketPlayerMatchStats, statsToSave);

    const registeredPlayerIds = Array.from(
      new Set(
        matchPlayers
          .map(mp => mp.player_id)
          .filter((id): id is number => !!id)
      )
    );

    for (const pId of registeredPlayerIds) {
      await this.aggregatePlayerStats(pId, entityManager);
    }

    try {
      const fullMatch = await entityManager.findOne(CricketMatch, {
        where: { id: match.id },
        relations: {
          team_a: { captain: { user: true } },
          team_b: { captain: { user: true } },
        },
      });

      if (fullMatch) {
        let notificationTitle = 'Match completed';
        if (is_tie) {
          notificationTitle = 'Match tied';
        } else if (winner_team_id) {
          const winningTeamName = winner_team_id === fullMatch.team_a_id ? fullMatch.team_a.name : fullMatch.team_b.name;
          notificationTitle = `${winningTeamName} won the match`;
        }

        const captains = [fullMatch.team_a.captain?.user, fullMatch.team_b.captain?.user].filter(u => !!u);
        for (const captainUser of captains) {
          await this.notificationsService.create({
            user_id: captainUser.id,
            type: NotificationType.MATCH_COMPLETED,
            title: notificationTitle,
            body: `Match final score: ${fullMatch.team_a_score} vs ${fullMatch.team_b_score}. Click to see scorecard.`,
            deep_link: `/sports/cricket/matches/${fullMatch.id}`,
            metadata: { match_id: fullMatch.id },
          });
        }
      }
    } catch (err: any) {
      console.warn(`Failed to send match completion notification: ${err.message}`);
    }
  }

  async recordBall(matchId: number, dto: RecordBallDto, userId: number): Promise<any> {
    const playerProfile = await this.getCurrentPlayerProfile(userId);

    const match = await this.matchRepo.findOne({
      where: { id: matchId },
      relations: {
        team_a: { captain: { user: true } },
        team_b: { captain: { user: true } },
      },
    });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.status !== MatchStatus.LIVE) {
      throw new BadRequestException('Match is not live');
    }

    if (match.scorer_id !== playerProfile.id) {
      throw new ForbiddenException('Only the assigned scorer can record balls');
    }

    if (!match.striker_id && !match.striker_guest_name) {
      throw new BadRequestException('No striker batsman set on the field');
    }

    if (!match.current_bowler_id && !match.current_bowler_guest_name) {
      throw new BadRequestException('No bowler set for the current over. Please select a bowler first.');
    }

    const isLegal = dto.extra_type !== BallExtraType.WIDE && dto.extra_type !== BallExtraType.NO_BALL;

    const matchPlayers = await this.matchPlayerRepo.find({
      where: { match_id: match.id },
    });

    const battingTeamId = match.current_batting_team_id;
    const battingLineup = matchPlayers.filter(mp => mp.team_id === battingTeamId);

    const currentWickets = match.current_innings === 1 ? match.innings_1_wickets : match.innings_2_wickets;
    const isWicket = dto.is_wicket;

    if (isWicket) {
      if (!dto.wicket_type) {
        throw new BadRequestException('Wicket type is required when is_wicket is true');
      }

      if (dto.wicket_type === HowOut.RETIRED_HURT || dto.wicket_type === HowOut.RETIRED_OUT) {
        throw new BadRequestException('Batsman retirement must be done via the retire endpoint');
      }

      const maxWickets = match.current_batting_team_id === match.team_a_id
        ? (match.team_a_max_wickets ?? 10)
        : (match.team_b_max_wickets ?? 10);
      
      const willNeedNextBatsman = currentWickets < (maxWickets - 1);

      if (willNeedNextBatsman) {
        if (!dto.next_batsman_id && (!dto.next_batsman_guest_name || !dto.next_batsman_guest_name.trim())) {
          throw new BadRequestException('Next batsman is required for wicket event');
        }
        if (dto.next_batsman_id) {
          const ok = battingLineup.some(mp => mp.player_id === dto.next_batsman_id);
          if (!ok) throw new BadRequestException('Next batsman must belong to the batting Playing XI');
          if (dto.next_batsman_id === match.non_striker_id) {
            throw new BadRequestException('Next batsman cannot be the current non-striker');
          }
        } else if (dto.next_batsman_guest_name) {
          const ok = battingLineup.some(mp => mp.guest_name === dto.next_batsman_guest_name);
          if (!ok) throw new BadRequestException('Next batsman guest must belong to the batting Playing XI');
          if (dto.next_batsman_guest_name === match.non_striker_guest_name) {
            throw new BadRequestException('Next batsman guest cannot be the current non-striker');
          }
        }
      }
    }

    await this.matchRepo.manager.transaction(async (manager) => {
      const existingBallsCount = await manager.count(CricketBallEvent, {
        where: {
          match_id: match.id,
          innings: match.current_innings,
          over_number: match.current_over,
        },
      });

      const event = manager.create(CricketBallEvent, {
        match_id: match.id,
        innings: match.current_innings,
        over_number: match.current_over,
        ball_number: existingBallsCount,
        batsman_id: match.striker_id || undefined,
        batsman_guest_name: match.striker_guest_name || undefined,
        bowler_id: match.current_bowler_id || undefined,
        bowler_guest_name: match.current_bowler_guest_name || undefined,
        runs: dto.runs,
        extra_type: dto.extra_type || undefined,
        extra_runs: dto.extra_runs || 0,
        is_wicket: dto.is_wicket,
        wicket_type: dto.wicket_type || undefined,
      });

      const savedEvent = await manager.save(CricketBallEvent, event);
      match.last_ball_event_id = savedEvent.id;

      const totalRunsThisBall = dto.runs + (dto.extra_runs || 0);

      if (match.current_innings === 1) {
        match.innings_1_score += totalRunsThisBall;
        if (isWicket) match.innings_1_wickets += 1;
      } else {
        match.innings_2_score += totalRunsThisBall;
        if (isWicket) match.innings_2_wickets += 1;
      }

      if (dto.runs % 2 !== 0) {
        const tempStrikerId = match.striker_id;
        const tempStrikerGuest = match.striker_guest_name;
        match.striker_id = match.non_striker_id;
        match.striker_guest_name = match.non_striker_guest_name;
        match.non_striker_id = tempStrikerId;
        match.non_striker_guest_name = tempStrikerGuest;
      }

      let overEnded = false;
      if (isLegal) {
        match.current_ball += 1;
        if (match.current_ball === 6) {
          match.current_ball = 0;
          match.current_over += 1;
          overEnded = true;
        }
      }

      if (match.current_innings === 1) {
        match.innings_1_overs = match.current_over + (match.current_ball / 10);
      } else {
        match.innings_2_overs = match.current_over + (match.current_ball / 10);
      }

      if (isWicket) {
        const finalWickets = match.current_innings === 1 ? match.innings_1_wickets : match.innings_2_wickets;
        const maxWickets = match.current_batting_team_id === match.team_a_id
          ? (match.team_a_max_wickets ?? 10)
          : (match.team_b_max_wickets ?? 10);
        if (finalWickets >= maxWickets) {
          match.striker_id = null as any;
          match.striker_guest_name = null as any;
        } else {
          match.striker_id = dto.next_batsman_id || null as any;
          match.striker_guest_name = dto.next_batsman_guest_name || null as any;
        }
      }

      if (overEnded) {
        const tempStrikerId = match.striker_id;
        const tempStrikerGuest = match.striker_guest_name;
        match.striker_id = match.non_striker_id;
        match.striker_guest_name = match.non_striker_guest_name;
        match.non_striker_id = tempStrikerId;
        match.non_striker_guest_name = tempStrikerGuest;

        match.current_bowler_id = null as any;
        match.current_bowler_guest_name = null as any;
      }

      await manager.save(CricketMatch, match);

      const finalWickets = match.current_innings === 1 ? match.innings_1_wickets : match.innings_2_wickets;
      const maxWickets = match.current_batting_team_id === match.team_a_id
        ? (match.team_a_max_wickets ?? 10)
        : (match.team_b_max_wickets ?? 10);
      const isEndConditions = finalWickets >= maxWickets || match.current_over >= match.overs;

      if (match.current_innings === 1 && isEndConditions) {
        await this.transitionInnings(match, manager);
      } else if (match.current_innings === 2) {
        const targetReached = match.target !== null && match.target !== undefined && match.innings_2_score >= match.target;
        if (isEndConditions || targetReached) {
          await this.completeMatch(match, manager);
        }
      }
    });

    return this.findOneMatch(match.id);
  }

  async retireBatsman(matchId: number, dto: RetireBatsmanDto, userId: number): Promise<any> {
    const playerProfile = await this.getCurrentPlayerProfile(userId);

    const match = await this.matchRepo.findOne({
      where: { id: matchId },
      relations: {
        team_a: { captain: { user: true } },
        team_b: { captain: { user: true } },
      },
    });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.status !== MatchStatus.LIVE) {
      throw new BadRequestException('Match is not live');
    }

    if (match.scorer_id !== playerProfile.id) {
      throw new ForbiddenException('Only the assigned scorer can retire batsmen');
    }

    const target = dto.target;
    const retiredPlayerId = target === 'striker' ? match.striker_id : match.non_striker_id;
    const retiredGuestName = target === 'striker' ? match.striker_guest_name : match.non_striker_guest_name;

    if (!retiredPlayerId && !retiredGuestName) {
      throw new BadRequestException(`No batsman found at the ${target} position to retire`);
    }

    const matchPlayers = await this.matchPlayerRepo.find({
      where: { match_id: match.id },
    });

    const battingTeamId = match.current_batting_team_id;
    const battingLineup = matchPlayers.filter(mp => mp.team_id === battingTeamId);

    const currentWickets = match.current_innings === 1 ? match.innings_1_wickets : match.innings_2_wickets;
    const isRetiredOut = dto.retirement_type === 'retired_out';

    // Get stats to find available players
    const stats = await this.statsRepo.find({
      where: { match_id: match.id, team_id: battingTeamId },
    });

    const activeStrikerId = match.striker_id;
    const activeStrikerGuest = match.striker_guest_name;
    const activeNonStrikerId = match.non_striker_id;
    const activeNonStrikerGuest = match.non_striker_guest_name;

    const availablePlayers = battingLineup.filter(mp => {
      // Exclude current striker/non-striker
      if (mp.player_id && (mp.player_id === activeStrikerId || mp.player_id === activeNonStrikerId)) return false;
      if (mp.guest_name && (mp.guest_name === activeStrikerGuest || mp.guest_name === activeNonStrikerGuest)) return false;

      const pStat = stats.find(s => mp.player_id ? s.player_id === mp.player_id : s.guest_name === mp.guest_name);
      if (!pStat) return true;
      return pStat.status === 'not_batted' || pStat.status === 'retired_hurt';
    });

    const hasAvailableBatsmen = availablePlayers.length > 0;
    const maxWickets = match.current_batting_team_id === match.team_a_id
      ? (match.team_a_max_wickets ?? 10)
      : (match.team_b_max_wickets ?? 10);

    const futureWickets = currentWickets + (isRetiredOut ? 1 : 0);

    let willNeedNextBatsman = false;
    if (!isRetiredOut) {
      willNeedNextBatsman = hasAvailableBatsmen;
    } else {
      willNeedNextBatsman = futureWickets < maxWickets && hasAvailableBatsmen;
    }

    if (willNeedNextBatsman) {
      if (!dto.next_batsman_id && (!dto.next_batsman_guest_name || !dto.next_batsman_guest_name.trim())) {
        throw new BadRequestException('Next batsman is required');
      }
      if (dto.next_batsman_id) {
        const ok = battingLineup.some(mp => mp.player_id === dto.next_batsman_id);
        if (!ok) throw new BadRequestException('Next batsman must belong to the batting Playing XI');
        if (dto.next_batsman_id === (target === 'striker' ? match.non_striker_id : match.striker_id)) {
          throw new BadRequestException('Next batsman cannot be the other active batsman');
        }
      } else if (dto.next_batsman_guest_name) {
        const ok = battingLineup.some(mp => mp.guest_name === dto.next_batsman_guest_name);
        if (!ok) throw new BadRequestException('Next batsman guest must belong to the batting Playing XI');
        if (dto.next_batsman_guest_name === (target === 'striker' ? match.non_striker_guest_name : match.striker_guest_name)) {
          throw new BadRequestException('Next batsman guest cannot be the other active batsman');
        }
      }
    }

    await this.matchRepo.manager.transaction(async (manager) => {
      // 1. Update the retired batsman's stats record
      let pStat = stats.find(s => retiredPlayerId ? s.player_id === retiredPlayerId : s.guest_name === retiredGuestName);
      if (!pStat) {
        pStat = manager.create(CricketPlayerMatchStats, {
          id: undefined,
          match_id: match.id,
          team_id: battingTeamId,
          player_id: retiredPlayerId || undefined,
          guest_name: retiredGuestName || undefined,
          runs: 0,
          balls_faced: 0,
          fours: 0,
          sixes: 0,
        });
      }

      pStat.status = dto.retirement_type;
      pStat.how_out = dto.retirement_type as HowOut;
      pStat.is_not_out = dto.retirement_type === 'retired_hurt';
      await manager.save(CricketPlayerMatchStats, pStat);

      // 2. If retired out, increment wickets in match
      if (isRetiredOut) {
        if (match.current_innings === 1) {
          match.innings_1_wickets += 1;
        } else {
          match.innings_2_wickets += 1;
        }
      }

      // 3. Replace the batsman at the target position
      if (target === 'striker') {
        if (willNeedNextBatsman) {
          match.striker_id = dto.next_batsman_id || null as any;
          match.striker_guest_name = dto.next_batsman_guest_name || null as any;
        } else {
          match.striker_id = null as any;
          match.striker_guest_name = null as any;
        }
      } else {
        if (willNeedNextBatsman) {
          match.non_striker_id = dto.next_batsman_id || null as any;
          match.non_striker_guest_name = dto.next_batsman_guest_name || null as any;
        } else {
          match.non_striker_id = null as any;
          match.non_striker_guest_name = null as any;
        }
      }

      await manager.save(CricketMatch, match);

      // 4. Check end conditions for second innings / first innings transition
      const finalWickets = match.current_innings === 1 ? match.innings_1_wickets : match.innings_2_wickets;
      const isEndConditions = finalWickets >= maxWickets || (dto.retirement_type === 'retired_hurt' && !hasAvailableBatsmen && !match.striker_id && !match.non_striker_id);

      if (match.current_innings === 1 && isEndConditions) {
        await this.transitionInnings(match, manager);
      } else if (match.current_innings === 2) {
        const targetReached = match.target !== null && match.target !== undefined && match.innings_2_score >= match.target;
        if (isEndConditions || targetReached) {
          await this.completeMatch(match, manager);
        }
      }

      // 5. Aggregate player stats
      const registeredPlayerIds = Array.from(
        new Set(
          matchPlayers
            .map(mp => mp.player_id)
            .filter((id): id is number => !!id)
        )
      );
      for (const pId of registeredPlayerIds) {
        await this.aggregatePlayerStats(pId, manager);
      }
    });

    return this.findOneMatch(match.id);
  }

  async undoLastBall(matchId: number, userId: number): Promise<any> {
    const playerProfile = await this.getCurrentPlayerProfile(userId);

    const match = await this.matchRepo.findOne({
      where: { id: matchId },
    });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.status !== MatchStatus.LIVE) {
      throw new BadRequestException('Match is not live');
    }

    if (match.scorer_id !== playerProfile.id) {
      throw new ForbiddenException('Only the assigned scorer can undo balls');
    }

    if (!match.last_ball_event_id) {
      throw new BadRequestException('No ball to undo');
    }

    const ballEvent = await this.ballEventRepo.findOne({
      where: { id: match.last_ball_event_id },
    });
    if (!ballEvent) {
      throw new NotFoundException('Last ball event not found');
    }

    if (ballEvent.innings !== match.current_innings) {
      throw new BadRequestException('Cannot undo a delivery from a completed innings');
    }

    await this.matchRepo.manager.transaction(async (manager) => {
      const totalRunsThisBall = ballEvent.runs + ballEvent.extra_runs;
      if (match.current_innings === 1) {
        match.innings_1_score = Math.max(0, match.innings_1_score - totalRunsThisBall);
        if (ballEvent.is_wicket) match.innings_1_wickets = Math.max(0, match.innings_1_wickets - 1);
      } else {
        match.innings_2_score = Math.max(0, match.innings_2_score - totalRunsThisBall);
        if (ballEvent.is_wicket) match.innings_2_wickets = Math.max(0, match.innings_2_wickets - 1);
      }

      if (ballEvent.runs % 2 !== 0) {
        const tempStrikerId = match.striker_id;
        const tempStrikerGuest = match.striker_guest_name;
        match.striker_id = match.non_striker_id;
        match.striker_guest_name = match.non_striker_guest_name;
        match.non_striker_id = tempStrikerId;
        match.non_striker_guest_name = tempStrikerGuest;
      }

      const isLegal = ballEvent.extra_type !== BallExtraType.WIDE && ballEvent.extra_type !== BallExtraType.NO_BALL;

      if (isLegal) {
        if (match.current_ball === 0) {
          match.current_ball = 5;
          match.current_over -= 1;

          const tempStrikerId = match.striker_id;
          const tempStrikerGuest = match.striker_guest_name;
          match.striker_id = match.non_striker_id;
          match.striker_guest_name = match.non_striker_guest_name;
          match.non_striker_id = tempStrikerId;
          match.non_striker_guest_name = tempStrikerGuest;

          match.current_bowler_id = ballEvent.bowler_id || null as any;
          match.current_bowler_guest_name = ballEvent.bowler_guest_name || null as any;
        } else {
          match.current_ball -= 1;
        }
      }

      if (match.current_innings === 1) {
        match.innings_1_overs = match.current_over + (match.current_ball / 10);
      } else {
        match.innings_2_overs = match.current_over + (match.current_ball / 10);
      }

      if (ballEvent.is_wicket) {
        match.striker_id = ballEvent.batsman_id || null as any;
        match.striker_guest_name = ballEvent.batsman_guest_name || null as any;
      }

      await manager.remove(CricketBallEvent, ballEvent);

      const prevEvent = await manager.findOne(CricketBallEvent, {
        where: {
          match_id: match.id,
        },
        order: { id: 'DESC' },
      });

      match.last_ball_event_id = prevEvent ? prevEvent.id : undefined;

      await manager.save(CricketMatch, match);
    });

    return this.findOneMatch(match.id);
  }

  async rotateStrike(matchId: number, userId: number): Promise<any> {
    const playerProfile = await this.getCurrentPlayerProfile(userId);

    const match = await this.matchRepo.findOne({
      where: { id: matchId },
    });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.status !== MatchStatus.LIVE) {
      throw new BadRequestException('Match is not live');
    }

    if (match.scorer_id !== playerProfile.id) {
      throw new ForbiddenException('Only the assigned scorer can rotate the strike');
    }

    const tempStrikerId = match.striker_id;
    const tempStrikerGuest = match.striker_guest_name;

    match.striker_id = match.non_striker_id;
    match.striker_guest_name = match.non_striker_guest_name;

    match.non_striker_id = tempStrikerId;
    match.non_striker_guest_name = tempStrikerGuest;

    await this.matchRepo.save(match);

    return this.findOneMatch(match.id);
  }

  async getLiveView(matchId: number): Promise<any> {
    const match = await this.matchRepo.findOne({
      where: { id: matchId },
      relations: {
        team_a: true,
        team_b: true,
        striker: { user: true },
        non_striker: { user: true },
        current_bowler: { user: true },
      },
    });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const currentInnings = match.current_innings || 1;
    const currentOver = match.current_over;

    const thisOverEvents = await this.ballEventRepo.find({
      where: {
        match_id: matchId,
        innings: currentInnings,
        over_number: currentOver,
      },
      order: { ball_number: 'ASC' },
    });

    const allEvents = await this.ballEventRepo.find({
      where: { match_id: matchId },
      relations: {
        batsman: { user: true },
        bowler: { user: true },
      },
    });

    const persistedStats = await this.statsRepo.find({
      where: { match_id: matchId },
    });

    const getBatsmanStats = (id?: number, guestName?: string) => {
      const playerEvents = allEvents.filter(e =>
        id ? e.batsman_id === id : e.batsman_guest_name === guestName
      );
      const runs = playerEvents.reduce((sum, e) => sum + e.runs, 0);
      const balls = playerEvents.filter(e => e.extra_type !== BallExtraType.WIDE).length;
      const fours = playerEvents.filter(e => e.runs === 4).length;
      const sixes = playerEvents.filter(e => e.runs === 6).length;
      return { runs, balls, fours, sixes };
    };

    const getBowlerStats = (id?: number, guestName?: string) => {
      const playerEvents = allEvents.filter(e =>
        id ? e.bowler_id === id : e.bowler_guest_name === guestName
      );
      const legalBowls = playerEvents.filter(e =>
        e.extra_type !== BallExtraType.WIDE && e.extra_type !== BallExtraType.NO_BALL
      ).length;
      const overs = `${Math.floor(legalBowls / 6)}.${legalBowls % 6}`;

      const runs_given = playerEvents.reduce((sum, e) => {
        if (e.extra_type === BallExtraType.BYE || e.extra_type === BallExtraType.LEG_BYE) {
          return sum;
        }
        return sum + e.runs + e.extra_runs;
      }, 0);

      const wickets = playerEvents.filter(e =>
        e.is_wicket && e.wicket_type !== HowOut.RUN_OUT && e.wicket_type !== HowOut.RETIRED_HURT && e.wicket_type !== HowOut.RETIRED_OUT
      ).length;

      return { overs, runs_given, wickets };
    };

    const strikerStats = (match.striker_id || match.striker_guest_name)
      ? getBatsmanStats(match.striker_id, match.striker_guest_name)
      : { runs: 0, balls: 0 };

    const nonStrikerStats = (match.non_striker_id || match.non_striker_guest_name)
      ? getBatsmanStats(match.non_striker_id, match.non_striker_guest_name)
      : { runs: 0, balls: 0 };

    const bowlerStats = (match.current_bowler_id || match.current_bowler_guest_name)
      ? getBowlerStats(match.current_bowler_id, match.current_bowler_guest_name)
      : { overs: '0.0', runs_given: 0, wickets: 0 };

    const scoreVal = currentInnings === 1 ? match.innings_1_score : match.innings_2_score;
    const oversBowledDecimal = match.current_over + (match.current_ball / 6);
    const currentRunRate = oversBowledDecimal > 0 ? parseFloat((scoreVal / oversBowledDecimal).toFixed(2)) : 0.0;

    let requiredRunRate: number | null = null;
    if (currentInnings === 2 && match.target !== null && match.target !== undefined) {
      const totalOvers = match.overs;
      const oversRemaining = totalOvers - oversBowledDecimal;
      const runsNeeded = match.target - match.innings_2_score;
      requiredRunRate = oversRemaining > 0 ? parseFloat((runsNeeded / oversRemaining).toFixed(2)) : 0.0;
      if (runsNeeded <= 0) requiredRunRate = 0.0;
    }

    const strikerObj = (match.striker_id || match.striker_guest_name) ? {
      id: match.striker_id || null,
      name: match.striker?.user?.name || match.striker_guest_name,
      avatar_url: match.striker?.user?.avatar_url || null,
      ...strikerStats,
    } : null;

    const nonStrikerObj = (match.non_striker_id || match.non_striker_guest_name) ? {
      id: match.non_striker_id || null,
      name: match.non_striker?.user?.name || match.non_striker_guest_name,
      avatar_url: match.non_striker?.user?.avatar_url || null,
      ...nonStrikerStats,
    } : null;

    const bowlerObj = (match.current_bowler_id || match.current_bowler_guest_name) ? {
      id: match.current_bowler_id || null,
      name: match.current_bowler?.user?.name || match.current_bowler_guest_name,
      avatar_url: match.current_bowler?.user?.avatar_url || null,
      ...bowlerStats,
    } : null;

    const scoreString = currentInnings === 1 
      ? `${match.innings_1_score}/${match.innings_1_wickets}` 
      : `${match.innings_2_score}/${match.innings_2_wickets}`;

    const oversString = `${match.current_over}.${match.current_ball}`;

    let lastBowler: any = null;
    const previousOverEvents = allEvents.filter(
      e => e.innings === currentInnings && e.over_number === currentOver - 1
    );
    if (previousOverEvents.length > 0) {
      const sampleBall = previousOverEvents[0];
      lastBowler = {
        id: sampleBall.bowler_id || null,
        name: sampleBall.bowler_guest_name || null,
      };
    }

    const dismissedPlayers = allEvents
      .filter(e => e.innings === currentInnings && e.is_wicket && e.wicket_type !== HowOut.RETIRED_HURT)
      .map(e => e.batsman_id ? `p-${e.batsman_id}` : `g-${e.batsman_guest_name}`);

    // 1. Calculate Extras for current innings
    const currentInningsEvents = allEvents.filter(e => e.innings === currentInnings);
    let cWides = 0, cNoBalls = 0, cByes = 0, cLegByes = 0;
    for (const e of currentInningsEvents) {
      if (e.extra_type === BallExtraType.WIDE) cWides += e.extra_runs || 0;
      else if (e.extra_type === BallExtraType.NO_BALL) cNoBalls += e.extra_runs || 0;
      else if (e.extra_type === BallExtraType.BYE) cByes += e.extra_runs || 0;
      else if (e.extra_type === BallExtraType.LEG_BYE) cLegByes += e.extra_runs || 0;
    }
    const cTotal = cWides + cNoBalls + cByes + cLegByes;
    const extrasString = `${cTotal} (w ${cWides}, nb ${cNoBalls}, b ${cByes}, lb ${cLegByes})`;

    // 2. Calculate Fall of Wickets
    let innings1Score = 0;
    let innings2Score = 0;
    const fall_of_wickets: any[] = [];
    const sortedEvents = [...allEvents].sort((a, b) => a.innings - b.innings || a.over_number - b.over_number || a.ball_number - b.ball_number);
    for (const event of sortedEvents) {
      const runsConceded = (event.runs || 0) + (event.extra_runs || 0);
      if (event.innings === 1) {
        innings1Score += runsConceded;
      } else if (event.innings === 2) {
        innings2Score += runsConceded;
      }

      if (event.is_wicket && event.wicket_type !== HowOut.RETIRED_HURT) {
        const playerName = event.batsman_guest_name || event.batsman?.user?.name || 'Guest';
        const wicketType = event.wicket_type || 'out';
        const overStr = `${event.over_number}.${event.ball_number}`;
        const scoreAtWicket = event.innings === 1 ? innings1Score : innings2Score;

        fall_of_wickets.push({
          player_name: playerName,
          wicket_type: wicketType,
          over: overStr,
          score_at_wicket: scoreAtWicket,
          innings: event.innings,
        });
      }
    }

    // 3. Calculate Live Player Stats
    const live_player_stats: any[] = [];
    const lineups = await this.getLineups(matchId);
    const allLineupPlayers = [
      ...lineups.team_a.players.map(p => ({ ...p, team_id: match.team_a_id })),
      ...lineups.team_b.players.map(p => ({ ...p, team_id: match.team_b_id })),
    ];

    for (const player of allLineupPlayers) {
      const isStriker = strikerObj && (player.player_id ? strikerObj.id === player.player_id : strikerObj.name === player.guest_name);
      const isNonStriker = nonStrikerObj && (player.player_id ? nonStrikerObj.id === player.player_id : nonStrikerObj.name === player.guest_name);

      const batsmanEvents = allEvents.filter(e =>
        player.player_id ? e.batsman_id === player.player_id : e.batsman_guest_name === player.guest_name
      );

      const runs = batsmanEvents.reduce((sum, e) => sum + (e.runs || 0), 0);
      const balls_faced = batsmanEvents.filter(e => e.extra_type !== BallExtraType.WIDE).length;
      const fours = batsmanEvents.filter(e => e.runs === 4).length;
      const sixes = batsmanEvents.filter(e => e.runs === 6).length;

      const playerWickets = allEvents.filter(e =>
        e.is_wicket && (player.player_id ? e.batsman_id === player.player_id : e.batsman_guest_name === player.guest_name)
      );
      const sortedPlayerWickets = [...playerWickets].sort((a, b) => a.innings - b.innings || a.over_number - b.over_number || a.ball_number - b.ball_number);
      const dismissalEvent = sortedPlayerWickets.length > 0 ? sortedPlayerWickets[sortedPlayerWickets.length - 1] : undefined;

      const existingStat = persistedStats.find(s =>
        player.player_id ? s.player_id === player.player_id : s.guest_name === player.guest_name
      );

      let how_out: string | null = null;
      let is_not_out = false;
      let status: 'not_batted' | 'batting' | 'out' | 'retired_hurt' | 'retired_out' = 'not_batted';

      if (isStriker || isNonStriker) {
        status = 'batting';
        is_not_out = true;
      } else if (existingStat && (existingStat.status === 'retired_hurt' || existingStat.status === 'retired_out')) {
        status = existingStat.status;
        how_out = existingStat.how_out || null;
        is_not_out = existingStat.is_not_out;
      } else if (dismissalEvent) {
        how_out = dismissalEvent.wicket_type || 'out';
        is_not_out = dismissalEvent.wicket_type === HowOut.RETIRED_HURT;
        if (dismissalEvent.wicket_type === HowOut.RETIRED_HURT) {
          status = 'retired_hurt';
        } else if (dismissalEvent.wicket_type === HowOut.RETIRED_OUT) {
          status = 'retired_out';
        } else {
          status = 'out';
        }
      } else if (balls_faced > 0) {
        status = 'out';
        is_not_out = true;
      }

      // Bowler stats
      const bowlerEvents = allEvents.filter(e =>
        player.player_id ? e.bowler_id === player.player_id : e.bowler_guest_name === player.guest_name
      );

      const legalBowls = bowlerEvents.filter(e =>
        e.extra_type !== BallExtraType.WIDE && e.extra_type !== BallExtraType.NO_BALL
      ).length;
      const overs_bowled = parseFloat(`${Math.floor(legalBowls / 6)}.${legalBowls % 6}`) || 0;

      const runs_given = bowlerEvents.reduce((sum, e) => {
        if (e.extra_type === BallExtraType.BYE || e.extra_type === BallExtraType.LEG_BYE) {
          return sum;
        }
        return sum + (e.runs || 0) + (e.extra_runs || 0);
      }, 0);

      const wickets = bowlerEvents.filter(e =>
        e.is_wicket && e.wicket_type !== HowOut.RUN_OUT && e.wicket_type !== HowOut.RETIRED_HURT && e.wicket_type !== HowOut.RETIRED_OUT
      ).length;

      const wides = bowlerEvents.filter(e => e.extra_type === BallExtraType.WIDE).length;
      const no_balls = bowlerEvents.filter(e => e.extra_type === BallExtraType.NO_BALL).length;

      // Calculate maidens
      let maidens = 0;
      const bowlerOversGrouped: Record<number, CricketBallEvent[]> = {};
      for (const e of bowlerEvents) {
        if (!bowlerOversGrouped[e.over_number]) {
          bowlerOversGrouped[e.over_number] = [];
        }
        bowlerOversGrouped[e.over_number].push(e);
      }

      for (const [overNum, events] of Object.entries(bowlerOversGrouped)) {
        const legalEvents = events.filter(e => e.extra_type !== BallExtraType.WIDE && e.extra_type !== BallExtraType.NO_BALL);
        if (legalEvents.length >= 6) {
          const overRuns = legalEvents.reduce((sum, e) => sum + (e.runs || 0) + (e.extra_runs || 0), 0);
          if (overRuns === 0) {
            maidens++;
          }
        }
      }

      live_player_stats.push({
        team_id: player.team_id,
        player_id: player.player_id,
        guest_name: player.guest_name,
        name: player.name,
        avatar_url: player.avatar_url,
        runs,
        balls_faced,
        fours,
        sixes,
        how_out,
        is_not_out,
        overs_bowled,
        runs_given,
        wickets,
        wides,
        no_balls,
        maidens,
        status,
      });
    }

    return {
      status: match.status,
      current_innings: currentInnings,
      score: scoreString,
      overs: oversString,
      target: match.target || null,
      current_run_rate: currentRunRate,
      required_run_rate: requiredRunRate,
      striker: strikerObj,
      non_striker: nonStrikerObj,
      bowler: bowlerObj,
      last_bowler: lastBowler,
      this_over: thisOverEvents.map(e => ({
        runs: e.runs,
        extra_type: e.extra_type || null,
        is_wicket: e.is_wicket,
      })),
      balls_remaining_in_over: 6 - match.current_ball,
      dismissed_players: dismissedPlayers,
      extras: extrasString,
      fall_of_wickets,
      live_player_stats,
      all_deliveries: allEvents.map(e => ({
        id: e.id,
        innings: e.innings,
        over_number: e.over_number,
        ball_number: e.ball_number,
        runs: e.runs,
        extra_runs: e.extra_runs,
        extra_type: e.extra_type || null,
        is_wicket: e.is_wicket,
        wicket_type: e.wicket_type || null,
        batsman: e.batsman_guest_name || e.batsman?.user?.name || 'Guest',
        bowler: e.bowler_guest_name || e.bowler?.user?.name || 'Bowler',
      })),
    };
  }
}

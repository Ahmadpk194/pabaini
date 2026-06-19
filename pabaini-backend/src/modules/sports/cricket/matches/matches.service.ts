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
import { MatchStatus, MatchScoringMode } from './enums/matches.enums';
import { TeamMemberStatus } from '../teams/enums/team-member-status.enum';
import { RequestMatchDto } from './dto/request-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { QueryMatchesDto } from './dto/query-matches.dto';
import { DeclareLineupDto } from './dto/declare-lineup.dto';
import { SubmitResultDto } from './dto/submit-result.dto';
import { EditResultDto } from './dto/edit-result.dto';


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
    let where: any = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.team_id) {
      if (query.status) {
        where = [
          { status: query.status, team_a_id: query.team_id },
          { status: query.status, team_b_id: query.team_id },
        ];
      } else {
        where = [
          { team_a_id: query.team_id },
          { team_b_id: query.team_id },
        ];
      }
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await this.matchRepo.findAndCount({
      where,
      relations: {
        team_a: true,
        team_b: true,
      },
      order: { created_at: 'DESC' },
      take: limit,
      skip,
    });

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

    const formattedStats = playerStats.map((s) => ({
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
      created_at: s.created_at,
      updated_at: s.updated_at,
    }));

    return {
      ...match,
      player_stats: formattedStats,
      is_result_editable: !!is_result_editable,
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
      match.man_of_match_id = dto.man_of_match_id || undefined;
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
      if (dto.man_of_match_id !== undefined) match.man_of_match_id = dto.man_of_match_id || undefined;
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

    if (dto.players.length !== 11) {
      throw new BadRequestException('Playing XI must have exactly 11 players');
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
    if (uniqueOrders.size !== 11) {
      throw new BadRequestException('Each player must have a unique batting order');
    }
    for (const order of battingOrders) {
      if (order < 1 || order > 11) {
        throw new BadRequestException('Batting order must be between 1 and 11');
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
      } else {
        match.team_b_lineup_set = true;
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
}

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, ILike } from 'typeorm';
import { Team } from './entities/team.entity';
import { TeamMember } from './entities/team-member.entity';
import { CricketPlayerProfile } from '../entities/cricket-player-profile.entity';
import { TeamMemberRole } from './enums/team-member-role.enum';
import { TeamMemberStatus } from './enums/team-member-status.enum';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { InvitePlayerDto } from './dto/invite-player.dto';
import { TransferCaptainDto } from './dto/transfer-captain.dto';
import { getSupabaseClient } from 'src/config/supabase.config';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { NotificationType } from 'src/modules/notifications/enums/notification-type.enum';
import { QueryTeamsDto } from './dto/query-teams.dto';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
    @InjectRepository(TeamMember)
    private readonly teamMemberRepo: Repository<TeamMember>,
    @InjectRepository(CricketPlayerProfile)
    private readonly playerProfileRepo: Repository<CricketPlayerProfile>,
    private readonly notificationsService: NotificationsService,
  ) { }

  async getCurrentPlayerProfile(userId: number): Promise<CricketPlayerProfile> {
    const profile = await this.playerProfileRepo.findOne({
      where: { user: { id: userId } },
    });
    if (!profile) {
      throw new ForbiddenException('You must set up a cricket player profile first');
    }
    return profile;
  }

  private async getCaptainMembership(teamId: number, playerProfileId: number): Promise<TeamMember> {
    const membership = await this.teamMemberRepo.findOne({
      where: {
        team: { id: teamId },
        player: { id: playerProfileId },
        role: TeamMemberRole.CAPTAIN,
        status: TeamMemberStatus.ACTIVE,
      },
    });
    if (!membership) {
      throw new ForbiddenException('Only the team captain can perform this action');
    }
    return membership;
  }

  async createTeam(createTeamDto: CreateTeamDto, userId: number): Promise<Team> {
    const playerProfile = await this.getCurrentPlayerProfile(userId);

    const activeCaptainCount = await this.teamRepo.count({
      where: {
        captain_id: playerProfile.id,
        is_active: true,
      },
    });

    if (activeCaptainCount >= 2) {
      throw new BadRequestException(
        'You are already captain of 2 active teams. Transfer captaincy or dissolve a team before creating a new one.',
      );
    }

    const existingTeam = await this.teamRepo.findOne({
      where: { name: createTeamDto.name },
    });
    if (existingTeam) {
      throw new ConflictException('Team name already exists');
    }

    const savedTeam = await this.teamRepo.manager.transaction(async (manager) => {
      const team = manager.create(Team, {
        ...createTeamDto,
        captain_id: playerProfile.id,
        captain: playerProfile,
      });
      const newTeam = await manager.save(Team, team);

      const teamMember = manager.create(TeamMember, {
        team_id: newTeam.id,
        team: newTeam,
        player_id: playerProfile.id,
        player: playerProfile,
        role: TeamMemberRole.CAPTAIN,
        status: TeamMemberStatus.ACTIVE,
        joined_at: new Date(),
      });
      await manager.save(TeamMember, teamMember);

      return newTeam;
    });

    return this.findOneTeam(savedTeam.id);
  }

  async findAllTeams(query: QueryTeamsDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { is_active: true };
    if (query.search && query.search.trim() !== '') {
      where.name = ILike(`%${query.search.trim()}%`);
    }

    const [teams, total] = await this.teamRepo.findAndCount({
      where,
      relations: {
        captain: { user: true },
        members: true,
      },
      order: { created_at: 'DESC' },
      take: limit,
      skip,
    });

    const mappedTeams = teams.map((t) => ({
      id: t.id,
      name: t.name,
      logo_url: t.logo_url,
      home_ground: t.home_ground,
      founded_year: t.founded_year,
      captain: {
        id: t.captain.id,
        user: {
          id: t.captain.user?.id,
          name: t.captain.user?.name,
          avatar_url: t.captain.user?.avatar_url,
        },
      },
      member_count: t.members.filter((m) => m.status === TeamMemberStatus.ACTIVE).length,
      created_at: t.created_at,
    }));

    return {
      data: mappedTeams,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findMyTeams(userId: number) {
    const playerProfile = await this.getCurrentPlayerProfile(userId);
    const memberships = await this.teamMemberRepo.find({
      where: [
        { player_id: playerProfile.id, status: TeamMemberStatus.ACTIVE },
        { player_id: playerProfile.id, status: TeamMemberStatus.PENDING_REQUEST },
        { player_id: playerProfile.id, status: TeamMemberStatus.PENDING_INVITE },
      ],
      relations: {
        team: {
          captain: { user: true },
          members: true,
        },
      },
      order: { joined_at: 'DESC' },
    });

    const results = await Promise.all(
      memberships.map(async (m) => {
        const teamId = m.team.id;
        
        // Count completed matches where this team was team_a or team_b
        const matchesCount = await this.teamRepo.manager
          .createQueryBuilder()
          .select('m.id')
          .from('cricket_matches', 'm')
          .where('m.status = :status AND (m.team_a_id = :teamId OR m.team_b_id = :teamId)', {
            status: 'completed',
            teamId,
          })
          .getCount();

        // Count completed matches where this team won
        const winsCount = await this.teamRepo.manager
          .createQueryBuilder()
          .select('m.id')
          .from('cricket_matches', 'm')
          .where('m.status = :status AND m.winner_team_id = :teamId', {
            status: 'completed',
            teamId,
          })
          .getCount();

        return {
          teamId,
          matchesCount,
          winsCount,
        };
      })
    );

    const statsMap = new Map(results.map((r) => [r.teamId, r]));

    return memberships.map((m) => {
      const stats = statsMap.get(m.team.id) || { matchesCount: 0, winsCount: 0 };
      const activeMembersCount = m.team.members.filter((mb) => mb.status === TeamMemberStatus.ACTIVE).length;

      return {
        id: m.team.id,
        name: m.team.name,
        logo_url: m.team.logo_url,
        home_ground: m.team.home_ground,
        founded_year: m.team.founded_year,
        captain: {
          id: m.team.captain.id,
          user: {
            id: m.team.captain.user?.id,
            name: m.team.captain.user?.name,
            avatar_url: m.team.captain.user?.avatar_url,
          },
        },
        role: m.role,
        status: m.status,
        joined_at: m.joined_at,
        member_count: activeMembersCount,
        matches_count: stats.matchesCount,
        wins_count: stats.winsCount,
      };
    });
  }

  async findOneTeam(teamId: number): Promise<Team> {
    const team = await this.teamRepo.findOne({
      where: { id: teamId, is_active: true },
      relations: {
        captain: { user: true },
        members: { player: { user: true } },
      },
    });
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    // Exclude permanently rejected/left members but keep pending so the
    // frontend can correctly determine the viewer's membership state.
    team.members = team.members.filter(
      (m) => m.status !== TeamMemberStatus.REJECTED && m.status !== TeamMemberStatus.LEFT,
    );
    return team;
  }

  async updateTeam(teamId: number, dto: UpdateTeamDto, userId: number): Promise<Team> {
    const playerProfile = await this.getCurrentPlayerProfile(userId);
    await this.getCaptainMembership(teamId, playerProfile.id);

    if (dto.name) {
      const existingTeam = await this.teamRepo.findOne({
        where: { name: dto.name, id: Not(teamId) },
      });
      if (existingTeam) {
        throw new ConflictException('Team name already exists');
      }
    }

    await this.teamRepo.update(teamId, dto);
    return this.findOneTeam(teamId);
  }

  async uploadLogo(teamId: number, file: any, userId: number): Promise<Team> {
    const playerProfile = await this.getCurrentPlayerProfile(userId);
    await this.getCaptainMembership(teamId, playerProfile.id);

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const team = await this.teamRepo.findOne({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');

    const fileExt = file.originalname.split('.').pop();
    const fileName = `${teamId}-${Date.now()}.${fileExt}`;
    const filePath = `teams/${fileName}`;

    const supabase = getSupabaseClient();

    if (team.logo_url) {
      try {
        const urlParts = team.logo_url.split('/pabaini-media/');
        if (urlParts.length === 2) {
          const oldFilePath = urlParts[1];
          await supabase.storage
            .from('pabaini-media')
            .remove([oldFilePath]);
        }
      } catch (error) {
        console.warn(`Failed to delete old team logo: ${error}`);
      }
    }

    const { error } = await supabase.storage
      .from('pabaini-media')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      throw new BadRequestException(`Failed to upload team logo: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('pabaini-media')
      .getPublicUrl(filePath);

    team.logo_url = publicUrl;
    await this.teamRepo.save(team);

    return this.findOneTeam(teamId);
  }

  async invitePlayer(teamId: number, invitePlayerDto: InvitePlayerDto, userId: number) {
    const playerProfile = await this.getCurrentPlayerProfile(userId);
    await this.getCaptainMembership(teamId, playerProfile.id);

    const team = await this.teamRepo.findOne({
      where: { id: teamId, is_active: true },
    });
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const targetPlayer = await this.playerProfileRepo.findOne({
      where: { id: invitePlayerDto.player_id, is_active: true },
      relations: { user: true },
    });
    if (!targetPlayer) {
      throw new NotFoundException('Target player not found or inactive');
    }

    const existingMembership = await this.teamMemberRepo.findOne({
      where: {
        team_id: teamId,
        player_id: invitePlayerDto.player_id,
      },
    });

    if (existingMembership) {
      if (existingMembership.status === TeamMemberStatus.ACTIVE) {
        throw new ConflictException('Player is already an active member of this team');
      }
      if (
        existingMembership.status === TeamMemberStatus.PENDING_INVITE ||
        existingMembership.status === TeamMemberStatus.PENDING_REQUEST
      ) {
        throw new ConflictException('A pending invite or request already exists for this player');
      }
    }

    if (invitePlayerDto.player_id === playerProfile.id) {
      throw new BadRequestException('Captain cannot invite themselves');
    }

    const newMember = existingMembership || new TeamMember();
    newMember.team_id = teamId;
    newMember.player_id = invitePlayerDto.player_id;
    newMember.role = TeamMemberRole.PLAYER;
    newMember.status = TeamMemberStatus.PENDING_INVITE;
    newMember.invited_by_id = playerProfile.id;
    newMember.invited_by = playerProfile;
    newMember.joined_at = undefined;

    await this.teamMemberRepo.save(newMember);

    // Trigger Notification
    try {
      await this.notificationsService.create({
        user_id: targetPlayer.user.id,
        type: NotificationType.TEAM_INVITE,
        title: `You were invited to join ${team.name}`,
        deep_link: `/sports/cricket/teams/${team.id}`,
        metadata: { team_id: team.id },
      });
    } catch (err) {
      console.warn(`Failed to create team invite notification for user ID ${targetPlayer.user.id}:`, err);
    }

    return { message: 'Invitation sent successfully' };
  }

  async joinRequest(teamId: number, userId: number) {
    const playerProfile = await this.getCurrentPlayerProfile(userId);

    const team = await this.teamRepo.findOne({
      where: { id: teamId, is_active: true },
      relations: { captain: { user: true } },
    });
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const currentPlayer = await this.playerProfileRepo.findOne({
      where: { id: playerProfile.id },
      relations: { user: true },
    });

    const existingMembership = await this.teamMemberRepo.findOne({
      where: {
        team_id: teamId,
        player_id: playerProfile.id,
      },
    });

    if (existingMembership) {
      if (existingMembership.status === TeamMemberStatus.ACTIVE) {
        throw new ConflictException('You are already an active member of this team');
      }
      if (
        existingMembership.status === TeamMemberStatus.PENDING_INVITE ||
        existingMembership.status === TeamMemberStatus.PENDING_REQUEST
      ) {
        throw new ConflictException('A pending invite or request already exists for this team');
      }
    }

    if (team.captain_id === playerProfile.id) {
      throw new BadRequestException('You are the captain of this team');
    }

    const requestMember = existingMembership || new TeamMember();
    requestMember.team_id = teamId;
    requestMember.player_id = playerProfile.id;
    requestMember.role = TeamMemberRole.PLAYER;
    requestMember.status = TeamMemberStatus.PENDING_REQUEST;
    requestMember.invited_by_id = undefined;
    requestMember.invited_by = undefined;
    requestMember.joined_at = undefined;

    await this.teamMemberRepo.save(requestMember);

    // Trigger Notification
    try {
      if (team.captain?.user && currentPlayer?.user) {
        await this.notificationsService.create({
          user_id: team.captain.user.id,
          type: NotificationType.TEAM_JOIN_REQUEST,
          title: `${currentPlayer.user.name} requested to join ${team.name}`,
          deep_link: `/sports/cricket/teams/${team.id}/manage`,
          metadata: { team_id: team.id, player_id: currentPlayer.id },
        });
      }
    } catch (err) {
      console.warn(`Failed to create team join request notification for team captain:`, err);
    }

    return { message: 'Join request sent successfully' };
  }

  async getPendingMembers(teamId: number, userId: number) {
    const playerProfile = await this.getCurrentPlayerProfile(userId);
    await this.getCaptainMembership(teamId, playerProfile.id);

    const pendingRequests = await this.teamMemberRepo.find({
      where: { team_id: teamId, status: TeamMemberStatus.PENDING_REQUEST },
      relations: { player: { user: true } },
    });

    const pendingInvites = await this.teamMemberRepo.find({
      where: { team_id: teamId, status: TeamMemberStatus.PENDING_INVITE },
      relations: { player: { user: true } },
    });

    return {
      pending_requests: pendingRequests,
      pending_invites: pendingInvites,
    };
  }

  async acceptMember(teamId: number, memberId: number, userId: number): Promise<TeamMember> {
    const playerProfile = await this.getCurrentPlayerProfile(userId);

    const member = await this.teamMemberRepo.findOne({
      where: { id: memberId, team_id: teamId },
      relations: { team: { captain: { user: true } }, player: { user: true } },
    });
    if (!member) {
      throw new NotFoundException('Team member record not found');
    }

    if (
      member.status !== TeamMemberStatus.PENDING_INVITE &&
      member.status !== TeamMemberStatus.PENDING_REQUEST
    ) {
      throw new BadRequestException('Membership status is not pending');
    }

    const isCaptain = member.team.captain_id === playerProfile.id;
    const isTargetPlayer = member.player_id === playerProfile.id;

    if (member.status === TeamMemberStatus.PENDING_REQUEST) {
      if (!isCaptain) {
        throw new ForbiddenException('Only the team captain can accept join requests');
      }
    } else if (member.status === TeamMemberStatus.PENDING_INVITE) {
      if (!isTargetPlayer) {
        throw new ForbiddenException('Only the invited player can accept invitations');
      }
    }

    const originalStatus = member.status;
    member.status = TeamMemberStatus.ACTIVE;
    member.joined_at = new Date();

    const savedMember = await this.teamMemberRepo.save(member);

    // Trigger Notification
    try {
      if (originalStatus === TeamMemberStatus.PENDING_REQUEST) {
        await this.notificationsService.create({
          user_id: savedMember.player.user.id,
          type: NotificationType.TEAM_REQUEST_ACCEPTED,
          title: `Your request to join ${savedMember.team.name} was accepted`,
          deep_link: `/sports/cricket/teams/${savedMember.team.id}`,
          metadata: { team_id: savedMember.team.id },
        });
      } else if (originalStatus === TeamMemberStatus.PENDING_INVITE) {
        await this.notificationsService.create({
          user_id: savedMember.team.captain.user.id,
          type: NotificationType.TEAM_INVITE_ACCEPTED,
          title: `${savedMember.player.user.name} accepted your invite to ${savedMember.team.name}`,
          deep_link: `/sports/cricket/teams/${savedMember.team.id}/manage`,
          metadata: { team_id: savedMember.team.id, player_id: savedMember.player.id },
        });
      }
    } catch (err) {
      console.warn(`Failed to create team membership acceptance notification:`, err);
    }

    return savedMember;
  }

  async rejectMember(teamId: number, memberId: number, userId: number) {
    const playerProfile = await this.getCurrentPlayerProfile(userId);

    const member = await this.teamMemberRepo.findOne({
      where: { id: memberId, team_id: teamId },
      relations: { team: { captain: { user: true } }, player: { user: true } },
    });
    if (!member) {
      throw new NotFoundException('Team member record not found');
    }

    if (
      member.status !== TeamMemberStatus.PENDING_INVITE &&
      member.status !== TeamMemberStatus.PENDING_REQUEST
    ) {
      throw new BadRequestException('Membership status is not pending');
    }

    const isCaptain = member.team.captain_id === playerProfile.id;
    const isTargetPlayer = member.player_id === playerProfile.id;

    if (member.status === TeamMemberStatus.PENDING_REQUEST) {
      if (!isCaptain) {
        throw new ForbiddenException('Only the team captain can reject join requests');
      }
    } else if (member.status === TeamMemberStatus.PENDING_INVITE) {
      if (!isTargetPlayer && !isCaptain) {
        throw new ForbiddenException('Only the invited player or the team captain can cancel or decline invitations');
      }
    }

    const originalStatus = member.status;
    member.status = TeamMemberStatus.REJECTED;
    await this.teamMemberRepo.save(member);

    // Trigger Notification
    try {
      if (originalStatus === TeamMemberStatus.PENDING_REQUEST) {
        await this.notificationsService.create({
          user_id: member.player.user.id,
          type: NotificationType.TEAM_REQUEST_REJECTED,
          title: `Your request to join ${member.team.name} was declined`,
          deep_link: `/sports/cricket/teams`,
          metadata: { team_id: member.team.id },
        });
      } else if (originalStatus === TeamMemberStatus.PENDING_INVITE && isTargetPlayer) {
        await this.notificationsService.create({
          user_id: member.team.captain.user.id,
          type: NotificationType.TEAM_INVITE_DECLINED,
          title: `${member.player.user.name} declined your invite to ${member.team.name}`,
          deep_link: `/sports/cricket/teams/${member.team.id}/manage`,
          metadata: { team_id: member.team.id, player_id: member.player.id },
        });
      }
    } catch (err) {
      console.warn(`Failed to create team membership rejection notification:`, err);
    }

    return { message: 'Rejected successfully' };
  }

  async removeOrLeaveMember(teamId: number, memberId: number, userId: number) {
    const playerProfile = await this.getCurrentPlayerProfile(userId);

    const member = await this.teamMemberRepo.findOne({
      where: { id: memberId, team_id: teamId },
      relations: { team: true, player: { user: true } },
    });
    if (!member) {
      throw new NotFoundException('Team member record not found');
    }

    if (member.status !== TeamMemberStatus.ACTIVE) {
      throw new BadRequestException('Player is not an active member of the team');
    }

    const isCaptain = member.team.captain_id === playerProfile.id;
    const isSelf = member.player_id === playerProfile.id;
    const wasRemovedByCaptain = isCaptain && !isSelf;

    if (isSelf) {
      if (member.role === TeamMemberRole.CAPTAIN) {
        throw new BadRequestException('Transfer captaincy before leaving the team');
      }
    } else {
      if (!isCaptain) {
        throw new ForbiddenException('Only the captain or the member themselves can perform this action');
      }
      if (member.role === TeamMemberRole.CAPTAIN) {
        throw new BadRequestException('Cannot remove the team captain');
      }
    }

    member.status = TeamMemberStatus.LEFT;
    await this.teamMemberRepo.save(member);

    // Trigger Notification
    try {
      if (wasRemovedByCaptain && member.player?.user) {
        await this.notificationsService.create({
          user_id: member.player.user.id,
          type: NotificationType.TEAM_MEMBER_REMOVED,
          title: `You were removed from ${member.team.name}`,
          deep_link: `/sports/cricket/teams`,
          metadata: { team_id: member.team.id },
        });
      }
    } catch (err) {
      console.warn(`Failed to create team member removal notification for user ID ${member.player?.user?.id}:`, err);
    }

    return { message: 'Left team successfully' };
  }

  async transferCaptaincy(
    teamId: number,
    transferCaptainDto: TransferCaptainDto,
    userId: number,
  ): Promise<Team> {
    const playerProfile = await this.getCurrentPlayerProfile(userId);
    await this.getCaptainMembership(teamId, playerProfile.id);

    const newCaptainMember = await this.teamMemberRepo.findOne({
      where: {
        team_id: teamId,
        player_id: transferCaptainDto.player_id,
        status: TeamMemberStatus.ACTIVE,
      },
      relations: { player: { user: true } },
    });
    if (!newCaptainMember) {
      throw new BadRequestException('New captain must be an active member of the team');
    }

    if (transferCaptainDto.player_id === playerProfile.id) {
      return this.findOneTeam(teamId);
    }

    const updatedTeam = await this.teamRepo.manager.transaction(async (manager) => {
      await manager.update(
        TeamMember,
        { team_id: teamId, player_id: playerProfile.id, role: TeamMemberRole.CAPTAIN },
        { role: TeamMemberRole.PLAYER },
      );

      await manager.update(
        TeamMember,
        { team_id: teamId, player_id: transferCaptainDto.player_id },
        { role: TeamMemberRole.CAPTAIN },
      );

      await manager.update(Team, teamId, { captain_id: transferCaptainDto.player_id });

      const team = await manager.findOne(Team, {
        where: { id: teamId, is_active: true },
        relations: {
          captain: { user: true },
          members: { player: { user: true } },
        },
      });

      if (team) {
        team.members = team.members.filter((m) => m.status === TeamMemberStatus.ACTIVE);
      }
      return team;
    });

    if (!updatedTeam) {
      throw new NotFoundException('Team not found after update');
    }

    // Trigger Notification
    try {
      if (newCaptainMember?.player?.user) {
        await this.notificationsService.create({
          user_id: newCaptainMember.player.user.id,
          type: NotificationType.TEAM_CAPTAINCY_TRANSFERRED,
          title: `You are now the captain of ${updatedTeam.name}`,
          deep_link: `/sports/cricket/teams/${updatedTeam.id}/manage`,
          metadata: { team_id: updatedTeam.id },
        });
      }
    } catch (err) {
      console.warn(`Failed to create team captaincy transfer notification:`, err);
    }

    return updatedTeam;
  }

  async deleteTeam(teamId: number, userId: number) {
    const playerProfile = await this.getCurrentPlayerProfile(userId);

    const team = await this.teamRepo.findOne({
      where: { id: teamId, is_active: true },
    });
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    await this.getCaptainMembership(teamId, playerProfile.id);

    // TODO: when matches module is built, check for completed matches here and throw BadRequestException if any exist

    await this.teamRepo.manager.transaction(async (manager) => {
      // Soft delete the team
      await manager.update(Team, teamId, { is_active: false });

      // Set all active team members status to LEFT
      await manager.update(
        TeamMember,
        { team_id: teamId, status: TeamMemberStatus.ACTIVE },
        { status: TeamMemberStatus.LEFT },
      );
    });

    return { message: 'Team deleted successfully' };
  }

  async getActiveTeamsForPlayer(playerId: number): Promise<Array<{
    id: number;
    name: string;
    logo_url: string | null;
    role: TeamMemberRole;
  }>> {
    const memberships = await this.teamMemberRepo.find({
      where: { player_id: playerId, status: TeamMemberStatus.ACTIVE },
      relations: { team: true },
    });
    return memberships.map(m => ({
      id: m.team.id,
      name: m.team.name,
      logo_url: m.team.logo_url ?? null,
      role: m.role,
    }));
  }

  async getPastTeamsForPlayer(playerId: number): Promise<Array<{
    id: number;
    name: string;
    logo_url: string | null;
    left_at: Date;
  }>> {
    const memberships = await this.teamMemberRepo.find({
      where: { player_id: playerId, status: TeamMemberStatus.LEFT },
      relations: { team: true },
      order: { updated_at: 'DESC' },
    });
    return memberships.map(m => ({
      id: m.team.id,
      name: m.team.name,
      logo_url: m.team.logo_url ?? null,
      left_at: m.updated_at,
    }));
  }
}

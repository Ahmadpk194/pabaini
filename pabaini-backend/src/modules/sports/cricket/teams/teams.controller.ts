import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FirebaseAuthGuard } from 'src/common/guards/firebase-auth.guard';
import { DbUserGuard } from 'src/common/guards/db-user.guard';
import { DbUser } from 'src/common/decorators/db-user.decorator';
import { User } from 'src/modules/users/entities/user.entity';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { InvitePlayerDto } from './dto/invite-player.dto';
import { TransferCaptainDto } from './dto/transfer-captain.dto';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard, DbUserGuard)
  async createTeam(@DbUser() user: User, @Body() dto: CreateTeamDto) {
    const team = await this.teamsService.createTeam(dto, user.id);
    return { data: team, message: 'Team created successfully' };
  }

  @Get()
  async getAllTeams() {
    const teams = await this.teamsService.findAllTeams();
    return { data: teams, message: 'Teams list retrieved successfully' };
  }

  @Get('my')
  @UseGuards(FirebaseAuthGuard, DbUserGuard)
  async getMyTeams(@DbUser() user: User) {
    const teams = await this.teamsService.findMyTeams(user.id);
    return { data: teams, message: 'My teams list retrieved successfully' };
  }

  @Get(':id/members/pending')
  @UseGuards(FirebaseAuthGuard, DbUserGuard)
  async getPendingMembers(
    @Param('id', ParseIntPipe) id: number,
    @DbUser() user: User,
  ) {
    const pending = await this.teamsService.getPendingMembers(id, user.id);
    return { data: pending, message: 'Pending team members list retrieved successfully' };
  }

  @Get(':id')
  async getTeamById(@Param('id', ParseIntPipe) id: number) {
    const team = await this.teamsService.findOneTeam(id);
    return { data: team, message: 'Team detail retrieved successfully' };
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard, DbUserGuard)
  async updateTeam(
    @Param('id', ParseIntPipe) id: number,
    @DbUser() user: User,
    @Body() dto: UpdateTeamDto,
  ) {
    const team = await this.teamsService.updateTeam(id, dto, user.id);
    return { data: team, message: 'Team updated successfully' };
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard, DbUserGuard)
  async deleteTeam(
    @Param('id', ParseIntPipe) id: number,
    @DbUser() user: User,
  ) {
    const result = await this.teamsService.deleteTeam(id, user.id);
    return { data: result, message: 'Team deleted successfully' };
  }

  @Post(':id/logo')
  @UseGuards(FirebaseAuthGuard, DbUserGuard)
  @UseInterceptors(FileInterceptor('logo'))
  async uploadLogo(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: any,
    @DbUser() user: User,
  ) {
    const team = await this.teamsService.uploadLogo(id, file, user.id);
    return { data: team, message: 'Team logo uploaded successfully' };
  }

  @Post(':id/invite')
  @UseGuards(FirebaseAuthGuard, DbUserGuard)
  async invitePlayer(
    @Param('id', ParseIntPipe) id: number,
    @DbUser() user: User,
    @Body() dto: InvitePlayerDto,
  ) {
    const result = await this.teamsService.invitePlayer(id, dto, user.id);
    return { data: result, message: 'Invitation sent successfully' };
  }

  @Post(':id/request')
  @UseGuards(FirebaseAuthGuard, DbUserGuard)
  async joinRequest(
    @Param('id', ParseIntPipe) id: number,
    @DbUser() user: User,
  ) {
    const result = await this.teamsService.joinRequest(id, user.id);
    return { data: result, message: 'Join request sent successfully' };
  }

  @Patch(':id/members/:memberId/accept')
  @UseGuards(FirebaseAuthGuard, DbUserGuard)
  async acceptMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @DbUser() user: User,
  ) {
    const result = await this.teamsService.acceptMember(id, memberId, user.id);
    return { data: result, message: 'Member accepted successfully' };
  }

  @Patch(':id/members/:memberId/reject')
  @UseGuards(FirebaseAuthGuard, DbUserGuard)
  async rejectMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @DbUser() user: User,
  ) {
    const result = await this.teamsService.rejectMember(id, memberId, user.id);
    return { data: result, message: 'Member rejected successfully' };
  }

  @Delete(':id/members/:memberId')
  @UseGuards(FirebaseAuthGuard, DbUserGuard)
  async removeOrLeaveMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @DbUser() user: User,
  ) {
    const result = await this.teamsService.removeOrLeaveMember(id, memberId, user.id);
    return { data: result, message: 'Member removed/left successfully' };
  }

  @Patch(':id/captain')
  @UseGuards(FirebaseAuthGuard, DbUserGuard)
  async transferCaptaincy(
    @Param('id', ParseIntPipe) id: number,
    @DbUser() user: User,
    @Body() dto: TransferCaptainDto,
  ) {
    const team = await this.teamsService.transferCaptaincy(id, dto, user.id);
    return { data: team, message: 'Captaincy transferred successfully' };
  }
}

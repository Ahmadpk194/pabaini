import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { FirebaseAuthGuard } from 'src/common/guards/firebase-auth.guard';
import { DbUserGuard } from 'src/common/guards/db-user.guard';
import { DbUser } from 'src/common/decorators/db-user.decorator';
import { User } from 'src/modules/users/entities/user.entity';
import { MatchesService } from './matches.service';
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


@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) { }

  @Post('request')
  @UseGuards(FirebaseAuthGuard, DbUserGuard)
  async requestMatch(@DbUser() user: User, @Body() dto: RequestMatchDto) {
    const match = await this.matchesService.requestMatch(dto, user.id);
    return { data: match, message: 'Match request sent successfully' };
  }

  @Patch(':id/accept')
  @UseGuards(FirebaseAuthGuard, DbUserGuard)
  async acceptMatch(
    @Param('id', ParseIntPipe) id: number,
    @DbUser() user: User,
  ) {
    const match = await this.matchesService.acceptMatch(id, user.id);
    return { data: match, message: 'Match request accepted successfully' };
  }

  @Patch(':id/decline')
  @UseGuards(FirebaseAuthGuard, DbUserGuard)
  async declineMatch(
    @Param('id', ParseIntPipe) id: number,
    @DbUser() user: User,
  ) {
    const result = await this.matchesService.declineMatch(id, user.id);
    return result;
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard, DbUserGuard)
  async updateMatch(
    @Param('id', ParseIntPipe) id: number,
    @DbUser() user: User,
    @Body() dto: UpdateMatchDto,
  ) {
    const match = await this.matchesService.updateMatch(id, dto, user.id);
    return { data: match, message: 'Match request updated successfully' };
  }

  @Patch(':id/cancel')
  @UseGuards(FirebaseAuthGuard, DbUserGuard)
  async cancelMatch(
    @Param('id', ParseIntPipe) id: number,
    @DbUser() user: User,
  ) {
    const result = await this.matchesService.cancelMatch(id, user.id);
    return result;
  }

  @Get()
  async findAllMatches(@Query() query: QueryMatchesDto) {
    const result = await this.matchesService.findAllMatches(query);
    return { data: result, message: 'Matches retrieved successfully' };
  }

  @Get(':id')
  async findOneMatch(@Param('id', ParseIntPipe) id: number) {
    const match = await this.matchesService.findOneMatch(id);
    return { data: match, message: 'Match details retrieved successfully' };
  }

  @Post(':id/lineup')
  @UseGuards(FirebaseAuthGuard, DbUserGuard)
  async declareLineup(
    @Param('id', ParseIntPipe) id: number,
    @DbUser() user: User,
    @Body() dto: DeclareLineupDto,
  ) {
    const result = await this.matchesService.declareLineup(id, dto, user.id);
    return { data: result.lineup, message: result.message };
  }

  @Get(':id/lineup')
  async getLineups(@Param('id', ParseIntPipe) id: number) {
    const lineups = await this.matchesService.getLineups(id);
    return { data: lineups, message: 'Match lineups retrieved successfully' };
  }

  @Post(':id/result')
  @UseGuards(FirebaseAuthGuard, DbUserGuard)
  async submitResult(
    @Param('id', ParseIntPipe) id: number,
    @DbUser() user: User,
    @Body() dto: SubmitResultDto,
  ) {
    const match = await this.matchesService.submitResult(id, dto, user.id);
    return { data: match, message: 'Match result submitted successfully' };
  }

  @Patch(':id/result')
  @UseGuards(FirebaseAuthGuard, DbUserGuard)
  async editResult(
    @Param('id', ParseIntPipe) id: number,
    @DbUser() user: User,
    @Body() dto: EditResultDto,
  ) {
    const match = await this.matchesService.editResult(id, dto, user.id);
    return { data: match, message: 'Match result updated successfully' };
  }

  @Patch(':id/start')
  @UseGuards(FirebaseAuthGuard, DbUserGuard)
  async startMatch(
    @Param('id', ParseIntPipe) id: number,
    @DbUser() user: User,
    @Body() dto: StartMatchDto,
  ) {
    const match = await this.matchesService.startMatch(id, dto, user.id);
    return { data: match, message: 'Match started successfully' };
  }

  @Post(':id/balls')
  @UseGuards(FirebaseAuthGuard, DbUserGuard)
  async recordBall(
    @Param('id', ParseIntPipe) id: number,
    @DbUser() user: User,
    @Body() dto: RecordBallDto,
  ) {
    const match = await this.matchesService.recordBall(id, dto, user.id);
    return { data: match, message: 'Ball recorded successfully' };
  }

  @Patch(':id/bowler')
  @UseGuards(FirebaseAuthGuard, DbUserGuard)
  async selectBowler(
    @Param('id', ParseIntPipe) id: number,
    @DbUser() user: User,
    @Body() dto: SelectBowlerDto,
  ) {
    const match = await this.matchesService.selectBowler(id, dto, user.id);
    return { data: match, message: 'Bowler selected successfully' };
  }

  @Patch(':id/innings/start')
  @UseGuards(FirebaseAuthGuard, DbUserGuard)
  async startSecondInnings(
    @Param('id', ParseIntPipe) id: number,
    @DbUser() user: User,
    @Body() dto: StartSecondInningsDto,
  ) {
    const match = await this.matchesService.startSecondInnings(id, dto, user.id);
    return { data: match, message: 'Second innings started successfully' };
  }

  @Patch(':id/balls/undo')
  @UseGuards(FirebaseAuthGuard, DbUserGuard)
  async undoLastBall(
    @Param('id', ParseIntPipe) id: number,
    @DbUser() user: User,
  ) {
    const match = await this.matchesService.undoLastBall(id, user.id);
    return { data: match, message: 'Last ball undone successfully' };
  }

  @Patch(':id/strike/rotate')
  @UseGuards(FirebaseAuthGuard, DbUserGuard)
  async rotateStrike(
    @Param('id', ParseIntPipe) id: number,
    @DbUser() user: User,
  ) {
    const match = await this.matchesService.rotateStrike(id, user.id);
    return { data: match, message: 'Strike rotated successfully' };
  }

  @Get(':id/live')
  async getLiveView(@Param('id', ParseIntPipe) id: number) {
    const liveView = await this.matchesService.getLiveView(id);
    return { data: liveView, message: 'Live view retrieved successfully' };
  }
}

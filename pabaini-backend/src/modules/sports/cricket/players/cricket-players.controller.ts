import { Controller, Get, Post, Patch, Param, Body, UseGuards, ParseIntPipe, Query } from '@nestjs/common';
import { FirebaseAuthGuard } from 'src/common/guards/firebase-auth.guard';
import { DbUserGuard } from 'src/common/guards/db-user.guard';
import { DbUser } from 'src/common/decorators/db-user.decorator';
import { CricketPlayersService } from './cricket-players.service';
import { CreateCricketPlayerProfileDto } from './dto/create-cricket-player-profile.dto';
import { UpdateCricketPlayerProfileDto } from './dto/update-cricket-player-profile.dto';
import { User } from 'src/modules/users/entities/user.entity';

@Controller('players')
export class CricketPlayersController {
  constructor(private readonly cricketPlayersService: CricketPlayersService) {}

  @Post('me')
  @UseGuards(FirebaseAuthGuard, DbUserGuard)
  async createProfile(
    @DbUser() user: User,
    @Body() dto: CreateCricketPlayerProfileDto,
  ) {
    const profile = await this.cricketPlayersService.createProfile(user.id, dto);
    return { data: profile, message: 'Cricket player profile created successfully' };
  }

  @Get('me')
  @UseGuards(FirebaseAuthGuard, DbUserGuard)
  async getMyProfile(@DbUser() user: User) {
    const profile = await this.cricketPlayersService.getMyProfile(user.id);
    return { data: profile, message: 'Cricket player profile retrieved successfully' };
  }

  @Patch('me')
  @UseGuards(FirebaseAuthGuard, DbUserGuard)
  async updateMyProfile(
    @DbUser() user: User,
    @Body() dto: UpdateCricketPlayerProfileDto,
  ) {
    const profile = await this.cricketPlayersService.updateMyProfile(user.id, dto);
    return { data: profile, message: 'Cricket player profile updated successfully' };
  }

  @Get(':id')
  async getPlayerById(@Param('id', ParseIntPipe) id: number) {
    const profile = await this.cricketPlayersService.getPlayerById(id);
    return { data: profile, message: 'Cricket player profile retrieved successfully' };
  }

  @Get()
  async getAllPlayers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const finalLimit = Math.min(limitNum, 50);

    const result = await this.cricketPlayersService.getAllPlayers(pageNum, finalLimit, search);
    return { data: result, message: 'Cricket players list retrieved successfully' };
  }
}

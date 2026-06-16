import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CricketPlayersController } from './players/cricket-players.controller';
import { CricketPlayersService } from './players/cricket-players.service';
import { CricketPlayerProfile } from './entities/cricket-player-profile.entity';
import { UsersModule } from 'src/modules/users/users.module';
import { TeamsModule } from './teams/teams.module';
import { CricketStatsModule } from './stats/cricket-stats.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CricketPlayerProfile]),
    forwardRef(() => UsersModule),
    TeamsModule,
    CricketStatsModule,
  ],
  controllers: [CricketPlayersController],
  providers: [CricketPlayersService],
  exports: [CricketPlayersService, TeamsModule, CricketStatsModule],
})
export class CricketModule {}

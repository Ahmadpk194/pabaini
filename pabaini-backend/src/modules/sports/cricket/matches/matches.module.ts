import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { CricketMatch } from './entities/cricket-match.entity';
import { CricketSeries } from './entities/cricket-series.entity';
import { CricketMatchPlayer } from './entities/cricket-match-player.entity';
import { CricketPlayerMatchStats } from './entities/cricket-player-match-stats.entity';
import { CricketBallEvent } from './entities/cricket-ball-event.entity';
import { Team } from '../teams/entities/team.entity';
import { TeamMember } from '../teams/entities/team-member.entity';
import { CricketPlayerProfile } from '../entities/cricket-player-profile.entity';
import { UsersModule } from 'src/modules/users/users.module';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CricketMatch,
      CricketSeries,
      CricketMatchPlayer,
      CricketPlayerMatchStats,
      CricketBallEvent,
      Team,
      TeamMember,
      CricketPlayerProfile,
    ]),
    forwardRef(() => UsersModule),
    NotificationsModule,
  ],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService],
})
export class MatchesModule {}

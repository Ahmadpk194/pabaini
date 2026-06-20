import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CricketStatsService } from './cricket-stats.service';
import { CricketPlayerMatchStats } from '../matches/entities/cricket-player-match-stats.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CricketPlayerMatchStats])],
  providers: [CricketStatsService],
  exports: [CricketStatsService],
})
export class CricketStatsModule {}

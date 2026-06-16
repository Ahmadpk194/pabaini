import { Module } from '@nestjs/common';
import { CricketStatsService } from './cricket-stats.service';

@Module({
  providers: [CricketStatsService],
  exports: [CricketStatsService],
})
export class CricketStatsModule {}

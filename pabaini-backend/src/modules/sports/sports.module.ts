import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { CricketModule } from './cricket/cricket.module';
import { TeamsModule } from './cricket/teams/teams.module';
import { MatchesModule } from './cricket/matches/matches.module';

@Module({
  imports: [
    CricketModule,
    TeamsModule,
    MatchesModule,
    RouterModule.register([
      {
        path: 'sports',
        children: [
          {
            path: 'cricket',
            module: CricketModule,
            children: [
              {
                path: '',
                module: TeamsModule,
              },
              {
                path: '',
                module: MatchesModule,
              },
            ],
          },
        ],
      },
    ]),
  ],
})
export class SportsModule {}

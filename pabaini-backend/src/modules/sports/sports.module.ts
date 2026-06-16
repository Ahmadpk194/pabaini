import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { CricketModule } from './cricket/cricket.module';
import { TeamsModule } from './cricket/teams/teams.module';

@Module({
  imports: [
    CricketModule,
    TeamsModule,
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
            ],
          },
        ],
      },
    ]),
  ],
})
export class SportsModule {}

import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { CricketModule } from './cricket/cricket.module';

@Module({
  imports: [
    CricketModule,
    RouterModule.register([
      {
        path: 'sports',
        children: [
          {
            path: 'cricket',
            module: CricketModule,
          },
        ],
      },
    ]),
  ],
})
export class SportsModule {}

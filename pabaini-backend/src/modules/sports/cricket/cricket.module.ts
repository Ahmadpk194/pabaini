import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CricketPlayersController } from './players/cricket-players.controller';
import { CricketPlayersService } from './players/cricket-players.service';
import { CricketPlayerProfile } from './entities/cricket-player-profile.entity';
import { UsersModule } from 'src/modules/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CricketPlayerProfile]),
    UsersModule,
  ],
  controllers: [CricketPlayersController],
  providers: [CricketPlayersService],
  exports: [CricketPlayersService],
})
export class CricketModule {}

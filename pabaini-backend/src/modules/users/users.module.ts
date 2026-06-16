import { Module, forwardRef } from '@nestjs/common';
import { UserController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { User } from './entities/user.entity';
import { CricketModule } from 'src/modules/sports/cricket/cricket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => CricketModule),
  ],
  controllers: [UserController],
  providers: [UsersService, RolesGuard],
  exports: [UsersService, RolesGuard]
})
export class UsersModule { }

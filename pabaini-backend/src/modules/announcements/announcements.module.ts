import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementCommentsController } from './announcement-comments.controller';
import { AnnouncementsService } from './announcements.service';
import { Announcement } from './entities/announcement.entity';
import { AnnouncementLike } from './entities/announcement-like.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { CommentsModule } from '../comments/comments.module';
import { FCMService } from 'src/config/fcm.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Announcement, AnnouncementLike, User]),
    UsersModule,
    CommentsModule,
  ],
  controllers: [AnnouncementsController, AnnouncementCommentsController],
  providers: [AnnouncementsService, FCMService],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}

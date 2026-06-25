import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { typeOrmConfig } from './config/typeorm.config';
import { FirebaseModule } from './config/firebase.module';
import { DatabaseHealthService } from './config/database.health';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { SportsModule } from './modules/sports/sports.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CommentsModule } from './modules/comments/comments.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: typeOrmConfig,
    }),
    EventEmitterModule.forRoot(),
    FirebaseModule,
    AuthModule,
    UsersModule,
    AnnouncementsModule,
    SportsModule,
    NotificationsModule,
    CommentsModule,
  ],
  controllers: [AppController],
  providers: [AppService, DatabaseHealthService],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}

import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { FirebaseAuthGuard } from 'src/common/guards/firebase-auth.guard';
import { DbUserGuard } from 'src/common/guards/db-user.guard';
import { DbUser } from 'src/common/decorators/db-user.decorator';
import { NotificationsService } from './notifications.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';

@Controller('notifications')
@UseGuards(FirebaseAuthGuard, DbUserGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @DbUser() user: any,
    @Query() query: QueryNotificationsDto,
  ) {
    const result = await this.notificationsService.findForUser(user.id, query);
    return {
      data: {
        notifications: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
      },
      message: 'Notifications retrieved successfully',
    };
  }

  @Get('unread-count')
  async getUnreadCount(@DbUser() user: any) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return {
      data: count,
      message: 'Unread count retrieved successfully',
    };
  }

  @Patch('read-all')
  async markAllAsRead(@DbUser() user: any) {
    const result = await this.notificationsService.markAllAsRead(user.id);
    return {
      data: result,
      message: 'All notifications marked as read successfully',
    };
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @DbUser() user: any,
  ) {
    const notification = await this.notificationsService.markAsRead(id, user.id);
    return {
      data: notification,
      message: 'Notification marked as read successfully',
    };
  }
}

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Notification } from './entities/notification.entity';
import { NotificationType } from './enums/notification-type.enum';
import { QueryNotificationsDto } from './dto/query-notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(payload: {
    user_id: number;
    type: NotificationType;
    title: string;
    body?: string;
    deep_link?: string;
    metadata?: Record<string, any>;
  }): Promise<Notification> {
    const notification = this.notificationRepo.create(payload);
    const savedNotification = await this.notificationRepo.save(notification);

    // Emit event for potential WebSocket / Realtime messaging
    this.eventEmitter.emit('notification.created', savedNotification);

    return savedNotification;
  }

  async findForUser(
    userId: number,
    query: QueryNotificationsDto,
  ): Promise<{
    data: Notification[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 20;
    const skip = (page - 1) * limit;

    const where: any = { user_id: userId };
    if (query.unread_only === 'true') {
      where.is_read = false;
    }

    const [data, total] = await this.notificationRepo.findAndCount({
      where,
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.notificationRepo.count({
      where: { user_id: userId, is_read: false },
    });
  }

  async markAsRead(notificationId: number, userId: number): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.user_id !== userId) {
      throw new ForbiddenException(
        "Cannot mark another user's notification as read",
      );
    }

    notification.is_read = true;
    return this.notificationRepo.save(notification);
  }

  async markAllAsRead(userId: number): Promise<{ updated: number }> {
    const result = await this.notificationRepo.update(
      { user_id: userId, is_read: false },
      { is_read: true },
    );

    return { updated: result.affected || 0 };
  }
}

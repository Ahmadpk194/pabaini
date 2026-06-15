import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Announcement } from './entities/announcement.entity';
import { AnnouncementLike } from './entities/announcement-like.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { User } from '../users/entities/user.entity';
import { getSupabaseClient } from 'src/config/supabase.config';
import { FCMService } from 'src/config/fcm.service';
import { AnnouncementCategory } from './entities/announcement.entity';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement)
    private announcementsRepository: Repository<Announcement>,
    @InjectRepository(AnnouncementLike)
    private likesRepository: Repository<AnnouncementLike>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private fcmService: FCMService,
  ) { }

  async findAll(user?: User, page: number = 1, limit: number = 10, category?: string): Promise<{ data: Announcement[]; total: number; page: number; limit: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const where: any = {
      is_deleted: false,
    };
    if (category) {
      where.category = category;
    }

    const [data, total] = await this.announcementsRepository.findAndCount({
      where,
      order: { is_pinned: 'DESC', created_at: 'DESC' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    const announcements = data.map(announcement => {
      if (user) {
        return {
          ...announcement,
          liked_by_me: false, // Will be populated below
        };
      }
      return announcement;
    });

    if (user) {
      const likedAnnouncementIds = await this.getLikedAnnouncementIds(user.id);
      const result = announcements.map(announcement => ({
        ...announcement,
        liked_by_me: likedAnnouncementIds.includes(announcement.id),
      })) as any;
      return { data: result, total, page, limit, totalPages };
    }

    return { data: announcements as any, total, page, limit, totalPages };
  }

  async findByAuthor(authorId: number, user?: User): Promise<Announcement[]> {
    const announcements = await this.announcementsRepository.find({
      where: { author_id: authorId, is_deleted: false },
      order: { created_at: 'DESC' },
    });

    if (user) {
      const likedAnnouncementIds = await this.getLikedAnnouncementIds(user.id);
      return announcements.map(announcement => ({
        ...announcement,
        liked_by_me: likedAnnouncementIds.includes(announcement.id),
      })) as any;
    }

    return announcements;
  }

  async findById(id: number, user?: User): Promise<Announcement> {
    const announcement = await this.announcementsRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    if (user) {
      const likedAnnouncementIds = await this.getLikedAnnouncementIds(user.id);
      return {
        ...announcement,
        liked_by_me: likedAnnouncementIds.includes(announcement.id),
      } as any;
    }

    return announcement;
  }

  private async getLikedAnnouncementIds(userId: number): Promise<number[]> {
    const likes = await this.likesRepository.find({
      where: { user_id: userId },
    });
    return likes.map(like => like.announcement_id);
  }

  async create(createAnnouncementDto: CreateAnnouncementDto, author: User): Promise<Announcement> {
    const announcement = this.announcementsRepository.create({
      ...createAnnouncementDto,
      author_id: author.id,
      author,
    });

    const savedAnnouncement = await this.announcementsRepository.save(announcement);

    // Send push notification for urgent or jirga_decision announcements
    if (
      createAnnouncementDto.category === AnnouncementCategory.URGENT ||
      createAnnouncementDto.category === AnnouncementCategory.JIRGA_DECISION
    ) {
      try {
        const allUsers = await this.usersRepository.find({
          where: { device_tokens: Not(IsNull()) },
        });

        const allTokens = allUsers.flatMap((user) => user.device_tokens || []);

        if (allTokens.length > 0) {
          await this.fcmService.sendPushNotification(
            allTokens,
            savedAnnouncement.title,
            savedAnnouncement.content.substring(0, 100),
            {
              announcementId: savedAnnouncement.id.toString(),
              category: savedAnnouncement.category,
            },
          );
        }
      } catch (error) {
        console.error('Failed to send push notification:', error);
        // Don't block the announcement creation if push notification fails
      }
    }

    return savedAnnouncement;
  }

  async update(id: number, updateAnnouncementDto: UpdateAnnouncementDto, user: User): Promise<Announcement> {
    const announcement = await this.findById(id);

    if (
      announcement.author_id !== user.id &&
      user.role !== 'admin' &&
      user.role !== 'moderator'
    ) {
      throw new ForbiddenException('You can only update your own announcements');
    }

    // Delete old image if image_url is being changed
    if (updateAnnouncementDto.image_url && announcement.image_url && updateAnnouncementDto.image_url !== announcement.image_url) {
      try {
        await this.deleteImageFromSupabase(announcement.image_url);
      } catch (error) {
        console.error('Failed to delete old image from Supabase:', error);
        // Don't block the update if image cleanup fails
      }
    }

    await this.announcementsRepository.update(id, updateAnnouncementDto);
    return this.findById(id);
  }

  async softDelete(id: number, user: User): Promise<void> {
    const announcement = await this.findById(id);

    // Only author or admin can delete
    if (announcement.author_id !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('You can only delete your own announcements');
    }

    // Soft delete: set is_deleted flag instead of removing the record
    // Note: Image is NOT deleted to allow for recovery
    announcement.is_deleted = true;
    await this.announcementsRepository.save(announcement);
  }

  async hardDelete(id: number, user: User): Promise<void> {
    const announcement = await this.announcementsRepository.findOne({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    // Only admin can hard delete
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only admins can permanently delete announcements');
    }

    // Delete image from Supabase if exists
    if (announcement.image_url) {
      try {
        await this.deleteImageFromSupabase(announcement.image_url);
      } catch (error) {
        console.error('Failed to delete image from Supabase:', error);
        // Don't block the deletion if image cleanup fails
      }
    }

    // Hard delete: permanently remove the record
    await this.announcementsRepository.delete(id);
  }

  private async deleteImageFromSupabase(imageUrl: string): Promise<void> {
    const supabase = getSupabaseClient();
    
    // Extract file path from public URL
    // URL format: https://<project>.supabase.co/storage/v1/object/public/pabaini-media/announcements/<filename>
    const urlParts = imageUrl.split('/pabaini-media/');
    if (urlParts.length < 2) {
      console.error('Invalid image URL format:', imageUrl);
      return;
    }
    
    const filePath = urlParts[1]; // e.g., "announcements/filename.jpg"
    
    const { error } = await supabase.storage
      .from('pabaini-media')
      .remove([filePath]);

    if (error) {
      throw new Error(`Failed to delete image from Supabase: ${error.message}`);
    }
  }

  async toggleLike(announcementId: number, user: User): Promise<Announcement> {
    // Use transaction to ensure atomicity and prevent race conditions
    return this.announcementsRepository.manager.transaction(async (transactionalEntityManager) => {
      const announcement = await transactionalEntityManager.findOne(Announcement, {
        where: { id: announcementId },
      });

      if (!announcement) {
        throw new NotFoundException('Announcement not found');
      }

      // Check if user already liked this announcement
      const existingLike = await transactionalEntityManager.findOne(AnnouncementLike, {
        where: {
          user_id: user.id,
          announcement_id: announcementId,
        },
      });

      let likedByMe = false;

      if (existingLike) {
        // Unlike: remove the like record and decrement counter
        await transactionalEntityManager.delete(AnnouncementLike, existingLike.id);
        announcement.likes_count = Math.max(0, announcement.likes_count - 1);
        likedByMe = false; // User unliked
      } else {
        // Like: create like record and increment counter
        // Try to insert, if duplicate key violation occurs, it means another request already created it
        try {
          const like = transactionalEntityManager.create(AnnouncementLike, {
            user_id: user.id,
            announcement_id: announcementId,
          });
          await transactionalEntityManager.save(like);
          announcement.likes_count += 1;
          likedByMe = true; // User liked
        } catch (error: any) {
          // Handle duplicate key violation (race condition)
          if (error.code === '23505' || error.detail?.includes('already exists')) {
            // Another request already created the like, fetch it and don't increment counter
            const newlyCreatedLike = await transactionalEntityManager.findOne(AnnouncementLike, {
              where: {
                user_id: user.id,
                announcement_id: announcementId,
              },
            });
            if (newlyCreatedLike) {
              // Like already exists, just return the announcement without incrementing
              likedByMe = true; // User liked (by another request)
              return {
                ...announcement,
                liked_by_me: likedByMe,
              } as any;
            }
          }
          throw error;
        }
      }

      await transactionalEntityManager.save(announcement);
      
      // Add liked_by_me field to the response (determined within transaction)
      return {
        ...announcement,
        liked_by_me: likedByMe,
      } as any;
    });
  }

  async uploadAnnouncementImage(announcementId: number, file: any): Promise<Announcement> {
    try {
      const announcement = await this.findById(announcementId);

      const fileExt = file.originalname.split('.').pop();
      const fileName = `announcement-${announcementId}-${Date.now()}.${fileExt}`;
      const filePath = `announcements/${fileName}`;

      const supabase = getSupabaseClient();

      // Delete old image if exists
      if (announcement.image_url) {
        try {
          // Extract file path from existing image_url
          const urlParts = announcement.image_url.split('/public/');
          if (urlParts.length === 2) {
            const oldFilePath = urlParts[1];
            await supabase.storage
              .from('pabaini-media')
              .remove([oldFilePath]);
          }
        } catch (error) {
          // Log warning but don't block the upload
          console.warn(`Failed to delete old announcement image: ${error}`);
        }
      }

      const { data, error } = await supabase.storage
        .from('pabaini-media')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (error) {
        throw new Error(`Failed to upload announcement image to Supabase: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pabaini-media')
        .getPublicUrl(filePath);

      announcement.image_url = publicUrl;
      return this.announcementsRepository.save(announcement);
    } catch (error) {
      console.error('Error in uploadAnnouncementImage:', error);
      throw error;
    }
  }
}

import { Body, Controller, Get, Param, ParseIntPipe, Post, Patch, Delete, UseGuards, UseInterceptors, UploadedFile, BadRequestException, ForbiddenException, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FirebaseAuthGuard } from 'src/common/guards/firebase-auth.guard';
import { DbUserGuard } from 'src/common/guards/db-user.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { DbUser } from 'src/common/decorators/db-user.decorator';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { UserRole } from '../users/entities/user.entity';

@Controller('announcements')
@UseGuards(FirebaseAuthGuard, DbUserGuard)
export class AnnouncementsController {
  constructor(private announcementsService: AnnouncementsService) {}

  @Get()
  // Public: Get all announcements ordered by newest with pagination and filtering
  async findAll(
    @DbUser() user?: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    
    // Validate category if provided
    const validCategories = ['general', 'urgent', 'event', 'jirga_decision'];
    if (category && !validCategories.includes(category)) {
      throw new BadRequestException(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
    }
    
    const result = await this.announcementsService.findAll(user, pageNum, limitNum, category);
    return { data: result.data, message: 'Announcements retrieved successfully', pagination: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages } };
  }

  @Get('author/:authorId')
  // Public: Get all announcements by a specific author
  async findByAuthor(@Param('authorId', ParseIntPipe) authorId: number, @DbUser() user?: any) {
    const announcements = await this.announcementsService.findByAuthor(authorId, user);
    return { data: announcements, message: 'Announcements retrieved successfully' };
  }

  @Get(':id')
  // Public: Get single announcement by ID
  async findById(@Param('id', ParseIntPipe) id: number, @DbUser() user?: any) {
    const announcement = await this.announcementsService.findById(id, user);
    return { data: announcement, message: 'Announcement retrieved successfully' };
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  // Admin/Moderator only: Create new announcement
  async create(@Body() createAnnouncementDto: CreateAnnouncementDto, @DbUser() user: any) {
    const announcement = await this.announcementsService.create(createAnnouncementDto, user);
    return { data: announcement, message: 'Announcement created successfully' };
  }

  @Patch(':id')
  // Author or Admin/Moderator only: Update announcement
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAnnouncementDto: UpdateAnnouncementDto,
    @DbUser() user: any,
  ) {
    const announcement = await this.announcementsService.update(id, updateAnnouncementDto, user);
    return { data: announcement, message: 'Announcement updated successfully' };
  }

  @Patch(':id/soft-delete')
  // Author or Admin/Moderator only: Soft delete announcement
  async softDelete(@Param('id', ParseIntPipe) id: number, @DbUser() user: any) {
    await this.announcementsService.softDelete(id, user);
    return { data: null, message: 'Announcement deleted successfully' };
  }

  @Delete(':id')
  // Admin only: Hard delete announcement (permanent)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async hardDelete(@Param('id', ParseIntPipe) id: number, @DbUser() user: any) {
    await this.announcementsService.hardDelete(id, user);
    return { data: null, message: 'Announcement permanently deleted' };
  }

  @Post(':id/like')
  // Authenticated: Toggle like/unlike on announcement
  async toggleLike(@Param('id', ParseIntPipe) id: number, @DbUser() user: any) {
    const announcement = await this.announcementsService.toggleLike(id, user);
    return { data: announcement, message: 'Like toggled successfully' };
  }

  @Post(':id/image')
  @UseInterceptors(FileInterceptor('image'))
  // Author or Admin/Moderator only: Upload announcement image
  async uploadAnnouncementImage(
    @Param('id', ParseIntPipe) id: number,
    @DbUser() user: any,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const announcement = await this.announcementsService.findById(id);
    
    // Only author or admin/moderator can upload image
    if (announcement.author_id !== user.id && user.role !== 'admin' && user.role !== 'moderator') {
      throw new ForbiddenException('You can only upload images to your own announcements');
    }
    
    const updatedAnnouncement = await this.announcementsService.uploadAnnouncementImage(id, file);
    return { data: updatedAnnouncement, message: 'Announcement image uploaded successfully' };
  }
}

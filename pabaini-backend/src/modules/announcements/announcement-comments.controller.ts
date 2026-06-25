import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from 'src/common/guards/firebase-auth.guard';
import { DbUserGuard } from 'src/common/guards/db-user.guard';
import { DbUser } from 'src/common/decorators/db-user.decorator';
import { User } from '../users/entities/user.entity';
import { CommentsService } from '../comments/comments.service';
import { AnnouncementsService } from './announcements.service';
import { CreateCommentDto } from '../comments/dto/create-comment.dto';
import { UpdateCommentDto } from '../comments/dto/update-comment.dto';
import { Announcement } from './entities/announcement.entity';
import { Comment } from '../comments/entities/comment.entity';

interface FormattedComment {
    commentId: number;
    entityType: string;
    entityId: number;
    parentId: number | null;
    body: string;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    author: {
        id: number;
        name: string;
        avatarUrl: string;
        role: string;
    };
    isOwner: boolean;
    canEdit: boolean;
    canDelete: boolean;
}

function formatComment(comment: Comment, currentUser?: User): FormattedComment {
    const isOwner = currentUser ? comment.user_id === currentUser.id : false;
    const hasOverride = currentUser ? (currentUser.role === 'admin' || currentUser.role === 'moderator') : false;
    const canEdit = currentUser ? (isOwner || hasOverride) : false;
    const canDelete = currentUser ? (isOwner || hasOverride) : false;

    return {
        commentId: comment.comment_id,
        entityType: comment.entity_type,
        entityId: comment.entity_id,
        parentId: comment.parent_id ?? null,
        body: comment.body,
        isDeleted: comment.is_deleted,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        author: {
            id: comment.author?.id,
            name: comment.author?.name,
            avatarUrl: comment.author?.avatar_url,
            role: comment.author?.role,
        },
        isOwner,
        canEdit,
        canDelete,
    };
}

@Controller('announcements/:announcementId/comments')
@UseGuards(FirebaseAuthGuard, DbUserGuard)
export class AnnouncementCommentsController {
    constructor(
        private readonly commentsService: CommentsService,
        private readonly announcementsService: AnnouncementsService,
    ) {}

    @Get()
    async findAll(
        @Param('announcementId', ParseIntPipe) announcementId: number,
        @DbUser() currentUser?: User,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        // Validate announcement exists
        await this.announcementsService.findById(announcementId);

        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 20;

        const result = await this.commentsService.findAll(
            'announcement',
            announcementId,
            pageNum,
            limitNum,
        );

        return {
            data: {
                comments: result.comments.map((c) => formatComment(c, currentUser)),
                total: result.total,
                hasMore: result.hasMore,
            },
            message: 'Comments retrieved successfully',
        };
    }

    @Post()
    async create(
        @Param('announcementId', ParseIntPipe) announcementId: number,
        @Body() createCommentDto: CreateCommentDto,
        @DbUser() user: User,
    ) {
        // Validate announcement exists
        await this.announcementsService.findById(announcementId);

        const comment = await this.commentsService.create(
            'announcement',
            announcementId,
            user.id,
            createCommentDto.body,
            async (manager) => {
                await manager.increment(
                    Announcement,
                    { id: announcementId },
                    'comments_count',
                    1,
                );
            },
        );

        return {
            data: formatComment(comment, user),
            message: 'Comment created successfully',
        };
    }

    @Patch(':commentId')
    async update(
        @Param('announcementId', ParseIntPipe) announcementId: number,
        @Param('commentId', ParseIntPipe) commentId: number,
        @Body() updateCommentDto: UpdateCommentDto,
        @DbUser() user: User,
    ) {
        // Validate announcement exists
        await this.announcementsService.findById(announcementId);

        const comment = await this.commentsService.update(
            commentId,
            updateCommentDto.body,
            user,
        );

        return {
            data: formatComment(comment, user),
            message: 'Comment updated successfully',
        };
    }

    @Delete(':commentId')
    async remove(
        @Param('announcementId', ParseIntPipe) announcementId: number,
        @Param('commentId', ParseIntPipe) commentId: number,
        @DbUser() user: User,
    ) {
        // Validate announcement exists
        await this.announcementsService.findById(announcementId);

        await this.commentsService.softDelete(commentId, user, async (manager) => {
            const announcement = await manager.findOne(Announcement, {
                where: { id: announcementId },
            });
            if (announcement) {
                announcement.comments_count = Math.max(
                    0,
                    announcement.comments_count - 1,
                );
                await manager.save(Announcement, announcement);
            }
        });

        return {
            data: null,
            message: 'Comment deleted successfully',
        };
    }
}

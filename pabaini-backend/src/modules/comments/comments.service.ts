import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class CommentsService {
    constructor(
        @InjectRepository(Comment)
        private readonly commentsRepository: Repository<Comment>,
    ) {}

    async findById(commentId: number): Promise<Comment> {
        const comment = await this.commentsRepository.findOne({
            where: { comment_id: commentId },
        });
        if (!comment) {
            throw new NotFoundException('Comment not found');
        }
        return comment;
    }

    async findAll(
        entityType: string,
        entityId: number,
        page: number = 1,
        limit: number = 20,
    ): Promise<{ comments: Comment[]; total: number; hasMore: boolean }> {
        const skip = (page - 1) * limit;

        const [comments, total] = await this.commentsRepository.findAndCount({
            where: {
                entity_type: entityType,
                entity_id: entityId,
                is_deleted: false,
            },
            order: {
                created_at: 'ASC', // Oldest first
            },
            skip,
            take: limit,
        });

        const hasMore = total > page * limit;

        return {
            comments,
            total,
            hasMore,
        };
    }

    async create(
        entityType: string,
        entityId: number,
        userId: number,
        body: string,
        onSuccessTransaction?: (manager: EntityManager) => Promise<void>,
    ): Promise<Comment> {
        return this.commentsRepository.manager.transaction(async (transactionalEntityManager) => {
            const comment = transactionalEntityManager.create(Comment, {
                entity_type: entityType,
                entity_id: entityId,
                user_id: userId,
                body,
            });

            const savedComment = await transactionalEntityManager.save(comment);

            if (onSuccessTransaction) {
                await onSuccessTransaction(transactionalEntityManager);
            }

            // Reload comment to load eager relations (like User)
            const loaded = await transactionalEntityManager.findOne(Comment, {
                where: { comment_id: savedComment.comment_id },
            });
            if (!loaded) {
                throw new NotFoundException('Failed to load created comment');
            }
            return loaded;
        });
    }

    async update(
        commentId: number,
        body: string,
        user: User,
    ): Promise<Comment> {
        const comment = await this.findById(commentId);

        // Only comment owner may edit. Admin override allowed if existing patterns support it.
        if (comment.user_id !== user.id && user.role !== 'admin' && user.role !== 'moderator') {
            throw new ForbiddenException('You can only edit your own comments');
        }

        if (comment.is_deleted) {
            throw new BadRequestException('Cannot edit a deleted comment');
        }

        comment.body = body;
        comment.updated_at = new Date();
        return this.commentsRepository.save(comment);
    }

    async softDelete(
        commentId: number,
        user: User,
        onSuccessTransaction?: (manager: EntityManager) => Promise<void>,
    ): Promise<void> {
        const comment = await this.findById(commentId);

        // Only comment owner may delete. Admin override allowed if existing patterns support it.
        if (comment.user_id !== user.id && user.role !== 'admin' && user.role !== 'moderator') {
            throw new ForbiddenException('You can only delete your own comments');
        }

        if (comment.is_deleted) {
            return; // Idempotent
        }

        await this.commentsRepository.manager.transaction(async (transactionalEntityManager) => {
            comment.is_deleted = true;
            await transactionalEntityManager.save(comment);

            if (onSuccessTransaction) {
                await onSuccessTransaction(transactionalEntityManager);
            }
        });
    }
}

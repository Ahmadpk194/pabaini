import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('CommentsService', () => {
    let service: CommentsService;
    let repository: Repository<Comment>;

    const mockCommentRepository = {
        findOne: jest.fn(),
        findAndCount: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        manager: {
            transaction: jest.fn().mockImplementation((cb) => {
                const mockManager = {
                    create: jest.fn().mockImplementation((entity, data) => data),
                    save: jest.fn().mockImplementation((data) => ({ comment_id: 1, ...data })),
                    findOne: jest.fn().mockResolvedValue({ comment_id: 1, body: 'Test comment', author: mockUser }),
                    increment: jest.fn(),
                    findOneOrFail: jest.fn(),
                };
                return cb(mockManager);
            }),
        },
    };

    const mockUser: User = {
        id: 42,
        firebase_uid: 'uid-42',
        phone: '123',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: '',
        village: '',
        is_diaspora: false,
        role: UserRole.RESIDENT,
        created_at: new Date(),
        updated_at: new Date(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CommentsService,
                {
                    provide: getRepositoryToken(Comment),
                    useValue: mockCommentRepository,
                },
            ],
        }).compile();

        service = module.get<CommentsService>(CommentsService);
        repository = module.get<Repository<Comment>>(getRepositoryToken(Comment));

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findById', () => {
        it('should return a comment if found', async () => {
            const comment = { comment_id: 1, body: 'Hello', author: mockUser };
            mockCommentRepository.findOne.mockResolvedValue(comment);

            const result = await service.findById(1);
            expect(result).toEqual(comment);
            expect(mockCommentRepository.findOne).toHaveBeenCalledWith({
                where: { comment_id: 1 },
            });
        });

        it('should throw NotFoundException if comment not found', async () => {
            mockCommentRepository.findOne.mockResolvedValue(null);
            await expect(service.findById(99)).rejects.toThrow(NotFoundException);
        });
    });

    describe('findAll', () => {
        it('should return paginated comments and hasMore boolean', async () => {
            const comments = [{ comment_id: 1, body: 'Comment 1', author: mockUser }];
            mockCommentRepository.findAndCount.mockResolvedValue([comments, 1]);

            const result = await service.findAll('announcement', 10, 1, 5);

            expect(result).toEqual({
                comments,
                total: 1,
                hasMore: false,
            });
            expect(mockCommentRepository.findAndCount).toHaveBeenCalledWith({
                where: {
                    entity_type: 'announcement',
                    entity_id: 10,
                    is_deleted: false,
                },
                order: {
                    created_at: 'ASC',
                },
                skip: 0,
                take: 5,
            });
        });
    });

    describe('create', () => {
        it('should execute inside transaction, save comment, and execute onSuccess callback', async () => {
            const onSuccess = jest.fn().mockResolvedValue(undefined);

            const result = await service.create(
                'announcement',
                10,
                42,
                'Nice post',
                onSuccess,
            );

            expect(result).toBeDefined();
            expect(onSuccess).toHaveBeenCalled();
        });
    });

    describe('update', () => {
        it('should update body and save if user is owner', async () => {
            const comment = { comment_id: 1, user_id: 42, body: 'Old text', is_deleted: false, author: mockUser };
            mockCommentRepository.findOne.mockResolvedValue(comment);
            mockCommentRepository.save.mockImplementation((c) => Promise.resolve(c));

            const result = await service.update(1, 'New text', mockUser);
            expect(result.body).toBe('New text');
            expect(mockCommentRepository.save).toHaveBeenCalled();
        });

        it('should throw ForbiddenException if user is not owner and not admin', async () => {
            const comment = { comment_id: 1, user_id: 99, body: 'Old text', is_deleted: false, author: mockUser };
            mockCommentRepository.findOne.mockResolvedValue(comment);

            await expect(service.update(1, 'New text', mockUser)).rejects.toThrow(
                ForbiddenException,
            );
        });
    });

    describe('softDelete', () => {
        it('should set is_deleted true and run callback if owner', async () => {
            const comment = { comment_id: 1, user_id: 42, body: 'Body', is_deleted: false, author: mockUser };
            mockCommentRepository.findOne.mockResolvedValue(comment);

            const onSuccess = jest.fn().mockResolvedValue(undefined);
            await service.softDelete(1, mockUser, onSuccess);

            expect(onSuccess).toHaveBeenCalled();
        });

        it('should throw ForbiddenException if user is not owner/admin', async () => {
            const comment = { comment_id: 1, user_id: 99, body: 'Body', is_deleted: false, author: mockUser };
            mockCommentRepository.findOne.mockResolvedValue(comment);

            await expect(service.softDelete(1, mockUser)).rejects.toThrow(
                ForbiddenException,
            );
        });
    });
});

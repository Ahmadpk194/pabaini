import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';

import { AnnouncementLike } from './announcement-like.entity';
import { User } from 'src/modules/users/entities/user.entity';


export enum AnnouncementCategory {
    GENERAL = 'general',
    URGENT = 'urgent',
    EVENT = 'event',
    JIRGA_DECISION = 'jirga_decision',
}

@Entity('announcements')
export class Announcement {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    title!: string;

    @Column({ type: 'text' })
    content!: string;

    @Column({
        type: 'enum',
        enum: AnnouncementCategory,
        default: AnnouncementCategory.GENERAL,
    })
    category!: AnnouncementCategory;

    @Column({ nullable: true })
    image_url!: string;

    // Denormalized counter — avoids COUNT(*) on every list fetch
    @Column({ default: 0 })
    likes_count!: number;

    @Column({ default: false })
    is_pinned!: boolean;

    @Column({ default: false })
    is_deleted!: boolean;

    @Column()
    author_id!: number;

    @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'author_id' })
    author!: User;

    @OneToMany(() => AnnouncementLike, (like) => like.announcement)
    likes!: AnnouncementLike[];

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}

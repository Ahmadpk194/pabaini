import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Unique,
} from 'typeorm';

import { Announcement } from './announcement.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Entity('announcement_likes')
@Unique(['user_id', 'announcement_id']) // prevents double-likes at DB level
export class AnnouncementLike {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    user_id!: number;

    @Column()
    announcement_id!: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ManyToOne(() => Announcement, (a) => a.likes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'announcement_id' })
    announcement!: Announcement;

    @CreateDateColumn()
    created_at!: Date;
}

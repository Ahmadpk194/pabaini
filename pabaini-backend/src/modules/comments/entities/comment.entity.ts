import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('comments')
@Index(['entity_type', 'entity_id'])
export class Comment {
    @PrimaryGeneratedColumn({ name: 'comment_id' })
    comment_id!: number;

    @Column()
    entity_type!: string;

    @Column()
    entity_id!: number;

    @Column()
    user_id!: number;

    @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    author!: User;

    @Column({ nullable: true })
    parent_id!: number | null;

    @ManyToOne(() => Comment, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'parent_id' })
    parent?: Comment | null;

    @Column({ type: 'text' })
    body!: string;

    @Column({ default: false })
    is_deleted!: boolean;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}

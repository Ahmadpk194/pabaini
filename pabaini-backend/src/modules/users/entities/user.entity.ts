import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
    ADMIN = 'admin',
    MODERATOR = 'moderator',
    RESIDENT = 'resident',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    firebase_uid!: string;

    @Column({ nullable: true, unique: true })
    phone!: string;

    @Column({ nullable: true, unique: true })
    email!: string;

    @Column({ nullable: true })
    name!: string;

    @Column({ nullable: true })
    avatar_url!: string;

    @Column({ nullable: true })
    village!: string;

    @Column({ default: false })
    is_diaspora!: boolean;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.RESIDENT,
    })
    role!: UserRole;

    @Column({ type: 'simple-array', nullable: true })
    device_tokens?: string[];

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}

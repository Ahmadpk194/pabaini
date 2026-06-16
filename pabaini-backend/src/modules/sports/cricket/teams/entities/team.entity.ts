import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { CricketPlayerProfile } from '../../entities/cricket-player-profile.entity';
import { TeamMember } from './team-member.entity';

@Entity('cricket_teams')
export class Team {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 500, nullable: true })
  logo_url?: string;

  @Column({ length: 200, nullable: true })
  home_ground?: string;

  @Column({ name: 'captain_id' })
  captain_id!: number;

  @ManyToOne(() => CricketPlayerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'captain_id' })
  captain!: CricketPlayerProfile;

  @Column({ type: 'int', nullable: true })
  founded_year?: number;

  @Column({ default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToMany(() => TeamMember, (member) => member.team)
  members!: TeamMember[];
}

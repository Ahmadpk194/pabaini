import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Team } from './team.entity';
import { CricketPlayerProfile } from '../../entities/cricket-player-profile.entity';
import { TeamMemberRole } from '../enums/team-member-role.enum';
import { TeamMemberStatus } from '../enums/team-member-status.enum';

@Entity('cricket_team_members')
@Unique(['team_id', 'player_id'])
export class TeamMember {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'team_id' })
  team_id!: number;

  @ManyToOne(() => Team, (team) => team.members)
  @JoinColumn({ name: 'team_id' })
  team!: Team;

  @Column({ name: 'player_id' })
  player_id!: number;

  @ManyToOne(() => CricketPlayerProfile)
  @JoinColumn({ name: 'player_id' })
  player!: CricketPlayerProfile;

  @Column({
    type: 'enum',
    enum: TeamMemberRole,
    default: TeamMemberRole.PLAYER,
  })
  role!: TeamMemberRole;

  @Column({
    type: 'enum',
    enum: TeamMemberStatus,
  })
  status!: TeamMemberStatus;

  @Column({ name: 'invited_by', nullable: true })
  invited_by_id?: number;

  @ManyToOne(() => CricketPlayerProfile, { nullable: true })
  @JoinColumn({ name: 'invited_by' })
  invited_by?: CricketPlayerProfile;

  @Column({ type: 'timestamp', nullable: true })
  joined_at?: Date;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Team } from '../../teams/entities/team.entity';
import { CricketPlayerProfile } from '../../entities/cricket-player-profile.entity';
import { SeriesStatus } from '../enums/matches.enums';

@Entity('cricket_series')
export class CricketSeries {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 150 })
  title!: string;

  @Column({ name: 'team_a_id' })
  team_a_id!: number;

  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_a_id' })
  team_a!: Team;

  @Column({ name: 'team_b_id' })
  team_b_id!: number;

  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_b_id' })
  team_b!: Team;

  @Column({ type: 'int' })
  total_matches!: number;

  @Column({ type: 'int', default: 0 })
  team_a_wins!: number;

  @Column({ type: 'int', default: 0 })
  team_b_wins!: number;

  @Column({
    type: 'enum',
    enum: SeriesStatus,
    default: SeriesStatus.ONGOING,
  })
  status!: SeriesStatus;

  @Column({ name: 'created_by', nullable: true })
  created_by_id?: number;

  @ManyToOne(() => CricketPlayerProfile, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  created_by?: CricketPlayerProfile;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}

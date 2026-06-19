import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CricketMatch } from './cricket-match.entity';
import { CricketPlayerProfile } from '../../entities/cricket-player-profile.entity';
import { BallExtraType } from '../enums/matches.enums';

@Entity('cricket_ball_events')
@Index('idx_ball_events_unique', ['match_id', 'innings', 'over_number', 'ball_number'], { unique: true })
export class CricketBallEvent {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'match_id' })
  match_id!: number;

  @ManyToOne(() => CricketMatch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'match_id' })
  match!: CricketMatch;

  @Column({ type: 'int' })
  innings!: number;

  @Column({ type: 'int' })
  over_number!: number;

  @Column({ type: 'int' })
  ball_number!: number;

  @Column({ name: 'batsman_id', nullable: true })
  batsman_id?: number;

  @ManyToOne(() => CricketPlayerProfile, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'batsman_id' })
  batsman?: CricketPlayerProfile;

  @Column({ name: 'bowler_id', nullable: true })
  bowler_id?: number;

  @ManyToOne(() => CricketPlayerProfile, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'bowler_id' })
  bowler?: CricketPlayerProfile;

  @Column({ length: 100, nullable: true })
  batsman_guest_name?: string;

  @Column({ length: 100, nullable: true })
  bowler_guest_name?: string;

  @Column({ type: 'int', default: 0 })
  runs!: number;

  @Column({
    type: 'enum',
    enum: BallExtraType,
    nullable: true,
  })
  extra_type?: BallExtraType;

  @Column({ type: 'int', default: 0 })
  extra_runs!: number;

  @Column({ default: false })
  is_wicket!: boolean;

  @Column({ length: 50, nullable: true })
  wicket_type?: string;

  @CreateDateColumn()
  created_at!: Date;
}

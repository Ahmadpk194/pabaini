import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CricketMatch } from './cricket-match.entity';
import { Team } from '../../teams/entities/team.entity';
import { CricketPlayerProfile } from '../../entities/cricket-player-profile.entity';
import { HowOut } from '../enums/matches.enums';

@Entity('cricket_player_match_stats')
export class CricketPlayerMatchStats {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'match_id' })
  match_id!: number;

  @ManyToOne(() => CricketMatch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'match_id' })
  match!: CricketMatch;

  @Column({ name: 'team_id' })
  team_id!: number;

  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team!: Team;

  @Column({ name: 'player_id', nullable: true })
  player_id?: number;

  @ManyToOne(() => CricketPlayerProfile, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'player_id' })
  player?: CricketPlayerProfile;

  @Column({ length: 100, nullable: true })
  guest_name?: string;

  @Column({ type: 'int', default: 0 })
  runs!: number;

  @Column({ type: 'int', default: 0 })
  balls_faced!: number;

  @Column({ type: 'int', default: 0 })
  fours!: number;

  @Column({ type: 'int', default: 0 })
  sixes!: number;

  @Column({
    type: 'enum',
    enum: HowOut,
    nullable: true,
  })
  how_out?: HowOut;

  @Column({ default: false })
  is_not_out!: boolean;

  @Column({ type: 'decimal', precision: 4, scale: 1, default: 0, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value),
  } })
  overs_bowled!: number;

  @Column({ type: 'int', default: 0 })
  runs_given!: number;

  @Column({ type: 'int', default: 0 })
  wickets!: number;

  @Column({ type: 'int', default: 0 })
  wides!: number;

  @Column({ type: 'int', default: 0 })
  no_balls!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}

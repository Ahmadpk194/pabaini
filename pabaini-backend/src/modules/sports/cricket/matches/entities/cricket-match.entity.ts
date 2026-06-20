import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Check,
} from 'typeorm';
import { CricketSeries } from './cricket-series.entity';
import { Team } from '../../teams/entities/team.entity';
import { CricketPlayerProfile } from '../../entities/cricket-player-profile.entity';
import { CricketBallEvent } from './cricket-ball-event.entity';
import { MatchScoringMode, MatchStatus } from '../enums/matches.enums';

@Entity('cricket_matches')
@Check('chk_match_context', 'series_id IS NULL OR tournament_id IS NULL')
export class CricketMatch {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'series_id', nullable: true })
  series_id?: number;

  @ManyToOne(() => CricketSeries, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'series_id' })
  series?: CricketSeries;

  @Column({ name: 'tournament_id', type: 'int', nullable: true })
  tournament_id?: number;

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

  @Column({ name: 'requested_by' })
  requested_by!: number;

  @ManyToOne(() => CricketPlayerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requested_by' })
  requester!: CricketPlayerProfile;

  @Column({ type: 'int' })
  overs!: number;

  @Column({ length: 200, nullable: true })
  venue?: string;

  @Column({ type: 'timestamp', nullable: true })
  scheduled_at?: Date;

  @Column({
    type: 'enum',
    enum: MatchScoringMode,
    nullable: true,
  })
  scoring_mode?: MatchScoringMode;

  @Column({ name: 'scorer_id', nullable: true })
  scorer_id?: number;

  @ManyToOne(() => CricketPlayerProfile, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'scorer_id' })
  scorer?: CricketPlayerProfile;

  @Column({
    type: 'enum',
    enum: MatchStatus,
    default: MatchStatus.PENDING_REQUEST,
  })
  status!: MatchStatus;

  @Column({ name: 'winner_team_id', nullable: true })
  winner_team_id?: number;

  @ManyToOne(() => Team, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'winner_team_id' })
  winner_team?: Team;

  @Column({ name: 'man_of_match_id', nullable: true })
  man_of_match_id?: number;

  @ManyToOne(() => CricketPlayerProfile, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'man_of_match_id' })
  man_of_match?: CricketPlayerProfile;

  @Column({ length: 100, nullable: true, name: 'man_of_match_guest_name' })
  man_of_match_guest_name?: string;

  @Column({ length: 20, nullable: true })
  team_a_score?: string;

  @Column({ length: 20, nullable: true })
  team_b_score?: string;

  @Column({ default: false })
  team_a_lineup_set!: boolean;

  @Column({ default: false })
  team_b_lineup_set!: boolean;

  @Column({ type: 'int', nullable: true, name: 'current_innings' })
  current_innings?: number;

  @Column({ type: 'int', default: 0, name: 'current_over' })
  current_over!: number;

  @Column({ type: 'int', default: 0, name: 'current_ball' })
  current_ball!: number;

  @Column({ type: 'int', nullable: true, name: 'current_batting_team_id' })
  current_batting_team_id?: number;

  @ManyToOne(() => Team, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'current_batting_team_id' })
  current_batting_team?: Team;

  @Column({ type: 'int', nullable: true, name: 'striker_id' })
  striker_id?: number;

  @ManyToOne(() => CricketPlayerProfile, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'striker_id' })
  striker?: CricketPlayerProfile;

  @Column({ length: 100, nullable: true, name: 'striker_guest_name' })
  striker_guest_name?: string;

  @Column({ type: 'int', nullable: true, name: 'non_striker_id' })
  non_striker_id?: number;

  @ManyToOne(() => CricketPlayerProfile, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'non_striker_id' })
  non_striker?: CricketPlayerProfile;

  @Column({ length: 100, nullable: true, name: 'non_striker_guest_name' })
  non_striker_guest_name?: string;

  @Column({ type: 'int', nullable: true, name: 'current_bowler_id' })
  current_bowler_id?: number;

  @ManyToOne(() => CricketPlayerProfile, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'current_bowler_id' })
  current_bowler?: CricketPlayerProfile;

  @Column({ length: 100, nullable: true, name: 'current_bowler_guest_name' })
  current_bowler_guest_name?: string;

  @Column({ type: 'int', default: 0, name: 'innings_1_score' })
  innings_1_score!: number;

  @Column({ type: 'int', default: 0, name: 'innings_1_wickets' })
  innings_1_wickets!: number;

  @Column({ type: 'decimal', precision: 4, scale: 1, default: 0, name: 'innings_1_overs', transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value),
  } })
  innings_1_overs!: number;

  @Column({ type: 'int', nullable: true, name: 'innings_1_batting_team_id' })
  innings_1_batting_team_id?: number;

  @ManyToOne(() => Team, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'innings_1_batting_team_id' })
  innings_1_batting_team?: Team;

  @Column({ type: 'int', default: 0, name: 'innings_2_score' })
  innings_2_score!: number;

  @Column({ type: 'int', default: 0, name: 'innings_2_wickets' })
  innings_2_wickets!: number;

  @Column({ type: 'decimal', precision: 4, scale: 1, default: 0, name: 'innings_2_overs', transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value),
  } })
  innings_2_overs!: number;

  @Column({ type: 'int', nullable: true, name: 'innings_2_batting_team_id' })
  innings_2_batting_team_id?: number;

  @ManyToOne(() => Team, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'innings_2_batting_team_id' })
  innings_2_batting_team?: Team;

  @Column({ type: 'int', nullable: true, name: 'target' })
  target?: number;

  @Column({ type: 'int', nullable: true, name: 'last_ball_event_id' })
  last_ball_event_id?: number;

  @ManyToOne(() => CricketBallEvent, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'last_ball_event_id' })
  last_ball_event?: CricketBallEvent;

  @Column({ type: 'boolean', default: false, name: 'is_tie' })
  is_tie!: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'result_submitted_at' })
  result_submitted_at?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'result_locked_at' })
  result_locked_at?: Date;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { CricketRole, BattingHand, BowlingArm, BowlingType } from '../enums/cricket.enums';

@Entity('cricket_player_profiles')
export class CricketPlayerProfile {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  user_id!: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({
    type: 'enum',
    enum: CricketRole,
  })
  role!: CricketRole;

  @Column({
    type: 'enum',
    enum: BattingHand,
  })
  batting_hand!: BattingHand;

  @Column({
    type: 'enum',
    enum: BowlingArm,
  })
  bowling_arm!: BowlingArm;

  @Column({
    type: 'enum',
    enum: BowlingType,
  })
  bowling_type!: BowlingType;

  @Column({ default: true })
  is_active!: boolean;

  @Column({ type: 'int', default: 0, name: 'total_matches' })
  total_matches!: number;

  @Column({ type: 'int', default: 0, name: 'total_runs' })
  total_runs!: number;

  @Column({ type: 'int', default: 0, name: 'total_balls_faced' })
  total_balls_faced!: number;

  @Column({ type: 'int', default: 0, name: 'total_fours' })
  total_fours!: number;

  @Column({ type: 'int', default: 0, name: 'total_sixes' })
  total_sixes!: number;

  @Column({ type: 'int', default: 0, name: 'highest_score' })
  highest_score!: number;

  @Column({ type: 'int', default: 0, name: 'total_wickets' })
  total_wickets!: number;

  @Column({ type: 'decimal', precision: 5, scale: 1, default: 0, name: 'total_overs_bowled', transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value),
  } })
  total_overs_bowled!: number;

  @Column({ type: 'int', default: 0, name: 'total_runs_given' })
  total_runs_given!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}

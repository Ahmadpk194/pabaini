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

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}

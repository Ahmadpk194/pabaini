import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Check,
} from 'typeorm';
import { CricketMatch } from './cricket-match.entity';
import { Team } from '../../teams/entities/team.entity';
import { CricketPlayerProfile } from '../../entities/cricket-player-profile.entity';

@Entity('cricket_match_players')
@Check('chk_player_or_guest', 'player_id IS NOT NULL OR guest_name IS NOT NULL')
export class CricketMatchPlayer {
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

  @Column({ type: 'int', nullable: true })
  batting_order?: number;

  @CreateDateColumn()
  created_at!: Date;
}

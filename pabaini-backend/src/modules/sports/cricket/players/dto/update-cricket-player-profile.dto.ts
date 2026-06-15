import { IsEnum, IsOptional } from 'class-validator';
import { CricketRole, BattingHand, BowlingArm, BowlingType } from '../../enums/cricket.enums';

export class UpdateCricketPlayerProfileDto {
  @IsEnum(CricketRole)
  @IsOptional()
  role?: CricketRole;

  @IsEnum(BattingHand)
  @IsOptional()
  batting_hand?: BattingHand;

  @IsEnum(BowlingArm)
  @IsOptional()
  bowling_arm?: BowlingArm;

  @IsEnum(BowlingType)
  @IsOptional()
  bowling_type?: BowlingType;
}

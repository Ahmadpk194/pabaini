import { IsEnum, IsNotEmpty } from 'class-validator';
import { CricketRole, BattingHand, BowlingArm, BowlingType } from '../../enums/cricket.enums';

export class CreateCricketPlayerProfileDto {
  @IsEnum(CricketRole)
  @IsNotEmpty()
  role!: CricketRole;

  @IsEnum(BattingHand)
  @IsNotEmpty()
  batting_hand!: BattingHand;

  @IsEnum(BowlingArm)
  @IsNotEmpty()
  bowling_arm!: BowlingArm;

  @IsEnum(BowlingType)
  @IsNotEmpty()
  bowling_type!: BowlingType;
}

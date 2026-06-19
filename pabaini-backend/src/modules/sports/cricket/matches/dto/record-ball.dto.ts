import { IsInt, IsNotEmpty, IsOptional, IsString, IsBoolean, IsEnum, Min, Max } from 'class-validator';
import { BallExtraType, HowOut } from '../enums/matches.enums';

export class RecordBallDto {
  @IsInt()
  @Min(0)
  @Max(6)
  @IsNotEmpty()
  runs!: number;

  @IsEnum(BallExtraType)
  @IsOptional()
  extra_type?: BallExtraType;

  @IsInt()
  @Min(0)
  @IsOptional()
  extra_runs?: number;

  @IsBoolean()
  @IsNotEmpty()
  is_wicket!: boolean;

  @IsEnum(HowOut)
  @IsOptional()
  wicket_type?: HowOut;

  @IsInt()
  @IsOptional()
  next_batsman_id?: number;

  @IsString()
  @IsOptional()
  next_batsman_guest_name?: string;
}

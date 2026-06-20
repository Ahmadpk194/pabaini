import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { HowOut } from '../enums/matches.enums';

export class PlayerStatDto {
  @IsInt()
  @IsOptional()
  player_id?: number;

  @IsString()
  @IsOptional()
  guest_name?: string;

  @IsInt()
  @IsNotEmpty()
  team_id!: number;

  // Batting
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  runs!: number;

  @IsInt()
  @Min(0)
  @IsNotEmpty()
  balls_faced!: number;

  @IsInt()
  @Min(0)
  @IsNotEmpty()
  fours!: number;

  @IsInt()
  @Min(0)
  @IsNotEmpty()
  sixes!: number;

  @IsEnum(HowOut)
  @IsOptional()
  how_out?: HowOut;

  @IsBoolean()
  @IsNotEmpty()
  is_not_out!: boolean;

  // Bowling
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  overs_bowled!: number;

  @IsInt()
  @Min(0)
  @IsNotEmpty()
  runs_given!: number;

  @IsInt()
  @Min(0)
  @IsNotEmpty()
  wickets!: number;

  @IsInt()
  @Min(0)
  @IsNotEmpty()
  wides!: number;

  @IsInt()
  @Min(0)
  @IsNotEmpty()
  no_balls!: number;
}

export class SubmitResultDto {
  @IsInt()
  @IsNotEmpty()
  winner_team_id!: number;

  @IsInt()
  @IsOptional()
  man_of_match_id?: number;

  @IsString()
  @IsOptional()
  man_of_match_guest_name?: string;

  @IsString()
  @IsNotEmpty()
  team_a_score!: string;

  @IsString()
  @IsNotEmpty()
  team_b_score!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerStatDto)
  @IsNotEmpty()
  player_stats!: PlayerStatDto[];
}

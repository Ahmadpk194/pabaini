import { IsInt, IsNotEmpty, IsOptional, IsString, IsISO8601, Min, IsEnum } from 'class-validator';
import { MatchScoringMode } from '../enums/matches.enums';

export class RequestMatchDto {
  @IsInt()
  @IsNotEmpty()
  opponent_team_id!: number;

  @IsString()
  @IsOptional()
  venue?: string;

  @IsISO8601()
  @IsOptional()
  scheduled_at?: string;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  overs!: number;

  @IsEnum(MatchScoringMode)
  @IsNotEmpty()
  scoring_mode!: MatchScoringMode;
}

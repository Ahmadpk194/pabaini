import { IsInt, IsOptional, IsString, IsISO8601, Min, IsEnum } from 'class-validator';
import { MatchScoringMode } from '../enums/matches.enums';

export class UpdateMatchDto {
  @IsString()
  @IsOptional()
  venue?: string;

  @IsISO8601()
  @IsOptional()
  scheduled_at?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  overs?: number;

  @IsEnum(MatchScoringMode)
  @IsOptional()
  scoring_mode?: MatchScoringMode;
}

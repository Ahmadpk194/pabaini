import {
  IsInt,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PlayerStatDto } from './submit-result.dto';

export class EditResultDto {
  @IsInt()
  @IsOptional()
  winner_team_id?: number;

  @IsInt()
  @IsOptional()
  man_of_match_id?: number;

  @IsString()
  @IsOptional()
  man_of_match_guest_name?: string;

  @IsString()
  @IsOptional()
  team_a_score?: string;

  @IsString()
  @IsOptional()
  team_b_score?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerStatDto)
  @IsOptional()
  player_stats?: PlayerStatDto[];
}

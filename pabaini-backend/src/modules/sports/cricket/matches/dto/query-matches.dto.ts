import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MatchStatus } from '../enums/matches.enums';

export class QueryMatchesDto {
  @IsEnum(MatchStatus)
  @IsOptional()
  status?: MatchStatus;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  team_id?: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}

import { IsArray, ValidateNested, IsInt, IsOptional, IsString, Min, Max, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class LineupPlayerDto {
  @IsInt()
  @IsOptional()
  player_id?: number;

  @IsString()
  @IsOptional()
  guest_name?: string;

  @IsInt()
  @Min(1)
  @Max(11)
  @IsNotEmpty()
  batting_order!: number;
}

export class DeclareLineupDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineupPlayerDto)
  @IsNotEmpty()
  players!: LineupPlayerDto[];
}

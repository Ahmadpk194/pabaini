import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class StartMatchDto {
  @IsInt()
  @IsOptional()
  scorer_id?: number;

  @IsInt()
  @IsNotEmpty()
  toss_winner_team_id!: number;

  @IsInt()
  @IsNotEmpty()
  batting_first_team_id!: number;

  @IsInt()
  @IsOptional()
  opening_striker_id?: number;

  @IsString()
  @IsOptional()
  opening_striker_guest_name?: string;

  @IsInt()
  @IsOptional()
  opening_non_striker_id?: number;

  @IsString()
  @IsOptional()
  opening_non_striker_guest_name?: string;

  @IsInt()
  @IsOptional()
  opening_bowler_id?: number;

  @IsString()
  @IsOptional()
  opening_bowler_guest_name?: string;
}

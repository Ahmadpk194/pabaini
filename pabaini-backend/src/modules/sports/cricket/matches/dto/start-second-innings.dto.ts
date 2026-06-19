import { IsInt, IsOptional, IsString } from 'class-validator';

export class StartSecondInningsDto {
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

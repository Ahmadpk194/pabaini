import { IsInt, IsOptional, IsString } from 'class-validator';

export class SelectBowlerDto {
  @IsInt()
  @IsOptional()
  bowler_id?: number;

  @IsString()
  @IsOptional()
  bowler_guest_name?: string;
}

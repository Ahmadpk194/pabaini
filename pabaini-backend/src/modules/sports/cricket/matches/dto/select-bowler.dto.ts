import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class SelectBowlerDto {
  @IsInt()
  @IsOptional()
  bowler_id?: number;

  @IsString()
  @IsOptional()
  bowler_guest_name?: string;

  @IsBoolean()
  @IsOptional()
  bypass_consecutive_check?: boolean;
}

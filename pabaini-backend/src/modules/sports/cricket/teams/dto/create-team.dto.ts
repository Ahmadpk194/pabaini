import { IsString, IsNotEmpty, IsOptional, MaxLength, IsInt, Min, Max } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  home_ground?: string;

  @IsInt()
  @IsOptional()
  @Min(1900)
  @Max(new Date().getFullYear())
  founded_year?: number;
}

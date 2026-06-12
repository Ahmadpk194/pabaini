import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  village?: string;

  @IsOptional()
  @IsBoolean()
  is_diaspora?: boolean;

  @IsOptional()
  @IsString()
  avatar_url?: string;
}
import { IsString, IsOptional, IsBoolean, IsEmail } from 'class-validator';

export class CreateUserDto {
  @IsString()
  firebase_uid!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
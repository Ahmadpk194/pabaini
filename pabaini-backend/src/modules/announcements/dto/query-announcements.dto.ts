import { IsOptional, IsEnum, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { AnnouncementCategory } from '../entities/announcement.entity';

export class QueryAnnouncementsDto {
  @IsEnum(AnnouncementCategory)
  @IsOptional()
  category?: AnnouncementCategory;

  @IsString()
  @IsOptional()
  search?: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 10;
}

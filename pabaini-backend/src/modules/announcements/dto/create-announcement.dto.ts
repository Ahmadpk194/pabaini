import { IsString, IsEnum, IsOptional, IsUrl, MinLength, IsInt } from 'class-validator';
import { AnnouncementCategory } from '../entities/announcement.entity';

export class CreateAnnouncementDto {
    @IsString()
    @MinLength(3)
    title!: string;

    @IsString()
    @MinLength(10)
    content!: string;

    @IsOptional()
    @IsEnum(AnnouncementCategory)
    category?: AnnouncementCategory;

    @IsOptional()
    @IsUrl()
    image_url?: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsInt()
    match_id?: number;
}

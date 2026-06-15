import { IsString, IsEnum, IsOptional, IsUrl, MinLength, IsBoolean } from 'class-validator';
import { AnnouncementCategory } from '../entities/announcement.entity';

export class UpdateAnnouncementDto {
    @IsOptional()
    @IsString()
    @MinLength(3)
    title?: string;

    @IsOptional()
    @IsString()
    @MinLength(10)
    content?: string;

    @IsOptional()
    @IsEnum(AnnouncementCategory)
    category?: AnnouncementCategory;

    @IsOptional()
    @IsUrl()
    image_url?: string;

    @IsOptional()
    @IsBoolean()
    is_pinned?: boolean;

    @IsOptional()
    @IsString()
    location?: string;
}

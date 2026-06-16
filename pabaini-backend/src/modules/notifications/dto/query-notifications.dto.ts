import { IsBooleanString, IsOptional, IsNumberString } from 'class-validator';

export class QueryNotificationsDto {
  @IsBooleanString()
  @IsOptional()
  unread_only?: string;

  @IsNumberString()
  @IsOptional()
  page?: string;

  @IsNumberString()
  @IsOptional()
  limit?: string;
}

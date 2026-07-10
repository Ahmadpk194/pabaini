import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class RetireBatsmanDto {
  @IsIn(['retired_hurt', 'retired_out'])
  retirement_type!: 'retired_hurt' | 'retired_out';

  @IsIn(['striker', 'non_striker'])
  target!: 'striker' | 'non_striker';

  @IsInt()
  @IsOptional()
  next_batsman_id?: number;

  @IsString()
  @IsOptional()
  next_batsman_guest_name?: string;
}

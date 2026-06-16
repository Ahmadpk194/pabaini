import { IsInt, IsNotEmpty } from 'class-validator';

export class TransferCaptainDto {
  @IsInt()
  @IsNotEmpty()
  player_id!: number;
}

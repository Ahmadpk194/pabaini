import { IsInt, IsNotEmpty } from 'class-validator';

export class InvitePlayerDto {
  @IsInt()
  @IsNotEmpty()
  player_id!: number;
}

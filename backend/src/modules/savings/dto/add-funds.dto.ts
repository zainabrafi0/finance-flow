import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class AddFundsDto {
  @IsString() @IsNotEmpty() walletId!: string;
  @IsNumber() @Min(0.01) amount!: number;
}

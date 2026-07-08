import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRecurringDto {
  @ApiProperty({ example: '60c72b2f9b1d8e1234567890' })
  @IsNotEmpty()
  @IsString()
  walletId!: string;

  @ApiProperty({ example: 'expense', enum: ['income', 'expense'] })
  @IsNotEmpty()
  @IsString()
  @IsEnum(['income', 'expense'])
  type!: string;

  @ApiProperty({ example: 1200 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount!: number;

  @ApiProperty({ example: 'Utilities' })
  @IsNotEmpty()
  @IsString()
  category!: string;

  @ApiProperty({ example: 'Monthly Internet Subscription' })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiProperty({ example: 'monthly', enum: ['daily', 'weekly', 'monthly'] })
  @IsNotEmpty()
  @IsString()
  @IsEnum(['daily', 'weekly', 'monthly'])
  frequency!: string;

  @ApiProperty({ example: '2026-07-09T00:00:00.000Z' })
  @IsNotEmpty()
  @IsDateString()
  nextRunDate!: string;
}

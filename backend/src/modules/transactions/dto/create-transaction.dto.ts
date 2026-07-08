import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsEnum,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '../schemas/transaction.schema';

export class CreateTransactionDto {
  @ApiProperty({ example: '64a12b3c4d5e6f7a8b9c0d1e' })
  @IsString()
  @IsNotEmpty()
  walletId!: string;

  @ApiPropertyOptional({
    example: '64a12b3c4d5e6f7a8b9c0d1f',
    description: 'Required for transfer type',
  })
  @IsOptional()
  @IsString()
  destinationWalletId?: string;

  @ApiProperty({ example: '64a12b3c4d5e6f7a8b9c0d20' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'Groceries' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'Metro cash and carry' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 45.5 })
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiProperty({ enum: TransactionType, example: TransactionType.EXPENSE })
  @IsEnum(TransactionType)
  type!: TransactionType;

  @ApiPropertyOptional({ example: '2026-07-06T12:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @ApiPropertyOptional({ example: 'Weekly grocery run at Metro' })
  @IsOptional()
  @IsString()
  note?: string;
}

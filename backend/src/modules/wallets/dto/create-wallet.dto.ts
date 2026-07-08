import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Length,
  IsNumber,
  Min,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateWalletDto {
  @ApiProperty({ example: 'Main Checking Account' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z][A-Za-z\s.'-]*$/, {
    message:
      'Wallet name may contain letters, spaces, apostrophes, dots, or hyphens only',
  })
  name!: string;

  @ApiPropertyOptional({ example: 'USD', default: 'USD' })
  @IsOptional()
  @IsString()
  @Length(3, 3, {
    message: 'Currency must be exactly 3 characters (e.g., USD, PKR, EUR)',
  })
  currency?: string;

  @ApiPropertyOptional({
    example: 1000,
    description: 'Initial starting balance',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'Initial balance cannot be negative' })
  balance?: number;

  @ApiPropertyOptional({
    example: 'Bank',
    description: 'Wallet classification type',
  })
  @IsOptional()
  @IsString()
  walletType?: string;

  @ApiPropertyOptional({
    example: 'Checking',
    description: 'Account sub-type based on the selected account category',
  })
  @IsOptional()
  @IsString()
  accountSubType?: string;

  @ApiPropertyOptional({
    example: 'Meezan Bank',
    description: 'Associated banking institution',
  })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({
    example: 'PK12MEZN000123456789',
    description: 'Account or IBAN Number',
  })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({
    example: 300000,
    description: 'Credit limit for credit cards',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  creditLimit?: number;
}

import { IsString, IsNumber, IsNotEmpty, Min, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateBudgetDto {
  @ApiProperty({ example: 'Food & Dining' })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({ example: 1000 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit!: number;

  @ApiProperty({ example: '10', description: 'Month as a 2-digit string' })
  @IsString()
  @Matches(/^(0[1-9]|1[0-2])$/, { message: 'Month must be between 01 and 12' })
  month!: string;

  @ApiProperty({ example: 2023 })
  @Type(() => Number)
  @IsNumber()
  year!: number;
}

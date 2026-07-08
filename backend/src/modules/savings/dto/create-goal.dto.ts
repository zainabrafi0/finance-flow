import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsDateString,
  Min,
} from 'class-validator';

export class CreateGoalDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() description!: string;
  @IsNumber() @Min(1) targetAmount!: number;
  @IsDateString() targetDate!: string;
}

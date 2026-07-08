import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email' })
  @Matches(/^[^\s@]+@gmail\.com$/i, {
    message: 'Email must be a Gmail address ending with @gmail.com',
  })
  email!: string;

  @ApiProperty({ example: 'StrongPass!123' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;

  @ApiProperty({ example: 'John' })
  @IsNotEmpty()
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsNotEmpty()
  @IsString()
  lastName!: string;

  @ApiProperty({ example: '123456' })
  @IsNotEmpty()
  @IsString()
  otpCode!: string;
}

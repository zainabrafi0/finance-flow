import { IsEmail, IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ example: 'john.doe@gmail.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'registration',
    enum: ['registration', 'reset-password'],
  })
  @IsNotEmpty()
  @IsString()
  @IsEnum(['registration', 'reset-password'])
  purpose!: 'registration' | 'reset-password';
}

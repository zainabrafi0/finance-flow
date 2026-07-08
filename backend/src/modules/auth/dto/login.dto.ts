import { IsEmail, IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  @Matches(/^[^\s@]+@gmail\.com$/i, {
    message: 'Email must be a Gmail address ending with @gmail.com',
  })
  email!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  password!: string;
}

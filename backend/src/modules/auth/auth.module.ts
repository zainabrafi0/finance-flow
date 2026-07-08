import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { Otp, OtpSchema } from './schemas/otp.schema';
import { EmailService } from './email.service';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({}), // Secrets are provided dynamically in the service
    CloudinaryModule,
    MongooseModule.forFeature([{ name: Otp.name, schema: OtpSchema }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, EmailService],
})
export class AuthModule {}

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Otp } from './schemas/otp.schema';
import { EmailService } from './email.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectModel(Otp.name) private otpModel: Model<Otp>,
    private emailService: EmailService,
    private auditService: AuditService,
  ) {}

  async sendOtp(dto: SendOtpDto) {
    const email = dto.email.toLowerCase().trim();
    const existingUser = await this.usersService.findByEmail(email);

    if (dto.purpose === 'registration' && existingUser) {
      throw new ConflictException('Email already in use');
    }

    if (dto.purpose === 'reset-password' && !existingUser) {
      throw new NotFoundException('No account found with this email');
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    await this.otpModel.deleteMany({ email });

    const newOtp = new this.otpModel({
      email,
      code: otpCode,
      expiresAt,
    });
    await newOtp.save();

    await this.emailService.sendOtpEmail(email, otpCode, dto.purpose);

    return { message: 'Verification code sent to your email.' };
  }

  async register(registerDto: RegisterDto) {
    const email = registerDto.email.toLowerCase().trim();
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) throw new ConflictException('Email already in use');

    const otpRecord = await this.otpModel.findOne({
      email,
      code: registerDto.otpCode,
      expiresAt: { $gt: new Date() },
    });
    if (!otpRecord) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    const user = await this.usersService.create({
      email,
      passwordHash,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
    });

    await this.otpModel.deleteMany({ email });

    await this.auditService.log({
      userId: user._id.toString(),
      action: 'register',
      details: 'User successfully created account and verified email OTP',
    });

    return this.generateTokens(user);
  }

  async resetPassword(dto: ResetPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('No account found with this email');

    const otpRecord = await this.otpModel.findOne({
      email,
      code: dto.otpCode,
      expiresAt: { $gt: new Date() },
    });
    if (!otpRecord) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.newPassword, salt);

    await this.usersService.updateProfile(user._id.toString(), {
      passwordHash,
    });

    await this.otpModel.deleteMany({ email });

    await this.auditService.log({
      userId: user._id.toString(),
      action: 'reset_password',
      details: 'User reset account password successfully using OTP',
    });

    return { message: 'Password reset successful. You can now login.' };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');

    await this.auditService.log({
      userId: user._id.toString(),
      action: 'login',
      details: 'User successfully logged in via credentials',
    });

    return this.generateTokens(user);
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.hashedRefreshToken)
      throw new UnauthorizedException('Access Denied');

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.hashedRefreshToken,
    );
    if (!refreshTokenMatches) throw new UnauthorizedException('Access Denied');

    return this.generateTokens(user);
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRATION') as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRATION',
        ) as any,
      }),
    ]);

    const salt = await bcrypt.genSalt(10);
    const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);
    await this.usersService.updateRefreshToken(
      user._id.toString(),
      hashedRefreshToken,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePictureUrl: user.profilePictureUrl || null,
      },
    };
  }
}

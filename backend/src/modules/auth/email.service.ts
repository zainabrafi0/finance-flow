import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<number>('SMTP_PORT') === 465,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendOtpEmail(
    email: string,
    otp: string,
    purpose: 'registration' | 'reset-password',
  ): Promise<void> {
    const isReg = purpose === 'registration';
    const subject = isReg
      ? 'FinanceFlow Account Verification'
      : 'FinanceFlow Password Reset';
    const title = isReg ? 'Verify Your Account' : 'Reset Your Password';
    const instruction = isReg
      ? 'Thank you for choosing FinanceFlow. Please use the following One-Time Password (OTP) to complete your registration. This code is valid for 5 minutes.'
      : 'We received a request to reset your FinanceFlow password. Use the following OTP to complete the reset. This code is valid for 5 minutes. If you did not make this request, please ignore this email.';

    const html = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1a202c;">
        <div style="text-align: center; margin-bottom: 25px;">
          <div style="display: inline-block; padding: 10px 16px; background-color: #0891b2; color: #ffffff; font-weight: bold; border-radius: 12px; font-size: 20px;">FF</div>
          <h2 style="margin-top: 15px; margin-bottom: 0; font-size: 22px; font-weight: 800; color: #0f172a;">${title}</h2>
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">${instruction}</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; padding: 12px 24px; font-size: 28px; font-weight: 800; letter-spacing: 4px; color: #0891b2; background-color: #ecfeff; border: 2px dashed #22d3ee; border-radius: 12px;">
            ${otp}
          </div>
        </div>
        <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 15px; margin-top: 25px;">
          This is an automated security email from FinanceFlow. Please do not reply directly.
        </p>
      </div>
    `;

    const fromAddress = this.configService.get<string>('SMTP_FROM');

    try {
      await this.transporter.sendMail({
        from: fromAddress,
        to: email,
        subject: subject,
        html: html,
      });
      this.logger.log(`Successfully sent OTP email to: ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}`, error);
      throw new Error(
        'Failed to send verification email. Please check your configuration.',
      );
    }
  }
}

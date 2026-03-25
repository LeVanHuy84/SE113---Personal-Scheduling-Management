import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

type SendVerificationEmailInput = {
  to: string;
  token: string;
  displayName: string | null;
};

type SendPasswordResetEmailInput = {
  to: string;
  token: string;
  displayName: string | null;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendVerificationEmail(
    input: SendVerificationEmailInput,
  ): Promise<void> {
    const host = this.configService.get<string>('EMAIL_HOST');
    const portRaw = this.configService.get<string>('EMAIL_PORT');
    const user = this.configService.get<string>('EMAIL_USER');
    const pass = this.configService.get<string>('EMAIL_PASS');
    const from = this.configService.get<string>('EMAIL_FROM');
    const appBaseUrl =
      this.configService.get<string>('FRONTEND_BASE_URL') ??
      'http://localhost:3000';

    if (!host || !portRaw || !user || !pass || !from) {
      this.logger.warn(
        'Email SMTP configuration is incomplete; skipping verification email',
      );
      return;
    }

    const port = Number(portRaw);
    if (Number.isNaN(port)) {
      this.logger.warn('EMAIL_PORT is invalid; skipping verification email');
      return;
    }

    const verificationLink = `${appBaseUrl}/verify-email?token=${encodeURIComponent(input.token)}`;
    const recipientName = input.displayName?.trim() || 'there';

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    await transporter.sendMail({
      from,
      to: input.to,
      subject: 'Verify your email',
      html: `
        <div
        style="
            margin: 0;
            padding: 0;
            background-color: #f4f6f8;
            font-family: Arial, Helvetica, sans-serif;
        "
        >
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0">
            <tr>
            <td align="center">
                <table
                width="500"
                cellpadding="0"
                cellspacing="0"
                style="
                    background: #ffffff;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
                "
                >
                <!-- Header -->
                <tr>
                    <td
                    style="
                        background: linear-gradient(135deg, #4f46e5, #6366f1);
                        padding: 24px;
                        text-align: center;
                        color: #ffffff;
                    "
                    >
                    <h1 style="margin: 0; font-size: 20px">PSMS</h1>
                    </td>
                </tr>

                <!-- Body -->
                <tr>
                    <td style="padding: 32px">
                    <h2 style="margin: 0 0 16px 0; color: #111827">
                        Hello ${recipientName}, 👋
                    </h2>

                    <p
                        style="
                        margin: 0 0 16px 0;
                        color: #4b5563;
                        font-size: 14px;
                        line-height: 1.6;
                        "
                    >
                        Thanks for signing up! Please confirm your email address by
                        clicking the button below.
                    </p>

                    <!-- Button -->
                    <div style="text-align: center; margin: 32px 0">
                        <a
                        href="${verificationLink}"
                        style="
                            background: #4f46e5;
                            color: #ffffff;
                            padding: 12px 24px;
                            text-decoration: none;
                            border-radius: 8px;
                            font-size: 14px;
                            font-weight: 600;
                            display: inline-block;
                        "
                        >
                        Verify Email
                        </a>
                    </div>

                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px">
                        This link will expire soon. If you didn’t create an account, you
                        can safely ignore this email.
                    </p>

                    <!-- Fallback link -->
                    <p
                        style="
                        margin: 16px 0 0 0;
                        color: #9ca3af;
                        font-size: 12px;
                        text-align: center;
                        "
                    >
                        If you didn’t request this, you can safely ignore this email.
                    </p>
                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td
                    style="
                        padding: 16px;
                        text-align: center;
                        font-size: 12px;
                        color: #9ca3af;
                    "
                    >
                    © ${new Date().getFullYear()} PSMS. All rights reserved.
                    </td>
                </tr>
                </table>
            </td>
            </tr>
        </table>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(
    input: SendPasswordResetEmailInput,
  ): Promise<void> {
    const host = this.configService.get<string>('EMAIL_HOST');
    const portRaw = this.configService.get<string>('EMAIL_PORT');
    const user = this.configService.get<string>('EMAIL_USER');
    const pass = this.configService.get<string>('EMAIL_PASS');
    const from = this.configService.get<string>('EMAIL_FROM');
    const appBaseUrl =
      this.configService.get<string>('FRONTEND_BASE_URL') ??
      'http://localhost:3000';

    if (!host || !portRaw || !user || !pass || !from) {
      this.logger.warn(
        'Email SMTP configuration is incomplete; skipping password reset email',
      );
      return;
    }

    const port = Number(portRaw);
    if (Number.isNaN(port)) {
      this.logger.warn('EMAIL_PORT is invalid; skipping password reset email');
      return;
    }

    const resetLink = `${appBaseUrl}/reset-password?token=${encodeURIComponent(input.token)}`;
    const recipientName = input.displayName?.trim() || 'there';

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    await transporter.sendMail({
      from,
      to: input.to,
      subject: 'Reset your password',
      html: `
        <div
        style="
            margin: 0;
            padding: 0;
            background-color: #f4f6f8;
            font-family: Arial, Helvetica, sans-serif;
        "
        >
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0">
            <tr>
            <td align="center">
                <table
                width="500"
                cellpadding="0"
                cellspacing="0"
                style="
                    background: #ffffff;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
                "
                >
                <tr>
                    <td
                    style="
                        background: linear-gradient(135deg, #0f766e, #14b8a6);
                        padding: 24px;
                        text-align: center;
                        color: #ffffff;
                    "
                    >
                    <h1 style="margin: 0; font-size: 20px">PSMS</h1>
                    </td>
                </tr>

                <tr>
                    <td style="padding: 32px">
                    <h2 style="margin: 0 0 16px 0; color: #111827">
                        Hello ${recipientName},
                    </h2>

                    <p
                        style="
                        margin: 0 0 16px 0;
                        color: #4b5563;
                        font-size: 14px;
                        line-height: 1.6;
                        "
                    >
                        We received a request to reset your password. Use the button below to continue.
                    </p>

                    <div style="text-align: center; margin: 32px 0">
                        <a
                        href="${resetLink}"
                        style="
                            background: #0f766e;
                            color: #ffffff;
                            padding: 12px 24px;
                            text-decoration: none;
                            border-radius: 8px;
                            font-size: 14px;
                            font-weight: 600;
                            display: inline-block;
                        "
                        >
                        Reset Password
                        </a>
                    </div>

                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px">
                        This link will expire soon. If you did not request a reset, ignore this message.
                    </p>
                    </td>
                </tr>

                <tr>
                    <td
                    style="
                        padding: 16px;
                        text-align: center;
                        font-size: 12px;
                        color: #9ca3af;
                    "
                    >
                    © ${new Date().getFullYear()} PSMS. All rights reserved.
                    </td>
                </tr>
                </table>
            </td>
            </tr>
        </table>
        </div>
      `,
    });
  }
}

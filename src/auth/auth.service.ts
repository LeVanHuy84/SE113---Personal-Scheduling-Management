import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from './repositories/auth.repository';
import { CreateAuthLoginRequestDto } from './dto/create-auth-login-request.dto';
import { CreateAuthRegisterRequestDto } from './dto/create-auth-register-request.dto';
import {
  JwtPayload,
  ResetJwtPayload,
  VerificationJwtPayload,
} from './interfaces/jwt-payload.interface';
import { EmailService } from '../email/email.service';

type LoginMetadata = {
  ip?: string | null;
  userAgent?: string | null;
};

type LoginResponse = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
};

type ResendVerificationEmailResponse = {
  message: string;
  data: null;
};

type VerifyEmailResponse = {
  message: string;
  data: null;
};

type ForgotPasswordResponse = {
  message: string;
  data: null;
};

type ResetPasswordResponse = {
  message: string;
  data: null;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly accessTokenTtlSeconds: number;
  private readonly verificationTokenTtlSeconds: number;
  private readonly resetTokenTtlSeconds: number;
  private readonly accessSecret: string;
  private readonly verificationSecret: string;
  private readonly resetSecret: string;

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessTokenTtlSeconds = Number(
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN_SECONDS') ?? 3600,
    );
    this.verificationTokenTtlSeconds = Number(
      this.configService.get<string>('JWT_VERIFY_EXPIRES_IN_SECONDS') ?? 86400,
    );
    this.resetTokenTtlSeconds = Number(
      this.configService.get<string>('JWT_RESET_EXPIRES_IN_SECONDS') ?? 900,
    );
    this.accessSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ??
      'psms-access-secret';
    this.verificationSecret =
      this.configService.get<string>('JWT_VERIFY_SECRET') ??
      'psms-verify-secret';
    this.resetSecret =
      this.configService.get<string>('JWT_RESET_SECRET') ?? 'psms-reset-secret';
  }

  async register(dto: CreateAuthRegisterRequestDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);

    try {
      const user = await this.authRepository.createUser({
        email: dto.email,
        passwordHash,
        displayName: dto.displayName,
      });

      const token = await this.generateVerificationToken(user.id);
      void Promise.resolve()
        .then(() =>
          this.emailService.sendVerificationEmail({
            to: user.email,
            token,
            displayName: user.displayName,
          }),
        )
        .catch((error) => {
          this.logger.error('Failed to send verification email', error);
        });

      return {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt.toISOString(),
      };
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        throw new ConflictException('Email already registered');
      }

      throw error;
    }
  }

  async login(
    dto: CreateAuthLoginRequestDto,
    metadata: LoginMetadata = {},
  ): Promise<LoginResponse> {
    const user = await this.authRepository.findUserByEmail(dto.email);

    if (!user) {
      await this.logAuthAttempt({
        email: dto.email,
        result: 'FAILURE',
        reason: 'INVALID_CREDENTIALS',
        ip: metadata.ip,
        userAgent: metadata.userAgent,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isMatch) {
      await this.logAuthAttempt({
        email: dto.email,
        userId: user.id,
        result: 'FAILURE',
        reason: 'INVALID_CREDENTIALS',
        ip: metadata.ip,
        userAgent: metadata.userAgent,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified) {
      await this.logAuthAttempt({
        email: dto.email,
        userId: user.id,
        result: 'FAILURE',
        reason: 'EMAIL_NOT_VERIFIED',
        ip: metadata.ip,
        userAgent: metadata.userAgent,
      });
      throw new ForbiddenException('Email not verified');
    }

    await this.logAuthAttempt({
      email: dto.email,
      userId: user.id,
      result: 'SUCCESS',
      reason: null,
      ip: metadata.ip,
      userAgent: metadata.userAgent,
    });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload, {
        secret: this.accessSecret,
        expiresIn: `${this.accessTokenTtlSeconds}s`,
      }),
      tokenType: 'Bearer',
      expiresIn: this.accessTokenTtlSeconds,
    };
  }

  async verifyEmail(token: string): Promise<VerifyEmailResponse> {
    let payload: VerificationJwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<VerificationJwtPayload>(
        token,
        {
          secret: this.verificationSecret,
        },
      );
    } catch {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (payload.type !== 'verification') {
      throw new BadRequestException('Invalid or expired verification token');
    }

    const user = await this.authRepository.findUserById(payload.sub);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.authRepository.markUserAsVerified(user.id);

    return {
      message: 'Email verified successfully',
      data: null,
    };
  }

  async resendVerificationEmail(
    email: string,
  ): Promise<ResendVerificationEmailResponse> {
    const response: ResendVerificationEmailResponse = {
      message:
        'If the account exists and is not verified, a verification email has been sent',
      data: null,
    };

    const user = await this.authRepository.findUserByEmail(email);
    if (!user || user.isVerified) {
      return response;
    }

    const token = await this.generateVerificationToken(user.id);
    void Promise.resolve()
      .then(() =>
        this.emailService.sendVerificationEmail({
          to: user.email,
          token,
          displayName: user.displayName,
        }),
      )
      .catch((error) => {
        this.logger.error('Failed to resend verification email', error);
      });

    return response;
  }

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const response: ForgotPasswordResponse = {
      message: 'If the account exists, reset instructions sent',
      data: null,
    };

    const user = await this.authRepository.findUserByEmail(email);

    if (!user) {
      return response;
    }

    const resetToken = await this.generateResetToken(user.id);
    const tokenHash = await bcrypt.hash(resetToken, 10);
    const expiresAt = new Date(Date.now() + this.resetTokenTtlSeconds * 1000);

    await this.authRepository.setPasswordResetToken({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    void Promise.resolve()
      .then(() =>
        this.emailService.sendPasswordResetEmail({
          to: user.email,
          token: resetToken,
          displayName: user.displayName,
        }),
      )
      .catch((error) => {
        this.logger.error('Failed to send password reset email', error);
      });

    return response;
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<ResetPasswordResponse> {
    let payload: ResetJwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<ResetJwtPayload>(token, {
        secret: this.resetSecret,
      });
    } catch {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (payload.type !== 'reset') {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = await this.authRepository.findUserById(payload.sub);

    if (
      !user ||
      !user.passwordResetTokenHash ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt <= new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const isTokenValid = await bcrypt.compare(
      token,
      user.passwordResetTokenHash,
    );

    if (!isTokenValid) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.authRepository.updatePasswordAndClearResetToken({
      userId: user.id,
      passwordHash,
    });

    return {
      message: 'Password reset successful',
      data: null,
    };
  }

  async generateVerificationToken(userId: string): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: userId,
        type: 'verification',
      },
      {
        secret: this.verificationSecret,
        expiresIn: `${this.verificationTokenTtlSeconds}s`,
      },
    );
  }

  async generateResetToken(userId: string): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: userId,
        type: 'reset',
      },
      {
        secret: this.resetSecret,
        expiresIn: `${this.resetTokenTtlSeconds}s`,
      },
    );
  }

  private async logAuthAttempt(input: {
    email: string;
    userId?: string;
    result: 'SUCCESS' | 'FAILURE';
    reason: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    await this.authRepository.logAuthAttempt({
      email: input.email,
      userId: input.userId,
      result: input.result,
      reason: input.reason,
      ip: input.ip,
      userAgent: input.userAgent,
    });
  }
}

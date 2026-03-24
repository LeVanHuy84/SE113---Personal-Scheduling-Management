import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
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
  VerificationJwtPayload,
} from './interfaces/jwt-payload.interface';

type LoginMetadata = {
  ip?: string | null;
  userAgent?: string | null;
};

type LoginResponse = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
};

@Injectable()
export class AuthService {
  private readonly accessTokenTtlSeconds: number;
  private readonly verificationTokenTtlSeconds: number;
  private readonly accessSecret: string;
  private readonly verificationSecret: string;

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessTokenTtlSeconds = Number(
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN_SECONDS') ?? 3600,
    );
    this.verificationTokenTtlSeconds = Number(
      this.configService.get<string>('JWT_VERIFY_EXPIRES_IN_SECONDS') ?? 86400,
    );
    this.accessSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ??
      'psms-access-secret';
    this.verificationSecret =
      this.configService.get<string>('JWT_VERIFY_SECRET') ??
      'psms-verify-secret';
  }

  async register(dto: CreateAuthRegisterRequestDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);

    try {
      const user = await this.authRepository.createUser({
        email: dto.email,
        passwordHash,
        displayName: dto.displayName,
      });

      await this.generateVerificationToken(user.id);

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

  async verifyEmail(
    token: string,
  ): Promise<{ success: true; message: string }> {
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
      success: true,
      message: 'Email verified successfully',
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

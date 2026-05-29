import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthRepository } from './repositories/auth.repository';
import { EmailService } from '../email/email.service';
import { RedisService } from '../common/redis/redis.service';

describe('AuthService', () => {
  let service: AuthService;
  let authRepository: jest.Mocked<AuthRepository>;
  let emailService: jest.Mocked<EmailService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let redisService: jest.Mocked<RedisService>;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    authRepository = {
      createUser: jest.fn(),
      findUserByEmail: jest.fn(),
      findUserById: jest.fn(),
      markUserAsVerified: jest.fn(),
      setPasswordResetToken: jest.fn(),
      updatePasswordAndClearResetToken: jest.fn(),
      logAuthAttempt: jest.fn(),
    } as unknown as jest.Mocked<AuthRepository>;

    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    emailService = {
      sendVerificationEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
    } as unknown as jest.Mocked<EmailService>;
    emailService.sendVerificationEmail.mockResolvedValue(undefined);
    emailService.sendPasswordResetEmail.mockResolvedValue(undefined);

    configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          JWT_ACCESS_SECRET: 'access-secret',
          JWT_REFRESH_SECRET: 'refresh-secret',
          JWT_VERIFY_SECRET: 'verify-secret',
          JWT_RESET_SECRET: 'reset-secret',
          JWT_ACCESS_EXPIRES_IN_SECONDS: '3600',
          JWT_REFRESH_EXPIRES_IN_SECONDS: '604800',
          JWT_VERIFY_EXPIRES_IN_SECONDS: '86400',
          JWT_RESET_EXPIRES_IN_SECONDS: '900',
        };

        return values[key];
      }),
    } as unknown as jest.Mocked<ConfigService>;

    redisService = {
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      ttl: jest.fn(),
      getClient: jest.fn(),
      onModuleDestroy: jest.fn(),
    } as unknown as jest.Mocked<RedisService>;

    service = new AuthService(
      authRepository,
      emailService,
      jwtService,
      configService,
      redisService,
    );

    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('registers user successfully with hashed password', async () => {
    authRepository.createUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
      createdAt: new Date('2026-03-24T10:00:00.000Z'),
      passwordHash: 'hashed',
      isVerified: false,
    } as never);
    (jwtService.signAsync as jest.Mock).mockResolvedValue('verify-token');

    const result = await service.register({
      email: 'test@example.com',
      password: 'ValidPass123',
      displayName: 'Test User',
    });

    expect(authRepository.createUser).toHaveBeenCalledTimes(1);
    const createPayload = authRepository.createUser.mock.calls[0][0];
    expect(createPayload.email).toBe('test@example.com');
    expect(createPayload.displayName).toBe('Test User');
    expect(createPayload.passwordHash).not.toBe('ValidPass123');
    expect(
      await bcrypt.compare('ValidPass123', createPayload.passwordHash),
    ).toBe(true);

    expect(result).toEqual({
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
      createdAt: '2026-03-24T10:00:00.000Z',
    });
    expect(emailService.sendVerificationEmail).toHaveBeenCalledWith({
      to: 'test@example.com',
      token: 'verify-token',
      displayName: 'Test User',
    });
  });

  it('does not fail registration when sending verification email fails', async () => {
    authRepository.createUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
      createdAt: new Date('2026-03-24T10:00:00.000Z'),
      passwordHash: 'hashed',
      isVerified: false,
    } as never);
    (jwtService.signAsync as jest.Mock).mockResolvedValue('verify-token');
    emailService.sendVerificationEmail.mockRejectedValue(
      new Error('smtp down'),
    );

    await expect(
      service.register({
        email: 'test@example.com',
        password: 'ValidPass123',
        displayName: 'Test User',
      }),
    ).resolves.toEqual({
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
      createdAt: '2026-03-24T10:00:00.000Z',
    });
  });

  it('throws conflict on duplicate email during registration', async () => {
    const duplicateError = new Error('duplicate') as Error & { code: string };
    duplicateError.code = 'P2002';
    authRepository.createUser.mockRejectedValue(duplicateError);

    await expect(
      service.register({
        email: 'dup@example.com',
        password: 'ValidPass123',
        displayName: 'Dup User',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('verifies email with valid token', async () => {
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 'user-1',
      type: 'verification',
    });
    authRepository.findUserById.mockResolvedValue({
      id: 'user-1',
      isVerified: false,
    } as never);
    authRepository.markUserAsVerified.mockResolvedValue({
      id: 'user-1',
      isVerified: true,
    } as never);

    const result = await service.verifyEmail('valid-token');

    expect(authRepository.markUserAsVerified).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({
      message: 'Email verified successfully',
      data: null,
    });
  });

  it('rejects invalid or expired verification token', async () => {
    (jwtService.verifyAsync as jest.Mock).mockRejectedValue(
      new Error('expired'),
    );

    await expect(service.verifyEmail('expired-token')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects already used verification token', async () => {
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 'user-1',
      type: 'verification',
    });
    authRepository.findUserById.mockResolvedValue({
      id: 'user-1',
      isVerified: true,
    } as never);

    await expect(service.verifyEmail('used-token')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws not found when token references missing user', async () => {
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 'missing-user',
      type: 'verification',
    });
    authRepository.findUserById.mockResolvedValue(null);

    await expect(service.verifyEmail('valid-token')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('logs failure and throws unauthorized for wrong password', async () => {
    const passwordHash = await bcrypt.hash('CorrectPass123', 10);
    authRepository.findUserByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      passwordHash,
      isVerified: true,
    } as never);

    await expect(
      service.login({ email: 'user@example.com', password: 'WrongPass123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(authRepository.logAuthAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com',
        userId: 'user-1',
        result: 'FAILURE',
        reason: 'INVALID_CREDENTIALS',
      }),
    );
  });

  it('throws forbidden for unverified user login', async () => {
    const passwordHash = await bcrypt.hash('ValidPass123', 10);
    authRepository.findUserByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      passwordHash,
      isVerified: false,
    } as never);

    await expect(
      service.login({ email: 'user@example.com', password: 'ValidPass123' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns access token for verified user login', async () => {
    const passwordHash = await bcrypt.hash('ValidPass123', 10);
    authRepository.findUserByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      passwordHash,
      isVerified: true,
    } as never);
    (jwtService.signAsync as jest.Mock)
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    const result = await service.login(
      { email: 'user@example.com', password: 'ValidPass123' },
      { ip: '127.0.0.1', userAgent: 'jest' },
    );

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
    });
    expect(authRepository.logAuthAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com',
        userId: 'user-1',
        result: 'SUCCESS',
      }),
    );
  });

  it('resends verification email for existing unverified user', async () => {
    authRepository.findUserByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'verify@example.com',
      displayName: 'Verify User',
      isVerified: false,
    } as never);
    (jwtService.signAsync as jest.Mock).mockResolvedValue('verify-token');

    const result = await service.resendVerificationEmail('verify@example.com');

    expect(result).toEqual({
      message:
        'If the account exists and is not verified, a verification email has been sent',
      data: null,
    });
    expect(authRepository.findUserByEmail).toHaveBeenCalledWith(
      'verify@example.com',
    );
    expect(emailService.sendVerificationEmail).toHaveBeenCalledWith({
      to: 'verify@example.com',
      token: 'verify-token',
      displayName: 'Verify User',
    });
  });

  it('returns generic success and does not send email for verified user', async () => {
    authRepository.findUserByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'verified@example.com',
      displayName: 'Verified User',
      isVerified: true,
    } as never);

    const result = await service.resendVerificationEmail(
      'verified@example.com',
    );

    expect(result).toEqual({
      message:
        'If the account exists and is not verified, a verification email has been sent',
      data: null,
    });
    expect(jwtService.signAsync).not.toHaveBeenCalled();
    expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('returns generic success and does not send email for unknown account', async () => {
    authRepository.findUserByEmail.mockResolvedValue(null);

    const result = await service.resendVerificationEmail('missing@example.com');

    expect(result).toEqual({
      message:
        'If the account exists and is not verified, a verification email has been sent',
      data: null,
    });
    expect(jwtService.signAsync).not.toHaveBeenCalled();
    expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('does not fail resend when email dispatch fails', async () => {
    authRepository.findUserByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'verify@example.com',
      displayName: 'Verify User',
      isVerified: false,
    } as never);
    (jwtService.signAsync as jest.Mock).mockResolvedValue('verify-token');
    emailService.sendVerificationEmail.mockRejectedValue(
      new Error('smtp down'),
    );

    await expect(
      service.resendVerificationEmail('verify@example.com'),
    ).resolves.toEqual({
      data: null,
      message:
        'If the account exists and is not verified, a verification email has been sent',
    });
  });

  it('forgot password returns generic response for unknown account', async () => {
    authRepository.findUserByEmail.mockResolvedValue(null);

    const result = await service.forgotPassword('missing@example.com');

    expect(result).toEqual({
      data: null,
      message: 'If the account exists, reset instructions sent',
    });
    expect(authRepository.setPasswordResetToken).not.toHaveBeenCalled();
    expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('forgot password stores token hash and sends email for existing account', async () => {
    authRepository.findUserByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
    } as never);
    (jwtService.signAsync as jest.Mock).mockResolvedValue('reset-token');

    const result = await service.forgotPassword('test@example.com');

    expect(result).toEqual({
      data: null,
      message: 'If the account exists, reset instructions sent',
    });
    expect(authRepository.setPasswordResetToken).toHaveBeenCalledTimes(1);
    const setTokenCall = authRepository.setPasswordResetToken.mock.calls[0][0];
    expect(setTokenCall.userId).toBe('user-1');
    expect(setTokenCall.expiresAt).toBeInstanceOf(Date);
    expect(setTokenCall.tokenHash).not.toBe('reset-token');
    expect(await bcrypt.compare('reset-token', setTokenCall.tokenHash)).toBe(
      true,
    );
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith({
      to: 'test@example.com',
      token: 'reset-token',
      displayName: 'Test User',
    });
  });

  it('resets password with valid reset token and invalidates token', async () => {
    const storedTokenHash = await bcrypt.hash('valid-reset-token', 10);
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 'user-1',
      type: 'reset',
    });
    authRepository.findUserById.mockResolvedValue({
      id: 'user-1',
      passwordResetTokenHash: storedTokenHash,
      passwordResetExpiresAt: new Date(Date.now() + 60_000),
    } as never);

    const result = await service.resetPassword(
      'valid-reset-token',
      'NewValidPass123',
    );

    expect(result).toEqual({
      data: null,
      message: 'Password reset successful',
    });
    expect(
      authRepository.updatePasswordAndClearResetToken,
    ).toHaveBeenCalledTimes(1);
    const updateCall =
      authRepository.updatePasswordAndClearResetToken.mock.calls[0][0];
    expect(updateCall.userId).toBe('user-1');
    expect(updateCall.passwordHash).not.toBe('NewValidPass123');
    expect(
      await bcrypt.compare('NewValidPass123', updateCall.passwordHash),
    ).toBe(true);
  });

  it('rejects reset when token is invalid or expired', async () => {
    (jwtService.verifyAsync as jest.Mock).mockRejectedValue(new Error('bad'));

    await expect(
      service.resetPassword('invalid-reset-token', 'NewValidPass123'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects reset when token already used', async () => {
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 'user-1',
      type: 'reset',
    });
    authRepository.findUserById.mockResolvedValue({
      id: 'user-1',
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    } as never);

    await expect(
      service.resetPassword('used-reset-token', 'NewValidPass123'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refresh success returns rotated tokens', async () => {
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 'user-1',
      type: 'refresh',
      jti: 'old-jti',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    redisService.get.mockResolvedValue(null);
    authRepository.findUserById.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
    } as never);
    (jwtService.signAsync as jest.Mock)
      .mockResolvedValueOnce('new-access-token')
      .mockResolvedValueOnce('new-refresh-token');

    const result = await service.refreshToken('valid-refresh-token');

    expect(redisService.get).toHaveBeenCalledWith('blacklist:old-jti');
    expect(redisService.setex).toHaveBeenCalledWith(
      'blacklist:old-jti',
      expect.any(Number),
      '1',
    );
    expect(result).toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
    });
  });

  it('refresh with revoked token throws unauthorized', async () => {
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 'user-1',
      type: 'refresh',
      jti: 'revoked-jti',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    redisService.get.mockResolvedValue('1');

    await expect(
      service.refreshToken('revoked-refresh-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(redisService.setex).not.toHaveBeenCalled();
  });

  it('rotation invalidates old token jti', async () => {
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 'user-1',
      type: 'refresh',
      jti: 'rotate-jti',
      exp: Math.floor(Date.now() / 1000) + 600,
    });
    redisService.get.mockResolvedValue(null);
    authRepository.findUserById.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
    } as never);
    (jwtService.signAsync as jest.Mock)
      .mockResolvedValueOnce('access-token-2')
      .mockResolvedValueOnce('refresh-token-2');

    await service.refreshToken('token-to-rotate');

    expect(redisService.setex).toHaveBeenCalledWith(
      'blacklist:rotate-jti',
      expect.any(Number),
      '1',
    );
  });

  it('logout revokes provided refresh token', async () => {
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 'user-1',
      type: 'refresh',
      jti: 'logout-jti',
      exp: Math.floor(Date.now() / 1000) + 1200,
    });

    const result = await service.logout('logout-refresh-token');

    expect(redisService.setex).toHaveBeenCalledWith(
      'blacklist:logout-jti',
      expect.any(Number),
      '1',
    );
    expect(result).toEqual({
      success: true,
      message: 'Logged out successfully',
    });
  });
});

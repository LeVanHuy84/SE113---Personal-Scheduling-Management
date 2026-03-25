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

describe('AuthService', () => {
  let service: AuthService;
  let authRepository: jest.Mocked<AuthRepository>;
  let emailService: jest.Mocked<EmailService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    authRepository = {
      createUser: jest.fn(),
      findUserByEmail: jest.fn(),
      findUserById: jest.fn(),
      markUserAsVerified: jest.fn(),
      logAuthAttempt: jest.fn(),
    } as unknown as jest.Mocked<AuthRepository>;

    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    emailService = {
      sendVerificationEmail: jest.fn(),
    } as unknown as jest.Mocked<EmailService>;
    emailService.sendVerificationEmail.mockResolvedValue(undefined);

    configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          JWT_ACCESS_SECRET: 'access-secret',
          JWT_VERIFY_SECRET: 'verify-secret',
          JWT_ACCESS_EXPIRES_IN_SECONDS: '3600',
          JWT_VERIFY_EXPIRES_IN_SECONDS: '86400',
        };

        return values[key];
      }),
    } as unknown as jest.Mocked<ConfigService>;

    service = new AuthService(
      authRepository,
      emailService,
      jwtService,
      configService,
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
    (jwtService.signAsync as jest.Mock).mockResolvedValue('access-token');

    const result = await service.login(
      { email: 'user@example.com', password: 'ValidPass123' },
      { ip: '127.0.0.1', userAgent: 'jest' },
    );

    expect(result).toEqual({
      accessToken: 'access-token',
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
});

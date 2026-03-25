import { Controller, Get, INestApplication, UseGuards } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { setupApplication } from '../common/setup-app';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import type { CurrentUserPrincipal } from './interfaces/current-user.interface';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth-test')
class AuthTestController {
  @Get('protected')
  @UseGuards(JwtAuthGuard)
  protectedRoute(@CurrentUser() user: CurrentUserPrincipal) {
    return {
      userId: user.userId,
      email: user.email,
    };
  }
}

type MockUser = {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  isVerified: boolean;
  createdAt: Date;
};

describe('AuthController (integration)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let jwtService: JwtService;

  const usersById = new Map<string, MockUser>();
  const usersByEmail = new Map<string, MockUser>();
  const authAttempts: Array<Record<string, unknown>> = [];
  const emailServiceMock = {
    sendVerificationEmail: jest.fn(),
  };

  const prismaMock = {
    user: {
      create: jest.fn(async ({ data }) => {
        if (usersByEmail.has(data.email)) {
          const error = new Error('duplicate email') as Error & {
            code: string;
          };
          error.code = 'P2002';
          throw error;
        }

        const user: MockUser = {
          id: `user-${usersById.size + 1}`,
          email: data.email,
          passwordHash: data.passwordHash,
          displayName: data.displayName,
          isVerified: data.isVerified,
          createdAt: new Date('2026-03-24T10:00:00.000Z'),
        };

        usersById.set(user.id, user);
        usersByEmail.set(user.email, user);

        return user;
      }),
      findUnique: jest.fn(async ({ where }) => {
        if (where.email) {
          return usersByEmail.get(where.email) ?? null;
        }

        if (where.id) {
          return usersById.get(where.id) ?? null;
        }

        return null;
      }),
      update: jest.fn(async ({ where, data }) => {
        const user = usersById.get(where.id);
        if (!user) {
          throw new Error('User not found');
        }

        const updated = {
          ...user,
          ...data,
        };

        usersById.set(where.id, updated);
        usersByEmail.set(updated.email, updated);

        return updated;
      }),
    },
    authAttempt: {
      create: jest.fn(async ({ data }) => {
        authAttempts.push(data);
        return { id: `attempt-${authAttempts.length}`, ...data };
      }),
    },
  };

  beforeEach(() => {
    usersById.clear();
    usersByEmail.clear();
    authAttempts.length = 0;
    emailServiceMock.sendVerificationEmail.mockReset();
    jest.clearAllMocks();
  });

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_VERIFY_SECRET = 'test-verify-secret';
    process.env.JWT_ACCESS_EXPIRES_IN_SECONDS = '3600';
    process.env.JWT_VERIFY_EXPIRES_IN_SECONDS = '86400';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
        }),
        AuthModule,
      ],
      controllers: [AuthTestController],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(EmailService)
      .useValue(emailServiceMock)
      .compile();

    authService = moduleFixture.get(AuthService);
    jwtService = moduleFixture.get(JwtService);

    app = moduleFixture.createNestApplication();
    await setupApplication(app, { connectDatabase: false });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers successfully with unique email', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'ValidPass123',
        displayName: 'Test User',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual({
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
      createdAt: '2026-03-24T10:00:00.000Z',
    });

    const created = usersByEmail.get('test@example.com');
    expect(created).toBeDefined();
    expect(created?.passwordHash).not.toBe('ValidPass123');
    expect(await bcrypt.compare('ValidPass123', created!.passwordHash)).toBe(
      true,
    );
    expect(created?.isVerified).toBe(false);
  });

  it('returns 409 for duplicate email registration', async () => {
    await request(app.getHttpServer()).post('/auth/register').send({
      email: 'dup@example.com',
      password: 'ValidPass123',
      displayName: 'User One',
    });

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'dup@example.com',
        password: 'ValidPass123',
        displayName: 'User Two',
      })
      .expect(409);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Email already registered');
    expect(usersByEmail.size).toBe(1);
  });

  it('logs in verified user and returns JWT token', async () => {
    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'login@example.com',
        password: 'ValidPass123',
        displayName: 'Login User',
      })
      .expect(201);

    const verifyToken = await authService.generateVerificationToken(
      register.body.data.id,
    );

    await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token: verifyToken })
      .expect(200);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'login@example.com',
        password: 'ValidPass123',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.tokenType).toBe('Bearer');
    expect(response.body.data.expiresIn).toBe(3600);
    expect(typeof response.body.data.accessToken).toBe('string');

    const payload = await jwtService.verifyAsync(
      response.body.data.accessToken,
      {
        secret: process.env.JWT_ACCESS_SECRET,
      },
    );
    expect(payload.sub).toBe(register.body.data.id);
    expect(payload.email).toBe('login@example.com');
  });

  it('returns 401 for wrong password', async () => {
    const hashed = await bcrypt.hash('CorrectPass123', 10);
    const user: MockUser = {
      id: 'user-wrong-pass',
      email: 'wrong-pass@example.com',
      passwordHash: hashed,
      displayName: 'Wrong Pass',
      isVerified: true,
      createdAt: new Date('2026-03-24T10:00:00.000Z'),
    };
    usersById.set(user.id, user);
    usersByEmail.set(user.email, user);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: user.email,
        password: 'InvalidPass123',
      })
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Invalid credentials');
  });

  it('returns 403 for unverified user login', async () => {
    await request(app.getHttpServer()).post('/auth/register').send({
      email: 'unverified@example.com',
      password: 'ValidPass123',
      displayName: 'Unverified User',
    });

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'unverified@example.com',
        password: 'ValidPass123',
      })
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Email not verified');
  });

  it('verifies email successfully with valid token', async () => {
    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'verify@example.com',
        password: 'ValidPass123',
        displayName: 'Verify User',
      })
      .expect(201);

    const token = await authService.generateVerificationToken(
      register.body.data.id,
    );

    const response = await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Email verified successfully');
    expect(response.body.data).toBeNull();
    expect(usersById.get(register.body.data.id)?.isVerified).toBe(true);
  });

  it('returns 400 for invalid verification token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token: 'invalid-token' })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain(
      'Invalid or expired verification token',
    );
  });

  it('returns 400 for already used verification token', async () => {
    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'used-token@example.com',
        password: 'ValidPass123',
        displayName: 'Used Token User',
      })
      .expect(201);

    const token = await authService.generateVerificationToken(
      register.body.data.id,
    );

    await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token })
      .expect(200);

    const secondAttempt = await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token })
      .expect(400);

    expect(secondAttempt.body.success).toBe(false);
    expect(secondAttempt.body.message).toContain(
      'Invalid or expired verification token',
    );
  });

  it('resends verification email for unverified account', async () => {
    await request(app.getHttpServer()).post('/auth/register').send({
      email: 'resend@example.com',
      password: 'ValidPass123',
      displayName: 'Resend User',
    });

    const response = await request(app.getHttpServer())
      .post('/auth/resend-verification-email')
      .send({ email: 'resend@example.com' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      'If the account exists and is not verified, a verification email has been sent',
    );
    expect(response.body.data).toBeNull();

    await new Promise((resolve) => setImmediate(resolve));
    expect(emailServiceMock.sendVerificationEmail).toHaveBeenCalledTimes(2);
    expect(emailServiceMock.sendVerificationEmail).toHaveBeenLastCalledWith(
      expect.objectContaining({
        to: 'resend@example.com',
        displayName: 'Resend User',
      }),
    );
  });

  it('returns generic success for verified account without sending new email', async () => {
    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'resend-verified@example.com',
        password: 'ValidPass123',
        displayName: 'Resend Verified User',
      })
      .expect(201);

    const token = await authService.generateVerificationToken(
      register.body.data.id,
    );
    await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token })
      .expect(200);

    const callsBefore =
      emailServiceMock.sendVerificationEmail.mock.calls.length;

    const response = await request(app.getHttpServer())
      .post('/auth/resend-verification-email')
      .send({ email: 'resend-verified@example.com' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      'If the account exists and is not verified, a verification email has been sent',
    );
    expect(response.body.data).toBeNull();

    await new Promise((resolve) => setImmediate(resolve));
    expect(emailServiceMock.sendVerificationEmail).toHaveBeenCalledTimes(
      callsBefore,
    );
  });

  it('returns generic success for unknown account', async () => {
    const callsBefore =
      emailServiceMock.sendVerificationEmail.mock.calls.length;

    const response = await request(app.getHttpServer())
      .post('/auth/resend-verification-email')
      .send({ email: 'missing-account@example.com' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      'If the account exists and is not verified, a verification email has been sent',
    );
    expect(response.body.data).toBeNull();

    await new Promise((resolve) => setImmediate(resolve));
    expect(emailServiceMock.sendVerificationEmail).toHaveBeenCalledTimes(
      callsBefore,
    );
  });

  it('returns 400 for invalid resend payload', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/resend-verification-email')
      .send({ email: 'invalid-email' })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('email must be an email');
  });

  it('protects route with JWT guard and extracts current user', async () => {
    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'protected@example.com',
        password: 'ValidPass123',
        displayName: 'Protected User',
      })
      .expect(201);

    const token = await authService.generateVerificationToken(
      register.body.data.id,
    );

    await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token })
      .expect(200);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'protected@example.com',
        password: 'ValidPass123',
      })
      .expect(200);

    const protectedResponse = await request(app.getHttpServer())
      .get('/auth-test/protected')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`)
      .expect(200);

    expect(protectedResponse.body.success).toBe(true);
    expect(protectedResponse.body.data).toEqual({
      userId: register.body.data.id,
      email: 'protected@example.com',
    });

    await request(app.getHttpServer())
      .get('/auth-test/protected')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);

    await request(app.getHttpServer()).get('/auth-test/protected').expect(401);
  });
});

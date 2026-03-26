import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { setupApplication } from '../common/setup-app';
import { RedisService } from '../common/redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserModule } from './user.module';

type MockUser = {
  id: string;
  email: string;
  displayName: string | null;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
};

type PrismaErrorLike = Error & {
  code?: string;
};

describe('UserController (integration)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const usersById = new Map<string, MockUser>();
  let updateSequence = 0;

  const profileView = (user: MockUser) => ({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    timezone: user.timezone,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });

  const prismaMock = {
    user: {
      findUnique: jest.fn(async ({ where }: { where: { id?: string } }) => {
        const userId = where.id;
        if (!userId) {
          return null;
        }

        const user = usersById.get(userId);
        return user ? profileView(user) : null;
      }),
      update: jest.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: { displayName?: string; timezone?: string };
        }) => {
          const existing = usersById.get(where.id);
          if (!existing) {
            const notFoundError = new Error('Record to update not found');
            (notFoundError as PrismaErrorLike).code = 'P2025';
            throw notFoundError;
          }

          updateSequence += 1;
          const updated: MockUser = {
            ...existing,
            ...(data.displayName !== undefined
              ? { displayName: data.displayName }
              : {}),
            ...(data.timezone !== undefined ? { timezone: data.timezone } : {}),
            updatedAt: new Date(
              Date.parse('2026-03-25T10:00:00.000Z') + updateSequence * 1000,
            ),
          };

          usersById.set(updated.id, updated);
          return profileView(updated);
        },
      ),
    },
  };

  const redisServiceMock = {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    ttl: jest.fn(),
    getClient: jest.fn(),
    onModuleDestroy: jest.fn(),
  };

  const seedUser = (overrides: Partial<MockUser> = {}): MockUser => {
    const user: MockUser = {
      id: overrides.id ?? 'user-1',
      email: overrides.email ?? 'profile@example.com',
      displayName: overrides.displayName ?? 'Initial Name',
      timezone: overrides.timezone ?? 'UTC',
      createdAt: overrides.createdAt ?? new Date('2026-03-24T10:00:00.000Z'),
      updatedAt: overrides.updatedAt ?? new Date('2026-03-24T10:00:00.000Z'),
    };

    usersById.set(user.id, user);
    return user;
  };

  const signAccessToken = async (user: {
    userId: string;
    email: string;
  }): Promise<string> => {
    return jwtService.signAsync({
      sub: user.userId,
      email: user.email,
    });
  };

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_ACCESS_EXPIRES_IN_SECONDS = '3600';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
        }),
        UserModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(RedisService)
      .useValue(redisServiceMock)
      .compile();

    jwtService = moduleFixture.get(JwtService);

    app = moduleFixture.createNestApplication();
    await setupApplication(app, { connectDatabase: false });
    await app.init();
  });

  beforeEach(() => {
    usersById.clear();
    updateSequence = 0;
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('USER-01: returns current profile for authenticated user', async () => {
    const user = seedUser();
    const accessToken = await signAccessToken({
      userId: user.id,
      email: user.email,
    });

    const response = await request(app.getHttpServer())
      .get('/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        timezone: user.timezone,
        createdAt: user.createdAt.toISOString(),
      }),
    );
  });

  it('USER-02: returns 401 when JWT is missing or invalid', async () => {
    await request(app.getHttpServer()).get('/profile').expect(401);

    await request(app.getHttpServer())
      .get('/profile')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  it('USER-03: updates profile successfully with valid data', async () => {
    const user = seedUser();
    const accessToken = await signAccessToken({
      userId: user.id,
      email: user.email,
    });

    const response = await request(app.getHttpServer())
      .put('/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ displayName: 'New Name', timezone: 'Asia/Ho_Chi_Minh' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        id: user.id,
        email: user.email,
        displayName: 'New Name',
        timezone: 'Asia/Ho_Chi_Minh',
      }),
    );
    expect(response.body.data.updatedAt).toBeDefined();

    const updated = usersById.get(user.id);
    expect(updated?.displayName).toBe('New Name');
    expect(updated?.timezone).toBe('Asia/Ho_Chi_Minh');
  });

  it('USER-04: applies partial update and keeps other fields unchanged', async () => {
    const user = seedUser({
      displayName: 'Before Update',
      email: 'same-email@example.com',
      timezone: 'UTC',
    });
    const accessToken = await signAccessToken({
      userId: user.id,
      email: user.email,
    });

    await request(app.getHttpServer())
      .put('/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ timezone: 'Asia/Tokyo' })
      .expect(200);

    const updated = usersById.get(user.id);
    expect(updated?.displayName).toBe('Before Update');
    expect(updated?.timezone).toBe('Asia/Tokyo');
    expect(updated?.email).toBe('same-email@example.com');
    expect(updated?.createdAt.toISOString()).toBe('2026-03-24T10:00:00.000Z');
  });

  it('USER-05: returns 400 for invalid update payload and does not update data', async () => {
    const user = seedUser({ displayName: 'Still Valid' });
    const accessToken = await signAccessToken({
      userId: user.id,
      email: user.email,
    });

    const response = await request(app.getHttpServer())
      .put('/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ displayName: '' })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('displayName');

    const unchanged = usersById.get(user.id);
    expect(unchanged?.displayName).toBe('Still Valid');
  });

  it('returns 400 for invalid timezone and does not update data', async () => {
    const user = seedUser({ displayName: 'Still Valid', timezone: 'UTC' });
    const accessToken = await signAccessToken({
      userId: user.id,
      email: user.email,
    });

    const response = await request(app.getHttpServer())
      .put('/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ timezone: 'invalid timezone' })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('timezone');

    const unchanged = usersById.get(user.id);
    expect(unchanged?.timezone).toBe('UTC');
  });

  it('USER-06: returns 404 when authenticated user no longer exists', async () => {
    const accessToken = await signAccessToken({
      userId: 'deleted-user-id',
      email: 'deleted@example.com',
    });

    const response = await request(app.getHttpServer())
      .put('/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ displayName: 'New Name' })
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('User not found');
  });
});

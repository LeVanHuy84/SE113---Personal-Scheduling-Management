import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../../src/app.module';

describe('Auth - Logout (E2E | Equivalence Partitioning)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ===============================
  // TC-LOGOUT-EP-01
  // ===============================
  it('TC-LOGOUT-EP-01: user đã login → logout success', async () => {
    const email = `logout${Date.now()}@gmail.com`;

    // 1. register
    await request(app.getHttpServer()).post('/auth/register').send({
      email,
      password: '12345678',
      displayName: 'Tanh',
    });

    // 2. login
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password: '12345678',
      });

    const refreshToken = loginRes.body.refreshToken;

    // 3. logout
    const res = await request(app.getHttpServer())
      .post('/auth/logout')
      .send({
        refreshToken,
      });

    expect(res.status).toBe(200);
  });

  // ===============================
  // TC-LOGOUT-EP-02
  // ===============================
  it('TC-LOGOUT-EP-02: user chưa login → Error / Ignore', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/logout')
      .send({
        refreshToken: 'fake-token',
      });

    // tùy design của bạn:
    // 1. nếu silent → 200
    // 2. nếu strict → 401 hoặc 400

    expect([200, 400, 401]).toContain(res.status);
  });
});
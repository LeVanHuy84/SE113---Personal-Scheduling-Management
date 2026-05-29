import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../../src/app.module';

describe('Auth - Login (E2E | Equivalence Partitioning)', () => {
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
  // TC-LOGIN-EP-01
  // ===============================
  it('TC-LOGIN-EP-01: valid email, valid password → Success', async () => {
    const email = `login${Date.now()}@gmail.com`;

    // register trước
    await request(app.getHttpServer()).post('/auth/register').send({
      email,
      password: '12345678',
      displayName: 'Tanh',
    });

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password: '12345678',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  // ===============================
  // TC-LOGIN-EP-02
  // ===============================
  it('TC-LOGIN-EP-02: email không tồn tại → Error', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: `notfound${Date.now()}@gmail.com`,
        password: '12345678',
      });

    expect(res.status).toBe(401); // hoặc 404 tùy bạn design
  });

  // ===============================
  // TC-LOGIN-EP-03
  // ===============================
  it('TC-LOGIN-EP-03: password sai → Error', async () => {
    const email = `wrongpass${Date.now()}@gmail.com`;

    await request(app.getHttpServer()).post('/auth/register').send({
      email,
      password: '12345678',
      displayName: 'Tanh',
    });

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
  });

  // ===============================
  // TC-LOGIN-EP-04
  // ===============================
  it('TC-LOGIN-EP-04: email = "" → Error', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: '',
        password: '12345678',
      });

    expect(res.status).toBe(400);
  });

  // ===============================
  // TC-LOGIN-EP-05
  // ===============================
  it('TC-LOGIN-EP-05: password = "" → Error', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@gmail.com',
        password: '',
      });

    expect(res.status).toBe(400);
  });

  // ===============================
  // TC-LOGIN-EP-06
  // ===============================
  it('TC-LOGIN-EP-06: account chưa verify → Error', async () => {
    const email = `noverify${Date.now()}@gmail.com`;

    // register nhưng KHÔNG verify
    await request(app.getHttpServer()).post('/auth/register').send({
      email,
      password: '12345678',
      displayName: 'Tanh',
    });

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password: '12345678',
      });

    expect(res.status).toBe(403); // hoặc 401 tùy logic bạn
  });
});
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../../src/app.module';

describe('Auth - Register (E2E | Equivalence Partitioning)', () => {
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
  // TC-REG-EP-01
  // ===============================
  it('TC-REG-EP-01: valid email, valid password → Success', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `test${Date.now()}@gmail.com`, // tránh trùng
        password: '12345678',
        displayName: 'Tanh',
      });

    expect(res.status).toBe(201);
  });

  // ===============================
  // TC-REG-EP-02
  // ===============================
  it('TC-REG-EP-02: invalid email format → Error', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'abc',
        password: '12345678',
        displayName: 'Tanh',
      });

    expect(res.status).toBe(400);
  });

  // ===============================
  // TC-REG-EP-03
  // ===============================
  it('TC-REG-EP-03: empty email → Error', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: '',
        password: '12345678',
        displayName: 'Tanh',
      });

    expect(res.status).toBe(400);
  });

  // ===============================
  // TC-REG-EP-04
  // ===============================
  it('TC-REG-EP-04: empty password → Error', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@gmail.com',
        password: '',
        displayName: 'Tanh',
      });

    expect(res.status).toBe(400);
  });

  // ===============================
  // TC-REG-EP-05
  // ===============================
  it('TC-REG-EP-05: password < min → Error', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@gmail.com',
        password: '123',
        displayName: 'Tanh',
      });

    expect(res.status).toBe(400);
  });

  // ===============================
  // TC-REG-EP-06
  // ===============================
  it('TC-REG-EP-06: password = min (boundary) → Success', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `boundary${Date.now()}@gmail.com`,
        password: '12345678', // giả sử min = 8
        displayName: 'Tanh',
      });

    expect(res.status).toBe(201);
  });


  // ===============================
  // TC-REG-EP-07
  // ===============================
  it('TC-REG-EP-07: duplicate email → Error', async () => {
    const email = `dup${Date.now()}@gmail.com`;

    // tạo lần 1
    await request(app.getHttpServer()).post('/auth/register').send({
      email,
      password: '12345678',
      displayName: 'Tanh',
    });

    // tạo lần 2 → phải fail
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password: '12345678',
        displayName: 'Tanh',
      });

    expect(res.status).toBe(409);
  });
});
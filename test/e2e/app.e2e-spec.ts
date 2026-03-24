import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { setupApplication } from '../../src/common/setup-app';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await setupApplication(app, { connectDatabase: false });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET) should return standardized success response', async () => {
    await request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect({
        success: true,
        message: 'PSMS foundation ready',
        data: {
          status: 'ok',
          service: 'psms-api',
        },
      });
  });
});

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaExceptionFilter } from '../src/common/filters/prisma-exception.filter';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  let testEmail: string;
  let testUsername: string;
  let password: string;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    const unique = Date.now();

    testEmail = `e2e-${unique}@example.com`;
    testUsername = `e2e_user_${unique}`;
    password = 'StrongPassword123!';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Keep E2E behavior consistent with the real application
    app.useGlobalFilters(new PrismaExceptionFilter());

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('registers a new user', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: testEmail,
        username: testUsername,
        password,
        name: 'E2E User',
      })
      .expect(201);

    expect(response.body.user.email).toBe(testEmail);
    expect(response.body.user.username).toBe(testUsername);
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it('logs in the registered user', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testEmail,
        password,
      })
      .expect(200);

    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();

    accessToken = response.body.accessToken;
    refreshToken = response.body.refreshToken;
  });

  it('returns the current authenticated user', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.email).toBe(testEmail);
    expect(response.body.username).toBe(testUsername);
  });

  it('refreshes the access token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refreshToken,
      })
      .expect(200);

    expect(response.body.accessToken).toBeDefined();

    accessToken = response.body.accessToken;
  });

  it('logs out the current session', async () => {
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        refreshToken,
      })
      .expect(200);
  });

  it('rejects a revoked refresh token', async () => {
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refreshToken,
      })
      .expect(401);
  });

  it('rejects unauthenticated access to /auth/me', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  afterAll(async () => {
    await app.close();
  });
});

import { vi as jest } from 'vitest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import * as argon2 from 'argon2';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';
import { MailService } from '../../src/mail/mail.service';
import { CloudinaryService } from '../../src/media/cloudinary.service';
import { userPublicSelect } from '../../src/users/user.select';

const query = () => jest.fn<(args: unknown) => Promise<unknown>>();
const taxonomy = () => ({
  create: query(),
  findUnique: query(),
  findMany: query(),
  update: query(),
  delete: query(),
});

// Real application, workflows, JWT guards and DTO validation. Only I/O adapters vary.
describe('Backend contracts with isolated I/O', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let passwordHash: string;
  const safeUser = {
    id: 'user-1',
    email: 'reader@example.com',
    username: 'reader',
    name: 'Reader',
    avatarUrl: null,
    emailVerified: true,
    createdAt: new Date('2020-01-01'),
    updatedAt: new Date('2020-01-01'),
    role: { name: 'USER' },
  };
  const persistence = {
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
    user: {
      findUnique: query(),
      findMany: query(),
      create: query(),
      update: query(),
    },
    role: { findUnique: query() },
    refreshToken: {
      create: query(),
      findMany: query(),
      update: query(),
      updateMany: query(),
    },
    emailVerificationToken: { create: query() },
    category: taxonomy(),
    tag: taxonomy(),
    post: { findFirst: query() },
    comment: { create: query() },
    bookmark: { create: query() },
    postLike: { create: query() },
    media: { findUnique: query() },
  };
  const mail = {
    sendEmailVerification: jest.fn(),
    sendPasswordReset: jest.fn(),
  };
  const cloudinary = { uploadImage: jest.fn(), deleteImage: jest.fn() };
  const settings: Record<string, string> = {
    JWT_ACCESS_SECRET: 'backend-contract-access-secret',
    JWT_ACCESS_EXPIRES_IN: '900',
    JWT_REFRESH_SECRET: 'backend-contract-refresh-secret',
    EMAIL_ENABLED: 'false',
    APP_URL: 'https://example.invalid',
  };

  beforeAll(async () => {
    passwordHash = await argon2.hash('CorrectPassword123!');
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ConfigService)
      .useValue({
        get: (key: string) => settings[key],
        getOrThrow: (key: string) => {
          if (!(key in settings))
            throw new Error(`Unexpected configuration: ${key}`);
          return settings[key];
        },
      })
      .overrideProvider(PrismaService)
      .useValue(persistence)
      .overrideProvider(MailService)
      .useValue(mail)
      .overrideProvider(CloudinaryService)
      .useValue(cloudinary)
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    jwt = module.get(JwtService);
  });
  beforeEach(() => {
    jest.clearAllMocks();
    Object.values(persistence.user).forEach((fn) => fn.mockReset());
    Object.values(persistence.refreshToken).forEach((fn) => fn.mockReset());
    persistence.role.findUnique.mockReset();
    persistence.user.findUnique.mockImplementation(async (args) =>
      (args as { select?: unknown }).select
        ? safeUser
        : { ...safeUser, passwordHash },
    );
    persistence.user.findMany.mockResolvedValue([safeUser]);
    persistence.user.create.mockResolvedValue(safeUser);
    persistence.user.update.mockResolvedValue(safeUser);
    persistence.role.findUnique.mockImplementation(async (args) => ({
      id: 'role-id',
      name: (args as { where: { name: string } }).where.name,
    }));
    persistence.refreshToken.create.mockResolvedValue({ id: 'session-1' });
    persistence.refreshToken.findMany.mockResolvedValue([]);
    persistence.post.findFirst.mockResolvedValue(null);
    persistence.media.findUnique.mockResolvedValue(null);
    for (const delegate of [persistence.category, persistence.tag]) {
      Object.values(delegate).forEach((fn) => fn.mockReset());
      delegate.findUnique.mockResolvedValue({
        id: 'term-1',
        name: 'Old Name',
        slug: 'old-name',
      });
      delegate.findMany.mockResolvedValue([]);
      delegate.create.mockImplementation(async (args) => ({
        id: 'term-1',
        ...(args as { data: object }).data,
      }));
      delegate.update.mockImplementation(async (args) => ({
        id: 'term-1',
        ...(args as { data: object }).data,
      }));
    }
  });
  afterAll(async () => {
    await app?.close();
  });
  const auth = (role = 'ADMIN') =>
    jwt.sign({ sub: 'user-1', email: safeUser.email, role });

  it('boots the real application without connecting to database or remote providers', async () => {
    await request(app.getHttpServer()).get('/health').expect(200);
    expect(mail.sendEmailVerification).not.toHaveBeenCalled();
    expect(cloudinary.uploadImage).not.toHaveBeenCalled();
  });

  describe.each(['categories', 'tags'] as const)('%s', (route) => {
    const delegate = () =>
      route === 'categories' ? persistence.category : persistence.tag;
    it('allows public ordered listing', async () => {
      await request(app.getHttpServer())
        .get(`/${route}`)
        .expect(200)
        .expect([]);
      expect(delegate().findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
    });
    it('requires admin rights for writes', async () => {
      await request(app.getHttpServer())
        .post(`/${route}`)
        .send({ name: 'Hello' })
        .expect(401);
      await request(app.getHttpServer())
        .post(`/${route}`)
        .auth(auth('AUTHOR'), { type: 'bearer' })
        .send({ name: 'Hello' })
        .expect(403);
      expect(delegate().create).not.toHaveBeenCalled();
    });
    it('validates input before persistence', async () => {
      await request(app.getHttpServer())
        .post(`/${route}`)
        .auth(auth(), { type: 'bearer' })
        .send({ name: 42 })
        .expect(400);
      expect(delegate().create).not.toHaveBeenCalled();
    });
    it('creates a normalized slug and regenerates it on rename', async () => {
      await request(app.getHttpServer())
        .post(`/${route}`)
        .auth(auth(), { type: 'bearer' })
        .send({ name: 'New Name!' })
        .expect(201);
      expect(delegate().create).toHaveBeenCalledWith({
        data: { name: 'New Name!', slug: 'new-name' },
      });
      await request(app.getHttpServer())
        .patch(`/${route}/term-1`)
        .auth(auth(), { type: 'bearer' })
        .send({ name: 'Renamed Term' })
        .expect(200);
      expect(delegate().update).toHaveBeenCalledWith({
        where: { id: 'term-1' },
        data: { name: 'Renamed Term', slug: 'renamed-term' },
      });
    });
    it.each(['patch', 'delete'] as const)(
      'returns 404 for missing %s target before writing',
      async (method) => {
        delegate().findUnique.mockResolvedValue(null);
        const call = request(app.getHttpServer())
          [method](`/${route}/missing`)
          .auth(auth(), { type: 'bearer' });
        if (method === 'patch') call.send({ name: 'Updated' });
        await call.expect(404);
        expect(delegate().update).not.toHaveBeenCalled();
        expect(delegate().delete).not.toHaveBeenCalled();
      },
    );
    it('deletes an existing term', async () => {
      await request(app.getHttpServer())
        .delete(`/${route}/term-1`)
        .auth(auth(), { type: 'bearer' })
        .expect(200);
      expect(delegate().delete).toHaveBeenCalledWith({
        where: { id: 'term-1' },
      });
    });
  });

  describe('Users and Roles', () => {
    it('keeps user administration private', async () => {
      await request(app.getHttpServer()).get('/admin/users').expect(401);
      await request(app.getHttpServer())
        .get('/admin/users')
        .auth(auth('USER'), { type: 'bearer' })
        .expect(403);
      expect(persistence.user.findMany).not.toHaveBeenCalled();
    });
    it('uses safe projections for user listing and detail', async () => {
      const list = await request(app.getHttpServer())
        .get('/admin/users')
        .auth(auth(), { type: 'bearer' })
        .expect(200);
      const detail = await request(app.getHttpServer())
        .get('/admin/users/user-1')
        .auth(auth(), { type: 'bearer' })
        .expect(200);
      expect(list.body[0].passwordHash).toBeUndefined();
      expect(detail.body.passwordHash).toBeUndefined();
      expect(persistence.user.findMany).toHaveBeenCalledWith({
        select: userPublicSelect,
        orderBy: { createdAt: 'desc' },
      });
      expect(persistence.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: userPublicSelect,
      });
      expect(userPublicSelect).not.toHaveProperty('passwordHash');
    });
    it('returns 404 for a missing user', async () => {
      persistence.user.findUnique.mockResolvedValue(null);
      await request(app.getHttpServer())
        .get('/admin/users/missing')
        .auth(auth(), { type: 'bearer' })
        .expect(404);
    });
    it('resolves a seeded role and updates only the role reference', async () => {
      await request(app.getHttpServer())
        .patch('/admin/users/user-1/role')
        .auth(auth(), { type: 'bearer' })
        .send({ role: 'AUTHOR' })
        .expect(200);
      expect(persistence.role.findUnique).toHaveBeenCalledWith({
        where: { name: 'AUTHOR' },
      });
      expect(persistence.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { roleId: 'role-id' },
        select: userPublicSelect,
      });
    });
    it('does not resolve roles or write for a missing user', async () => {
      persistence.user.findUnique.mockResolvedValue(null);
      await request(app.getHttpServer())
        .patch('/admin/users/missing/role')
        .auth(auth(), { type: 'bearer' })
        .send({ role: 'AUTHOR' })
        .expect(404);
      expect(persistence.role.findUnique).not.toHaveBeenCalled();
      expect(persistence.user.update).not.toHaveBeenCalled();
    });
    it('rejects unsupported roles before persistence', async () => {
      await request(app.getHttpServer())
        .patch('/admin/users/user-1/role')
        .auth(auth(), { type: 'bearer' })
        .send({ role: 'SUPERUSER' })
        .expect(400);
      expect(persistence.user.update).not.toHaveBeenCalled();
    });
    it('reports a missing seeded role as a server configuration error without updating', async () => {
      persistence.role.findUnique.mockResolvedValue(null);
      await request(app.getHttpServer())
        .patch('/admin/users/user-1/role')
        .auth(auth(), { type: 'bearer' })
        .send({ role: 'AUTHOR' })
        .expect(500);
      expect(persistence.user.update).not.toHaveBeenCalled();
    });
  });

  describe('Auth and Sessions', () => {
    it('registers with a hashed password/default role and hides verification links in production', async () => {
      const previousMode = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'new@example.com',
            username: 'new_reader',
            name: 'New Reader',
            password: 'CorrectPassword123!',
          })
          .expect(201);
        expect(response.body.verificationUrl).toBeUndefined();
        expect(response.body.user.passwordHash).toBeUndefined();
        expect(persistence.role.findUnique).toHaveBeenCalledWith({
          where: { name: 'USER' },
        });
        const data = (
          persistence.user.create.mock.calls[0][0] as {
            data: { passwordHash: string; roleId: string };
          }
        ).data;
        expect(data.roleId).toBe('role-id');
        expect(
          await argon2.verify(data.passwordHash, 'CorrectPassword123!'),
        ).toBe(true);
        expect(persistence.user.create).toHaveBeenCalledWith(
          expect.objectContaining({ select: userPublicSelect }),
        );
        expect(mail.sendEmailVerification).not.toHaveBeenCalled();
      } finally {
        if (previousMode === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = previousMode;
      }
    });
    it.each([
      'unknown user',
      'no password',
      'wrong password',
      'no role',
      'invalid role',
    ])('rejects %s without creating a session', async (scenario) => {
      if (scenario === 'unknown user')
        persistence.user.findUnique.mockResolvedValue(null);
      else if (scenario === 'no password')
        persistence.user.findUnique.mockResolvedValue({
          ...safeUser,
          passwordHash: null,
        });
      else if (scenario === 'no role')
        persistence.user.findUnique.mockResolvedValue({
          ...safeUser,
          passwordHash,
          role: null,
        });
      else if (scenario === 'invalid role')
        persistence.user.findUnique.mockResolvedValue({
          ...safeUser,
          passwordHash,
          role: { name: 'SUPERUSER' },
        });
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: safeUser.email,
          password:
            scenario === 'wrong password'
              ? 'WrongPassword123!'
              : 'CorrectPassword123!',
        })
        .expect(401);
      expect(response.body.accessToken).toBeUndefined();
      expect(persistence.refreshToken.create).not.toHaveBeenCalled();
    });
    it('logs in with real signing/hashing and stores only a refresh-token hash', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: safeUser.email, password: 'CorrectPassword123!' })
        .expect(200);
      expect(jwt.verify(response.body.accessToken)).toEqual(
        expect.objectContaining({ sub: 'user-1', role: 'USER' }),
      );
      expect(response.body.user.passwordHash).toBeUndefined();
      const data = (
        persistence.refreshToken.create.mock.calls[0][0] as {
          data: { tokenHash: string; userId: string; expiresAt: Date };
        }
      ).data;
      expect(data.userId).toBe('user-1');
      expect(data.tokenHash).not.toBe(response.body.refreshToken);
      expect(
        await argon2.verify(data.tokenHash, response.body.refreshToken),
      ).toBe(true);
      expect(data.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
    it('rejects a malformed refresh token before querying sessions', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid' })
        .expect(401);
      expect(persistence.refreshToken.findMany).not.toHaveBeenCalled();
    });
    it('rejects a signed token that matches no stored session', async () => {
      const refreshToken = jwt.sign(
        { sub: 'user-1' },
        { secret: settings.JWT_REFRESH_SECRET },
      );
      persistence.refreshToken.findMany.mockResolvedValue([
        { id: 'unrelated', tokenHash: passwordHash },
      ]);
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(401);
      expect(persistence.user.findUnique).not.toHaveBeenCalled();
      expect(persistence.refreshToken.create).not.toHaveBeenCalled();
    });
    it('rejects revoked/expired sessions and queries only active sessions', async () => {
      const refreshToken = jwt.sign(
        { sub: 'user-1' },
        { secret: settings.JWT_REFRESH_SECRET },
      );
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(401);
      expect(persistence.refreshToken.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          revokedAt: null,
          expiresAt: { gt: expect.any(Date) },
        },
      });
    });
    it('refreshes using the current database role rather than a stale token role', async () => {
      const refreshToken = jwt.sign(
        { sub: 'user-1', role: 'USER' },
        { secret: settings.JWT_REFRESH_SECRET },
      );
      persistence.refreshToken.findMany.mockResolvedValue([
        { id: 's', tokenHash: await argon2.hash(refreshToken) },
      ]);
      persistence.user.findUnique.mockResolvedValue({
        ...safeUser,
        role: { name: 'AUTHOR' },
      });
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);
      expect(jwt.verify(response.body.accessToken)).toEqual(
        expect.objectContaining({ role: 'AUTHOR' }),
      );
    });
    it('logs out only the matching session', async () => {
      const refreshToken = jwt.sign(
        { sub: 'user-1' },
        { secret: settings.JWT_REFRESH_SECRET },
      );
      persistence.refreshToken.findMany.mockResolvedValue([
        { id: 'other', tokenHash: passwordHash },
        { id: 'matching', tokenHash: await argon2.hash(refreshToken) },
      ]);
      await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken })
        .expect(200);
      expect(persistence.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'matching' },
        data: { revokedAt: expect.any(Date) },
      });
    });
    it('requires authentication for logout-all and revokes only current user sessions', async () => {
      await request(app.getHttpServer()).post('/auth/logout-all').expect(401);
      await request(app.getHttpServer())
        .post('/auth/logout-all')
        .auth(auth('USER'), { type: 'bearer' })
        .expect(200);
      expect(persistence.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe('Protected interaction routes', () => {
    it.each(['/posts/p/comments', '/posts/p/like', '/posts/p/bookmark'])(
      'rejects anonymous writes to %s',
      async (route) => {
        await request(app.getHttpServer())
          .post(route)
          .send({ content: 'Hello' })
          .expect(401);
      },
    );
    it('validates a media upload before calling Cloudinary', async () => {
      await request(app.getHttpServer())
        .post('/media/images')
        .auth(auth('USER'), { type: 'bearer' })
        .expect(422);
      expect(cloudinary.uploadImage).not.toHaveBeenCalled();
    });
    it('does not expose obsolete /users test routes', async () => {
      await request(app.getHttpServer()).get('/users/test').expect(404);
    });
  });
});

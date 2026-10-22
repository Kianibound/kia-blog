import { jest } from '@jest/globals';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DatabaseModule } from '../database/database.module';
import { PrismaService } from '../database/prisma.service';
import { PostStatus } from '../generated/prisma/client';
import { PostsModule } from './posts.module';

// Real routing, guards, validation, and Posts wiring; no database or remote calls.
describe('PostsModule HTTP contract', () => {
  let app: INestApplication;
  let jwt: JwtService;
  const post = {
    id: 'post-1',
    authorId: 'owner',
    status: PostStatus.DRAFT,
    publishedAt: null,
  };
  const repository = {
    findUnique: jest.fn<(args: unknown) => Promise<unknown>>(),
    findFirst: jest.fn<(args: unknown) => Promise<unknown>>(),
    findMany: jest.fn<(args: unknown) => Promise<unknown[]>>(),
    count: jest.fn<(args: unknown) => Promise<number>>(),
    create: jest.fn<(args: unknown) => Promise<unknown>>(),
    update: jest.fn<(args: unknown) => Promise<unknown>>(),
    delete: jest.fn<(args: unknown) => Promise<unknown>>(),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        DatabaseModule,
        PostsModule,
      ],
    })
      .overrideProvider(ConfigService)
      .useValue({
        getOrThrow: (key: string) =>
          ({
            JWT_ACCESS_SECRET: 'isolated-posts-test-secret',
            JWT_ACCESS_EXPIRES_IN: '900',
          })[key],
      })
      .overrideProvider(PrismaService)
      .useValue({ post: repository })
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
    jest.resetAllMocks();
    repository.findUnique.mockResolvedValue(post);
    repository.findFirst.mockResolvedValue(null);
    repository.findMany.mockResolvedValue([]);
    repository.count.mockResolvedValue(0);
    repository.create.mockResolvedValue(post);
  });
  afterAll(async () => {
    await app?.close();
  });
  const token = (sub: string, role = 'AUTHOR') => jwt.sign({ sub, role });

  it('serves the public feed with transformed pagination', async () => {
    const response = await request(app.getHttpServer())
      .get('/posts?page=2&limit=3')
      .expect(200);
    expect(response.body).toEqual({
      data: [],
      meta: { page: 2, limit: 3, total: 0, totalPages: 0 },
    });
    expect(repository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 3,
        take: 3,
        where: { status: PostStatus.PUBLISHED },
      }),
    );
  });
  it('rejects invalid pagination before querying persistence', async () => {
    await request(app.getHttpServer()).get('/posts?limit=100').expect(400);
    expect(repository.findMany).not.toHaveBeenCalled();
  });
  it('does not expose drafts through the public slug route', async () => {
    await request(app.getHttpServer()).get('/posts/draft-slug').expect(404);
    expect(repository.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: 'draft-slug', status: PostStatus.PUBLISHED },
      }),
    );
  });
  it('requires authentication and AUTHOR/ADMIN for creating posts', async () => {
    await request(app.getHttpServer())
      .post('/posts')
      .send({ title: 'Title', content: 'Content' })
      .expect(401);
    await request(app.getHttpServer())
      .post('/posts')
      .auth(token('reader', 'USER'), { type: 'bearer' })
      .send({ title: 'Title', content: 'Content' })
      .expect(403);
    expect(repository.create).not.toHaveBeenCalled();
  });
  it('creates posts using identity from the signed token', async () => {
    repository.findUnique.mockResolvedValue(null);
    await request(app.getHttpServer())
      .post('/posts')
      .auth(token('owner'), { type: 'bearer' })
      .send({ title: 'Hello', content: 'Content' })
      .expect(201);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ authorId: 'owner', slug: 'hello' }),
      }),
    );
  });
  it('keeps mine routing ahead of slug lookup and enforces ownership', async () => {
    await request(app.getHttpServer())
      .get('/posts/mine/post-1')
      .auth(token('owner'), { type: 'bearer' })
      .expect(200);
    await request(app.getHttpServer())
      .get('/posts/mine/post-1')
      .auth(token('other'), { type: 'bearer' })
      .expect(403);
    expect(repository.findFirst).not.toHaveBeenCalled();
  });
  it('keeps unrestricted database-id detail admin-only', async () => {
    await request(app.getHttpServer())
      .get('/posts/by-id/post-1')
      .auth(token('owner'), { type: 'bearer' })
      .expect(403);
    await request(app.getHttpServer())
      .get('/posts/by-id/post-1')
      .auth(token('admin', 'ADMIN'), { type: 'bearer' })
      .expect(200);
  });
});

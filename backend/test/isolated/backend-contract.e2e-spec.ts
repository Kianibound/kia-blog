import { vi as jest } from 'vitest';
import {
  INestApplication,
  InternalServerErrorException,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import * as argon2 from 'argon2';
import { createHash } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';
import { MailService } from '../../src/mail/mail.service';
import { CloudinaryService } from '../../src/media/cloudinary.service';
import { userAdminSelect, userPublicSelect } from '../../src/users/user.select';
import { ThrottlerStorage } from '@nestjs/throttler';
import { Prisma } from '../../src/generated/prisma/client';
import { setupSwagger } from '../../src/swagger';
import { GOOGLE_OAUTH_CLIENT } from '../../src/auth/services/google-oauth.service';
import { GITHUB_FETCH } from '../../src/auth/services/github-oauth.service';
import type {
  OpenAPIObject,
  SchemaObject,
  ReferenceObject,
} from '@nestjs/swagger';

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
    $transaction:
      jest.fn<
        (run: (transaction: unknown) => Promise<unknown>) => Promise<unknown>
      >(),
    githubOAuthState: { create: query(), updateMany: query() },
    githubIdentity: { findUnique: query() },
    googleOAuthState: { create: query(), updateMany: query() },
    googleIdentity: { findUnique: query() },
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
    user: {
      updateMany: query(),
      delete: query(),
      findFirst: query(),
      findUnique: query(),
      findMany: query(),
      create: query(),
      update: query(),
    },
    role: { findUnique: query() },
    refreshToken: {
      findUnique: query(),
      create: query(),
      findMany: query(),
      update: query(),
      updateMany: query(),
    },
    emailVerificationToken: { create: query() },
    category: taxonomy(),
    tag: taxonomy(),
    post: {
      create: query(),
      update: query(),
      findFirst: query(),
      findUnique: query(),
      findMany: query(),
      count: query(),
    },
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
  // Google SDK boundary only; no real provider requests or credentials.
  const googleUrlClient = new OAuth2Client();
  const google = {
    generateAuthUrl: googleUrlClient.generateAuthUrl.bind(googleUrlClient),
    getToken: jest.fn(),
    verifyIdToken: jest.fn(),
  };
  const settings: Record<string, string> = {
    GITHUB_CLIENT_ID: 'isolated-github-client',
    GITHUB_CLIENT_SECRET: 'isolated-github-secret',
    GITHUB_REDIRECT_URI: 'http://localhost:3001/auth/github/callback',
    GOOGLE_CLIENT_ID: 'isolated-test-client',
    GOOGLE_CLIENT_SECRET: 'isolated-test-secret',
    GOOGLE_REDIRECT_URI: 'http://localhost:3001/auth/google/callback',
    JWT_ACCESS_SECRET: 'backend-contract-access-secret',
    JWT_ACCESS_EXPIRES_IN: '900',
    JWT_REFRESH_SECRET: 'backend-contract-refresh-secret',
    EMAIL_ENABLED: 'false',
    APP_URL: 'https://example.invalid',
  };
  // In-memory persistence test double for atomic state consumption only.
  const googleStates = new Map<
    string,
    {
      stateHash: string;
      verifierHash: string;
      expiresAt: Date;
      usedAt: Date | null;
    }
  >();
  const githubStates: typeof googleStates = new Map();
  // GitHub network boundary; all provider responses below are test doubles.
  const githubFetch = jest.fn<typeof fetch>();

  beforeAll(async () => {
    passwordHash = await argon2.hash('CorrectPassword123!');
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(GITHUB_FETCH)
      .useValue(githubFetch)
      .overrideProvider(GOOGLE_OAUTH_CLIENT)
      .useValue(google)
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
      // Rate-limit windows are not the subject of isolated contract examples.
      .overrideProvider(ThrottlerStorage)
      .useValue({
        increment: async () => ({
          totalHits: 1,
          timeToExpire: 60,
          isBlocked: false,
          timeToBlockExpire: 0,
        }),
      })
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    setupSwagger(app);
    await app.init();
    jwt = module.get(JwtService);
  });
  beforeEach(() => {
    jest.clearAllMocks();
    persistence.$transaction.mockReset();
    persistence.$transaction.mockImplementation(async (run) =>
      run(persistence),
    );
    githubFetch.mockReset();
    persistence.githubOAuthState.create.mockReset();
    persistence.githubOAuthState.updateMany.mockReset();
    persistence.githubIdentity.findUnique.mockReset();
    githubStates.clear();
    persistence.githubOAuthState.create.mockImplementation(async (args) => {
      const { data } = args as {
        data: { stateHash: string; verifierHash: string; expiresAt: Date };
      };
      githubStates.set(data.stateHash, { ...data, usedAt: null });
      return data;
    });
    persistence.githubOAuthState.updateMany.mockImplementation(async (args) => {
      const { where, data } = args as {
        where: {
          stateHash: string;
          verifierHash: string;
          usedAt: null;
          expiresAt: { gt: Date };
        };
        data: { usedAt: Date };
      };
      const row = githubStates.get(where.stateHash);
      if (
        !row ||
        row.verifierHash !== where.verifierHash ||
        row.usedAt !== where.usedAt ||
        row.expiresAt <= where.expiresAt.gt
      )
        return { count: 0 };
      row.usedAt = data.usedAt;
      return { count: 1 };
    });
    persistence.googleOAuthState.create.mockReset();
    persistence.googleOAuthState.updateMany.mockReset();
    persistence.googleIdentity.findUnique.mockReset();
    google.getToken.mockReset();
    google.verifyIdToken.mockReset();
    googleStates.clear();
    persistence.googleOAuthState.create.mockImplementation(async (args) => {
      const { data } = args as {
        data: { stateHash: string; verifierHash: string; expiresAt: Date };
      };
      googleStates.set(data.stateHash, { ...data, usedAt: null });
      return data;
    });
    persistence.googleOAuthState.updateMany.mockImplementation(async (args) => {
      const { where, data } = args as {
        where: {
          stateHash: string;
          verifierHash: string;
          usedAt: null;
          expiresAt: { gt: Date };
        };
        data: { usedAt: Date };
      };
      const row = googleStates.get(where.stateHash);
      if (
        !row ||
        row.verifierHash !== where.verifierHash ||
        row.usedAt !== where.usedAt ||
        row.expiresAt <= where.expiresAt.gt
      )
        return { count: 0 };
      row.usedAt = data.usedAt;
      return { count: 1 };
    });
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
    persistence.refreshToken.findUnique.mockResolvedValue({
      userId: 'user-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60000),
      user: safeUser,
    });
    persistence.refreshToken.findMany.mockResolvedValue([]);
    persistence.post.findFirst.mockResolvedValue(null);
    persistence.post.findUnique.mockReset();
    persistence.post.create.mockReset();
    persistence.post.update.mockReset();
    persistence.post.findMany.mockReset();
    persistence.post.count.mockReset();
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
  const auth = (role = 'ADMIN') => {
    persistence.refreshToken.findUnique.mockResolvedValue({
      userId: 'user-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60000),
      user: { ...safeUser, role: { name: role } },
    });
    return jwt.sign({
      sub: 'user-1',
      email: safeUser.email,
      role,
      sid: 'session-1',
    });
  };

  it('initiates GitHub login with single-use state and S256 PKCE for the server adapter', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/github')
      .send({})
      .expect(200);
    const url = new URL(response.body.authorizationUrl);
    expect(url.origin + url.pathname).toBe(
      'https://github.com/login/oauth/authorize',
    );
    expect(url.searchParams.get('redirect_uri')).toBe(
      'http://localhost:3001/auth/github/callback',
    );
    expect(url.searchParams.get('scope')).toBe('user:email');
    expect(url.searchParams.get('state')).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('code_challenge')).toMatch(
      /^[A-Za-z0-9_-]{43}$/,
    );
    expect(response.body.flowVerifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(response.body.expiresIn).toBe(600);
    expect(url.searchParams.has('flowVerifier')).toBe(false);
    expect(url.searchParams.has('client_secret')).toBe(false);
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(response.headers['cache-control']).toBe('private, no-store');
    expect(githubFetch).not.toHaveBeenCalled();
  });

  it('rejects unmatched GitHub state before provider I/O or session issuance', async () => {
    persistence.githubOAuthState.updateMany.mockResolvedValue({ count: 0 });
    await request(app.getHttpServer())
      .post('/auth/github/callback')
      .send({
        state: 's'.repeat(43),
        flowVerifier: 'v'.repeat(43),
        code: 'test-code',
      })
      .expect(401);
    expect(githubFetch).not.toHaveBeenCalled();
    expect(persistence.refreshToken.create).not.toHaveBeenCalled();
  });

  it('logs in a linked GitHub AUTHOR by numeric ID even when public email is private', async () => {
    persistence.githubOAuthState.updateMany.mockResolvedValue({ count: 1 });
    persistence.githubIdentity.findUnique.mockResolvedValue({
      subject: '12345',
      user: { ...safeUser, disabledAt: null, role: { name: 'AUTHOR' } },
    });
    githubFetch
      .mockResolvedValueOnce(
        Response.json({
          access_token: 'test-only-github-token',
          token_type: 'bearer',
        }),
      )
      .mockResolvedValueOnce(
        Response.json({ id: 12345, login: 'renamed-login', email: null }),
      );
    const response = await request(app.getHttpServer())
      .post('/auth/github/callback')
      .send({
        state: 's'.repeat(43),
        flowVerifier: 'v'.repeat(43),
        code: 'test-code',
      })
      .expect(200);
    expect(jwt.verify(response.body.accessToken)).toMatchObject({
      sub: safeUser.id,
      email: safeUser.email,
      role: 'AUTHOR',
      sid: 'session-1',
    });
    expect(response.body.refreshToken).toEqual(expect.any(String));
    expect(response.body.user).not.toHaveProperty('passwordHash');
    expect(JSON.stringify(response.body)).not.toContain(
      'test-only-github-token',
    );
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(response.headers.location).toBeUndefined();
    expect(response.headers['cache-control']).toBe('private, no-store');
    expect(persistence.githubIdentity.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { subject: '12345' } }),
    );
    expect(githubFetch).toHaveBeenCalledTimes(2);
    const [url, options] = githubFetch.mock.calls[0];
    expect(url).toBe('https://github.com/login/oauth/access_token');
    const body = new URLSearchParams(options!.body as URLSearchParams);
    expect(body.get('code_verifier')).toBe('v'.repeat(43));
    expect(body.get('redirect_uri')).toBe(
      'http://localhost:3001/auth/github/callback',
    );
  });

  const githubCallback = (overrides: object = {}) =>
    request(app.getHttpServer())
      .post('/auth/github/callback')
      .send({
        state: 's'.repeat(43),
        flowVerifier: 'v'.repeat(43),
        code: 'test-code',
        ...overrides,
      });
  const githubIdentityResponses = () => {
    persistence.githubOAuthState.updateMany.mockResolvedValue({ count: 1 });
    persistence.githubIdentity.findUnique.mockResolvedValue(null);
    persistence.user.findFirst.mockResolvedValue(null);
    githubFetch
      .mockResolvedValueOnce(
        Response.json({
          access_token: 'test-only-github-token',
          token_type: 'bearer',
        }),
      )
      .mockResolvedValueOnce(
        Response.json({ id: 12345, login: 'github-reader', email: null }),
      );
  };

  it('registers a new GitHub identity as USER using its verified private primary email', async () => {
    githubIdentityResponses();
    githubFetch.mockResolvedValueOnce(
      Response.json([
        { email: 'unverified@example.com', primary: false, verified: false },
        {
          email: safeUser.email,
          primary: true,
          verified: true,
          visibility: 'private',
        },
      ]),
    );
    const response = await githubCallback().expect(200);
    expect(jwt.verify(response.body.accessToken)).toMatchObject({
      role: 'USER',
      sid: 'session-1',
    });
    expect(persistence.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: safeUser.email,
          emailVerified: true,
          roleId: 'role-id',
          githubIdentity: { create: { subject: '12345' } },
        }),
      }),
    );
    expect(persistence.user.create.mock.calls[0][0]).not.toHaveProperty(
      'data.passwordHash',
    );
    expect(persistence.role.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { name: 'USER' } }),
    );
    expect(githubFetch.mock.calls[2][0]).toBe(
      'https://api.github.com/user/emails?per_page=100&page=1',
    );
  });

  it('refuses GitHub email collisions without linking to a password or Google account', async () => {
    githubIdentityResponses();
    githubFetch.mockResolvedValueOnce(
      Response.json([
        { email: 'READER@example.com', primary: true, verified: true },
      ]),
    );
    persistence.user.findFirst.mockResolvedValue({ id: safeUser.id });
    await githubCallback().expect(409);
    expect(persistence.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: { equals: 'READER@example.com', mode: 'insensitive' } },
      }),
    );
    expect(persistence.user.create).not.toHaveBeenCalled();
    expect(persistence.user.update).not.toHaveBeenCalled();
    expect(persistence.refreshToken.create).not.toHaveBeenCalled();
  });

  it('returns a safe conflict on concurrent GitHub identity or email registration', async () => {
    githubIdentityResponses();
    githubFetch.mockResolvedValueOnce(
      Response.json([{ email: safeUser.email, primary: true, verified: true }]),
    );
    persistence.user.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('private-provider-collision', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );
    const result = await githubCallback().expect(409);
    expect(JSON.stringify(result.body)).not.toContain(
      'private-provider-collision',
    );
    expect(persistence.refreshToken.create).not.toHaveBeenCalled();
  });

  it('finds the verified primary GitHub email across provider email pages', async () => {
    githubIdentityResponses();
    githubFetch.mockResolvedValueOnce(
      Response.json(
        Array.from({ length: 100 }, () => ({
          email: 'secondary@example.com',
          primary: false,
          verified: true,
        })),
      ),
    );
    githubFetch.mockResolvedValueOnce(
      Response.json([{ email: safeUser.email, primary: true, verified: true }]),
    );
    await githubCallback().expect(200);
    expect(githubFetch.mock.calls[3][0]).toBe(
      'https://api.github.com/user/emails?per_page=100&page=2',
    );
  });

  it.each([
    { label: 'no email', emails: [] },
    {
      label: 'no primary email',
      emails: [{ email: safeUser.email, primary: false, verified: true }],
    },
    {
      label: 'unverified primary email',
      emails: [{ email: safeUser.email, primary: true, verified: false }],
    },
    {
      label: 'malformed email',
      emails: [{ email: 'not-email', primary: true, verified: true }],
    },
    {
      label: 'ambiguous primary emails',
      emails: [
        { email: safeUser.email, primary: true, verified: true },
        { email: 'other@example.com', primary: true, verified: true },
      ],
    },
    {
      label: 'malformed email response',
      emails: { message: 'test provider failure' },
    },
  ])('refuses new GitHub registration with $label', async ({ emails }) => {
    githubIdentityResponses();
    githubFetch.mockResolvedValueOnce(Response.json(emails));
    await githubCallback().expect(401);
    expect(persistence.user.create).not.toHaveBeenCalled();
    expect(persistence.refreshToken.create).not.toHaveBeenCalled();
  });

  it.each([
    { label: 'disabled', user: { ...safeUser, disabledAt: new Date() } },
    {
      label: 'missing role',
      user: { ...safeUser, disabledAt: null, role: null },
    },
    {
      label: 'unsupported role',
      user: { ...safeUser, disabledAt: null, role: { name: 'OWNER' } },
    },
  ])('rejects a $label linked GitHub account', async ({ user }) => {
    githubIdentityResponses();
    persistence.githubIdentity.findUnique.mockResolvedValue({
      subject: '12345',
      user,
    });
    await githubCallback().expect(401);
    expect(persistence.refreshToken.create).not.toHaveBeenCalled();
    expect(githubFetch).toHaveBeenCalledTimes(2);
  });

  it.each([null, '12345', -1, 0, 1.5, 9007199254740992])(
    'rejects malformed GitHub subject %s',
    async (id) => {
      githubIdentityResponses();
      githubFetch.mockReset();
      githubFetch
        .mockResolvedValueOnce(
          Response.json({ access_token: 'test-token', token_type: 'bearer' }),
        )
        .mockResolvedValueOnce(
          Response.json({ id, login: 'untrusted', email: safeUser.email }),
        );
      await githubCallback().expect(401);
      expect(persistence.githubIdentity.findUnique).not.toHaveBeenCalled();
      expect(persistence.refreshToken.create).not.toHaveBeenCalled();
    },
  );

  it.each([
    'network',
    'token-error',
    'token-type',
    'profile-status',
    'emails-status',
    'invalid-json',
  ])('sanitizes GitHub %s failures and issues no session', async (failure) => {
    persistence.githubOAuthState.updateMany.mockResolvedValue({ count: 1 });
    if (failure === 'network')
      githubFetch.mockRejectedValueOnce(
        new Error('private-test-provider-detail'),
      );
    else if (failure === 'token-error')
      githubFetch.mockResolvedValueOnce(
        Response.json({ error: 'private-test-provider-detail' }),
      );
    else if (failure === 'token-type')
      githubFetch.mockResolvedValueOnce(
        Response.json({ access_token: 'test-token', token_type: 'wrong' }),
      );
    else if (failure === 'invalid-json')
      githubFetch.mockResolvedValueOnce(new Response('invalid-json'));
    else {
      githubFetch.mockResolvedValueOnce(
        Response.json({ access_token: 'test-token', token_type: 'bearer' }),
      );
      if (failure === 'profile-status')
        githubFetch.mockResolvedValueOnce(
          Response.json(
            { message: 'private-test-provider-detail' },
            { status: 403 },
          ),
        );
      else {
        persistence.githubIdentity.findUnique.mockResolvedValue(null);
        githubFetch
          .mockResolvedValueOnce(
            Response.json({ id: 12345, email: safeUser.email }),
          )
          .mockResolvedValueOnce(
            Response.json(
              { message: 'private-test-provider-detail' },
              { status: 403 },
            ),
          );
      }
    }
    const response = await githubCallback().expect(401);
    expect(JSON.stringify(response.body)).not.toContain(
      'private-test-provider-detail',
    );
    expect(persistence.refreshToken.create).not.toHaveBeenCalled();
    expect(persistence.user.create).not.toHaveBeenCalled();
  });

  it('rejects malformed GitHub callback fields and caller role/redirect selection', async () => {
    for (const extra of [
      { code: 42 },
      { state: 'short' },
      { flowVerifier: [] },
      { role: 'ADMIN' },
      { redirectUri: 'https://attacker.invalid' },
    ]) {
      await githubCallback(extra).expect(400);
    }
    expect(githubFetch).not.toHaveBeenCalled();
  });

  it('consumes GitHub state on denial and rejects wrong verifiers, expiry and replay', async () => {
    const start = await request(app.getHttpServer())
      .post('/auth/github')
      .send({})
      .expect(200);
    const state = new URL(start.body.authorizationUrl).searchParams.get(
      'state',
    )!;
    const fields = {
      state,
      flowVerifier: start.body.flowVerifier,
      code: undefined,
      error: 'access_denied',
    };
    await githubCallback({ ...fields, flowVerifier: 'x'.repeat(43) }).expect(
      401,
    );
    const denial = await githubCallback(fields).expect(401);
    expect(denial.body.message).toBe('GitHub login failed.');
    const replay = await githubCallback(fields).expect(401);
    expect(replay.body.message).toBe('Invalid or expired GitHub login state.');
    const expired = await request(app.getHttpServer())
      .post('/auth/github')
      .send({})
      .expect(200);
    const expiredState = new URL(
      expired.body.authorizationUrl,
    ).searchParams.get('state')!;
    for (const row of githubStates.values()) row.expiresAt = new Date(0);
    await githubCallback({
      state: expiredState,
      flowVerifier: expired.body.flowVerifier,
    }).expect(401);
    expect(githubFetch).not.toHaveBeenCalled();
  });

  it('rejects Google state at the GitHub callback', async () => {
    const googleStart = await request(app.getHttpServer())
      .post('/auth/google')
      .send({})
      .expect(200);
    const state = new URL(googleStart.body.authorizationUrl).searchParams.get(
      'state',
    )!;
    await githubCallback({
      state,
      flowVerifier: googleStart.body.flowVerifier,
    }).expect(401);
    expect(githubFetch).not.toHaveBeenCalled();
  });

  it('accepts only one simultaneous GitHub callback for initiated state', async () => {
    const start = await request(app.getHttpServer())
      .post('/auth/github')
      .send({})
      .expect(200);
    const state = new URL(start.body.authorizationUrl).searchParams.get(
      'state',
    )!;
    persistence.githubIdentity.findUnique.mockResolvedValue({
      subject: '12345',
      user: { ...safeUser, disabledAt: null },
    });
    githubFetch
      .mockResolvedValueOnce(
        Response.json({
          access_token: 'test-only-token',
          token_type: 'bearer',
        }),
      )
      .mockResolvedValueOnce(Response.json({ id: 12345, email: null }));
    const replies = await Promise.all([
      githubCallback({ state, flowVerifier: start.body.flowVerifier }),
      githubCallback({ state, flowVerifier: start.body.flowVerifier }),
    ]);
    expect(replies.map((r) => r.status).sort()).toEqual([200, 401]);
    expect(githubFetch).toHaveBeenCalledTimes(2);
    for (const [, options] of githubFetch.mock.calls) {
      expect(options).toMatchObject({
        redirect: 'error',
        cache: 'no-store',
        signal: expect.any(AbortSignal),
      });
    }
  });

  it('keeps consumed GitHub state unusable after provider failure', async () => {
    const start = await request(app.getHttpServer())
      .post('/auth/github')
      .send({})
      .expect(200);
    const state = new URL(start.body.authorizationUrl).searchParams.get(
      'state',
    )!;
    githubFetch.mockRejectedValueOnce(new Error('test-only-provider-outage'));
    await githubCallback({
      state,
      flowVerifier: start.body.flowVerifier,
    }).expect(401);
    await githubCallback({
      state,
      flowVerifier: start.body.flowVerifier,
    }).expect(401);
    expect(githubFetch).toHaveBeenCalledTimes(1);
  });

  it('requires safe GitHub configuration without affecting other auth', async () => {
    const original = { ...settings };
    try {
      for (const uri of [
        '',
        'http://remote.example/auth/github/callback',
        'https://example.com/auth/google/callback',
        'https://example.com/auth/github/callback?next=bad',
      ]) {
        settings.GITHUB_REDIRECT_URI = uri;
        await request(app.getHttpServer())
          .post('/auth/github')
          .send({})
          .expect(503);
      }
      settings.GITHUB_REDIRECT_URI = original.GITHUB_REDIRECT_URI;
      settings.GITHUB_CLIENT_SECRET = '';
      await request(app.getHttpServer())
        .post('/auth/github')
        .send({})
        .expect(503);
      await request(app.getHttpServer())
        .post('/auth/google')
        .send({})
        .expect(200);
    } finally {
      Object.assign(settings, original);
    }
    expect(githubFetch).not.toHaveBeenCalled();
  });

  it('initiates Google login with state and S256 PKCE for the server adapter', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/google')
      .send({})
      .expect(200);
    const url = new URL(response.body.authorizationUrl);
    expect(url.origin).toBe('https://accounts.google.com');
    expect(url.searchParams.get('redirect_uri')).toBe(
      'http://localhost:3001/auth/google/callback',
    );
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('state')).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(response.body.flowVerifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(url.searchParams.has('flowVerifier')).toBe(false);
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(response.headers['cache-control']).toBe('private, no-store');
  });

  it('rejects unknown, expired, consumed or wrong-verifier Google state before contacting Google', async () => {
    persistence.googleOAuthState.updateMany.mockResolvedValue({ count: 0 });
    await request(app.getHttpServer())
      .post('/auth/google/callback')
      .send({
        state: 's'.repeat(43),
        flowVerifier: 'v'.repeat(43),
        code: 'test-code',
      })
      .expect(401);
    expect(google.getToken).not.toHaveBeenCalled();
    expect(persistence.refreshToken.create).not.toHaveBeenCalled();
  });

  it('logs in a linked Google AUTHOR using the stored role and existing session JWT contract', async () => {
    const state = 's'.repeat(43);
    persistence.googleOAuthState.updateMany.mockResolvedValue({ count: 1 });
    persistence.googleIdentity.findUnique.mockResolvedValue({
      subject: 'google-subject-1',
      user: { ...safeUser, disabledAt: null, role: { name: 'AUTHOR' } },
    });
    google.getToken.mockResolvedValue({
      tokens: { id_token: 'test-only-id-token' },
    });
    google.verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-subject-1',
        email: safeUser.email,
        email_verified: true,
        nonce: createHash('sha256').update(state).digest('base64url'),
      }),
    });
    const response = await request(app.getHttpServer())
      .post('/auth/google/callback')
      .send({
        state,
        flowVerifier: 'v'.repeat(43),
        code: 'test-code',
      })
      .expect(200);
    expect(jwt.verify(response.body.accessToken)).toMatchObject({
      sub: safeUser.id,
      role: 'AUTHOR',
      sid: 'session-1',
    });
    expect(response.body.refreshToken).toEqual(expect.any(String));
    expect(response.body.user).not.toHaveProperty('passwordHash');
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(response.headers['cache-control']).toBe('private, no-store');
    expect(google.getToken).toHaveBeenCalledWith(
      expect.objectContaining({
        codeVerifier: 'v'.repeat(43),
        redirect_uri: 'http://localhost:3001/auth/google/callback',
      }),
    );
  });

  it('registers a new Google subject as USER with no password and atomically linked identity', async () => {
    persistence.googleOAuthState.updateMany.mockResolvedValue({ count: 1 });
    persistence.googleIdentity.findUnique.mockResolvedValue(null);
    persistence.user.findFirst.mockResolvedValue(null);
    google.getToken.mockResolvedValue({
      tokens: { id_token: 'test-only-id-token' },
    });
    google.verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'new-google-subject',
        email: safeUser.email,
        email_verified: true,
        nonce: createHash('sha256').update('s'.repeat(43)).digest('base64url'),
      }),
    });
    const response = await request(app.getHttpServer())
      .post('/auth/google/callback')
      .send({
        state: 's'.repeat(43),
        flowVerifier: 'v'.repeat(43),
        code: 'test-code',
      })
      .expect(200);
    expect(jwt.verify(response.body.accessToken)).toMatchObject({
      role: 'USER',
    });
    expect(persistence.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          googleIdentity: { create: { subject: 'new-google-subject' } },
          roleId: 'role-id',
          emailVerified: true,
        }),
      }),
    );
    expect(persistence.role.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { name: 'USER' } }),
    );
    expect(persistence.user.create.mock.calls[0][0]).not.toHaveProperty(
      'data.passwordHash',
    );
  });

  it('refuses email-based linking to an existing account without changing it or issuing a session', async () => {
    persistence.googleOAuthState.updateMany.mockResolvedValue({ count: 1 });
    persistence.googleIdentity.findUnique.mockResolvedValue(null);
    persistence.user.findFirst.mockResolvedValue({ id: safeUser.id });
    google.getToken.mockResolvedValue({
      tokens: { id_token: 'test-only-id-token' },
    });
    google.verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'unlinked-subject',
        email: 'READER@example.com',
        email_verified: true,
        nonce: createHash('sha256').update('s'.repeat(43)).digest('base64url'),
      }),
    });
    await request(app.getHttpServer())
      .post('/auth/google/callback')
      .send({
        state: 's'.repeat(43),
        flowVerifier: 'v'.repeat(43),
        code: 'test-code',
      })
      .expect(409);
    expect(persistence.user.create).not.toHaveBeenCalled();
    expect(persistence.user.update).not.toHaveBeenCalled();
    expect(persistence.refreshToken.create).not.toHaveBeenCalled();
    expect(persistence.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: { equals: 'READER@example.com', mode: 'insensitive' } },
      }),
    );
  });

  it('returns a safe conflict if simultaneous Google registration hits a unique constraint', async () => {
    persistence.googleOAuthState.updateMany.mockResolvedValue({ count: 1 });
    persistence.googleIdentity.findUnique.mockResolvedValue(null);
    persistence.user.findFirst.mockResolvedValue(null);
    persistence.user.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('private collision detail', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );
    google.getToken.mockResolvedValue({
      tokens: { id_token: 'test-only-id-token' },
    });
    google.verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'racing-subject',
        email: safeUser.email,
        email_verified: true,
        nonce: createHash('sha256').update('s'.repeat(43)).digest('base64url'),
      }),
    });
    const result = await request(app.getHttpServer())
      .post('/auth/google/callback')
      .send({
        state: 's'.repeat(43),
        flowVerifier: 'v'.repeat(43),
        code: 'test-code',
      })
      .expect(409);
    expect(JSON.stringify(result.body)).not.toContain(
      'private collision detail',
    );
    expect(persistence.refreshToken.create).not.toHaveBeenCalled();
  });

  const validGooglePayload = () => ({
    sub: 'google-subject-1',
    email: safeUser.email,
    email_verified: true,
    nonce: createHash('sha256').update('s'.repeat(43)).digest('base64url'),
  });
  const googleCallback = (overrides: object = {}) =>
    request(app.getHttpServer())
      .post('/auth/google/callback')
      .send({
        state: 's'.repeat(43),
        flowVerifier: 'v'.repeat(43),
        code: 'test-code',
        ...overrides,
      });
  const linkedGoogle = (user: object = { ...safeUser, disabledAt: null }) => {
    persistence.googleOAuthState.updateMany.mockResolvedValue({ count: 1 });
    persistence.googleIdentity.findUnique.mockResolvedValue({
      subject: 'google-subject-1',
      user,
    });
    google.getToken.mockResolvedValue({
      tokens: { id_token: 'test-only-id-token' },
    });
    google.verifyIdToken.mockResolvedValue({ getPayload: validGooglePayload });
  };

  it.each([
    {
      label: 'disabled account',
      user: { ...safeUser, disabledAt: new Date() },
    },
    {
      label: 'missing role',
      user: { ...safeUser, disabledAt: null, role: null },
    },
    {
      label: 'unsupported role',
      user: { ...safeUser, disabledAt: null, role: { name: 'OWNER' } },
    },
  ])('rejects Google login for $label', async ({ user }) => {
    linkedGoogle(user);
    await googleCallback().expect(401);
    expect(persistence.refreshToken.create).not.toHaveBeenCalled();
  });

  it.each([
    { label: 'missing subject', payload: { sub: '' } },
    { label: 'non-string subject', payload: { sub: 42 } },
    { label: 'missing email', payload: { email: undefined } },
    { label: 'malformed email', payload: { email: 'invalid-email' } },
    { label: 'unverified email', payload: { email_verified: false } },
    { label: 'wrong nonce', payload: { nonce: 'wrong-nonce' } },
  ])(
    'rejects Google identity with $label before account lookup',
    async ({ payload }) => {
      linkedGoogle();
      google.verifyIdToken.mockResolvedValue({
        getPayload: () => ({ ...validGooglePayload(), ...payload }),
      });
      await googleCallback().expect(401);
      expect(persistence.googleIdentity.findUnique).not.toHaveBeenCalled();
      expect(persistence.refreshToken.create).not.toHaveBeenCalled();
    },
  );

  it.each(['exchange', 'verification', 'missing-token'])(
    'sanitizes Google %s failures without issuing a session',
    async (failure) => {
      linkedGoogle();
      if (failure === 'exchange')
        google.getToken.mockRejectedValue(new Error('private-provider-detail'));
      if (failure === 'verification')
        google.verifyIdToken.mockRejectedValue(
          new Error('private-provider-detail'),
        );
      if (failure === 'missing-token')
        google.getToken.mockResolvedValue({ tokens: {} });
      const response = await googleCallback().expect(401);
      expect(JSON.stringify(response.body)).not.toContain(
        'private-provider-detail',
      );
      expect(persistence.refreshToken.create).not.toHaveBeenCalled();
    },
  );

  it('does not accept role selection or redirect overrides in the Google callback', async () => {
    await googleCallback({
      role: 'ADMIN',
      redirectUri: 'https://attacker.invalid',
    }).expect(400);
    expect(google.getToken).not.toHaveBeenCalled();
  });

  it('keeps the linked account identity even if the Google email changes', async () => {
    linkedGoogle();
    google.verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        ...validGooglePayload(),
        email: 'changed@example.com',
      }),
    });
    const response = await googleCallback().expect(200);
    expect(jwt.verify(response.body.accessToken)).toMatchObject({
      sub: safeUser.id,
      email: safeUser.email,
    });
    expect(persistence.user.update).not.toHaveBeenCalled();
  });

  it('consumes real initiated state once, rejects replay and requires the private verifier', async () => {
    const start = await request(app.getHttpServer())
      .post('/auth/google')
      .send({})
      .expect(200);
    const state = new URL(start.body.authorizationUrl).searchParams.get(
      'state',
    )!;
    const body = {
      state,
      flowVerifier: start.body.flowVerifier,
      error: 'access_denied',
    };
    await request(app.getHttpServer())
      .post('/auth/google/callback')
      .send({ ...body, flowVerifier: 'x'.repeat(43) })
      .expect(401);
    const denied = await request(app.getHttpServer())
      .post('/auth/google/callback')
      .send(body)
      .expect(401);
    expect(denied.body.message).toBe('Google login failed.');
    const replay = await request(app.getHttpServer())
      .post('/auth/google/callback')
      .send(body)
      .expect(401);
    expect(replay.body.message).toBe('Invalid or expired Google login state.');
    expect(google.getToken).not.toHaveBeenCalled();
  });

  it('rejects expired initiated Google state', async () => {
    const start = await request(app.getHttpServer())
      .post('/auth/google')
      .send({})
      .expect(200);
    const state = new URL(start.body.authorizationUrl).searchParams.get(
      'state',
    )!;
    for (const row of googleStates.values()) row.expiresAt = new Date(0);
    await googleCallback({
      state,
      flowVerifier: start.body.flowVerifier,
    }).expect(401);
    expect(google.getToken).not.toHaveBeenCalled();
  });

  it('allows only one of two simultaneous callbacks for the same initiated Google state', async () => {
    const start = await request(app.getHttpServer())
      .post('/auth/google')
      .send({})
      .expect(200);
    const state = new URL(start.body.authorizationUrl).searchParams.get(
      'state',
    )!;
    persistence.googleIdentity.findUnique.mockResolvedValue({
      subject: 'google-subject-1',
      user: { ...safeUser, disabledAt: null },
    });
    google.getToken.mockResolvedValue({
      tokens: { id_token: 'test-only-id-token' },
    });
    google.verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        ...validGooglePayload(),
        nonce: createHash('sha256').update(state).digest('base64url'),
      }),
    });
    const responses = await Promise.all([
      googleCallback({ state, flowVerifier: start.body.flowVerifier }),
      googleCallback({ state, flowVerifier: start.body.flowVerifier }),
    ]);
    expect(responses.map((r) => r.status).sort()).toEqual([200, 401]);
    expect(google.getToken).toHaveBeenCalledTimes(1);
  });

  it('disables Google login safely when configuration is absent or redirect URI is unsafe', async () => {
    const original = settings.GOOGLE_REDIRECT_URI;
    try {
      for (const redirect of [
        '',
        'http://example.com/auth/google/callback',
        'https://example.com/wrong-path',
        'https://example.com/auth/google/callback?next=evil',
      ]) {
        settings.GOOGLE_REDIRECT_URI = redirect;
        await request(app.getHttpServer())
          .post('/auth/google')
          .send({})
          .expect(503);
      }
    } finally {
      settings.GOOGLE_REDIRECT_URI = original;
    }
    expect(persistence.googleOAuthState.create).not.toHaveBeenCalled();
  });

  it('documents requests and declared responses with complete, resolvable schemas', async () => {
    const response = await request(app.getHttpServer())
      .get('/api-json')
      .expect(200);
    const document: OpenAPIObject = response.body;
    const resolve = (schema: SchemaObject | ReferenceObject): SchemaObject =>
      '$ref' in schema
        ? resolve(document.components!.schemas![schema.$ref.split('/').pop()!])
        : schema;
    const checkedSchemas = new Set<SchemaObject>();
    const checkSchema = (schema: SchemaObject | ReferenceObject): void => {
      const resolved = resolve(schema);
      if (checkedSchemas.has(resolved)) return; // Recursive Tiptap node schema.
      checkedSchemas.add(resolved);
      expect(resolved).toBeDefined();
      if (resolved.allOf || resolved.oneOf || resolved.anyOf) {
        for (const variant of resolved.allOf ??
          resolved.oneOf ??
          resolved.anyOf ??
          [])
          checkSchema(variant);
      } else {
        expect(resolved.type).toBeDefined();
      }
      if (
        resolved.type === 'object' &&
        !resolved.allOf &&
        !resolved.oneOf &&
        !resolved.anyOf
      ) {
        if (!Object.keys(resolved.properties ?? {}).length)
          throw new Error(`Empty object schema: ${JSON.stringify(schema)}`);
        expect(Object.keys(resolved.properties ?? {}).length).toBeGreaterThan(
          0,
        );
        for (const property of Object.values(resolved.properties!))
          checkSchema(property);
      }
      if (resolved.type === 'array') {
        expect(resolved.items).toBeDefined();
        checkSchema(resolved.items!);
      }
    };
    for (const item of Object.values(document.paths)) {
      for (const method of ['get', 'post', 'patch', 'delete'] as const) {
        const operation = item[method];
        if (!operation) continue;
        if (operation.requestBody && !('$ref' in operation.requestBody)) {
          for (const media of Object.values(operation.requestBody.content)) {
            expect(media.schema).toBeDefined();
            checkSchema(media.schema!);
          }
        }
        for (const result of Object.values(operation.responses)) {
          if (!result || '$ref' in result) continue;
          expect(Object.values(result.content ?? {})[0]?.schema).toBeDefined();
          for (const media of Object.values(result.content!))
            checkSchema(media.schema!);
        }
      }
    }
    const create = resolve(document.components!.schemas!.CreatePostDto);
    expect(create.required).toEqual(['title']);
    const registration = resolve(document.components!.schemas!.RegisterDto);
    expect(registration.required).toEqual(['email', 'password']);
    expect(registration.properties!.password).toMatchObject({
      minLength: 8,
      pattern: expect.any(String),
    });
    expect(registration.properties).toHaveProperty('confirmPassword');
    expect(registration.properties).not.toHaveProperty('role');
    expect(
      resolve(document.components!.schemas!.RegisterResponseDto).properties,
    ).not.toHaveProperty('accessToken');
    expect(create.properties!.categoryIds).toEqual({
      type: 'array',
      items: { type: 'string', format: 'uuid' },
    });
    expect(
      resolve(document.components!.schemas!.UpdatePostDto).required ?? [],
    ).toEqual([]);
    expect(
      resolve(document.components!.schemas!.UserResponseDto).properties,
    ).not.toHaveProperty('passwordHash');
    expect(create.properties!.status).toMatchObject({
      enum: ['DRAFT', 'PUBLISHED', 'DEPRECATED'],
      default: 'DRAFT',
    });
    const detail = resolve(document.components!.schemas!.PostDetailResponseDto);
    expect(detail.required).toEqual(
      expect.arrayContaining(['author', 'categories', 'tags']),
    );
    expect(detail.properties!.publishedAt).toMatchObject({
      type: 'string',
      format: 'date-time',
      nullable: true,
    });
    const feed = resolve(document.components!.schemas!.PostFeedResponseDto);
    expect(feed.properties!.data).toMatchObject({
      type: 'array',
      items: { $ref: '#/components/schemas/PostDetailResponseDto' },
    });
    expect(
      resolve(document.components!.schemas!.MyPostsResponseDto).properties!
        .data,
    ).toMatchObject({
      items: { $ref: '#/components/schemas/PostResponseDto' },
    });
    expect(document.paths['/posts/mine/{id}'].get!.security).toEqual([
      { 'access-token': [] },
    ]);
    expect(document.paths['/posts'].get!.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'limit',
          required: false,
          schema: expect.objectContaining({ default: 10, maximum: 50 }),
        }),
        expect.objectContaining({
          name: 'sort',
          required: false,
          schema: expect.objectContaining({ enum: ['newest', 'oldest'] }),
        }),
      ]),
    );
  });

  describe('Private post detail', () => {
    const categories = [
      { id: 'category-1', name: 'Development', slug: 'development' },
    ];
    const tags = [{ id: 'tag-1', name: 'NestJS', slug: 'nestjs' }];
    beforeEach(() => {
      // Persistence test double honors requested relations so missing includes fail over HTTP.
      persistence.post.findUnique.mockImplementation(async (args) => {
        const include = (args as { include: Record<string, unknown> }).include;
        return {
          id: 'post-1',
          authorId: 'user-1',
          status: 'DRAFT',
          author: {
            id: 'user-1',
            username: 'reader',
            name: 'Reader',
            avatarUrl: null,
          },
          ...(include.categories ? { categories } : {}),
          ...(include.tags ? { tags } : {}),
        };
      });
    });
    it.each(['AUTHOR', 'ADMIN'])('returns taxonomy to %s', async (role) => {
      const response = await request(app.getHttpServer())
        .get('/posts/mine/post-1')
        .auth(auth(role), { type: 'bearer' })
        .expect(200);
      expect(response.body.categories).toEqual(categories);
      expect(response.body.tags).toEqual(tags);
      expect(response.body.author).not.toHaveProperty('passwordHash');
    });
    it('keeps anonymous and ordinary users out', async () => {
      await request(app.getHttpServer()).get('/posts/mine/post-1').expect(401);
      await request(app.getHttpServer())
        .get('/posts/mine/post-1')
        .auth(auth('USER'), { type: 'bearer' })
        .expect(403);
      expect(persistence.post.findUnique).not.toHaveBeenCalled();
    });
    it('returns empty taxonomy arrays for an uncategorized post', async () => {
      persistence.post.findUnique.mockResolvedValue({
        id: 'post-1',
        authorId: 'user-1',
        categories: [],
        tags: [],
      });
      const response = await request(app.getHttpServer())
        .get('/posts/mine/post-1')
        .auth(auth('AUTHOR'), { type: 'bearer' })
        .expect(200);
      expect(response.body.categories).toEqual([]);
      expect(response.body.tags).toEqual([]);
    });
    it('denies another author while allowing an admin', async () => {
      persistence.post.findUnique.mockResolvedValue({
        id: 'post-1',
        authorId: 'other',
        categories,
        tags,
      });
      await request(app.getHttpServer())
        .get('/posts/mine/post-1')
        .auth(auth('AUTHOR'), { type: 'bearer' })
        .expect(403);
      await request(app.getHttpServer())
        .get('/posts/mine/post-1')
        .auth(auth('ADMIN'), { type: 'bearer' })
        .expect(200);
    });
    it('returns 404 for a missing post', async () => {
      persistence.post.findUnique.mockResolvedValue(null);
      await request(app.getHttpServer())
        .get('/posts/mine/missing')
        .auth(auth('AUTHOR'), { type: 'bearer' })
        .expect(404);
    });
  });

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

  describe('Canonical rich article content', () => {
    const document = {
      type: 'doc',
      attrs: { dir: 'rtl' },
      content: [
        {
          type: 'heading',
          attrs: { level: 2, dir: 'rtl' },
          content: [{ type: 'text', text: 'Heading' }],
        },
        {
          type: 'paragraph',
          attrs: { dir: 'ltr' },
          content: [
            {
              type: 'text',
              text: 'Searchable words',
              marks: [{ type: 'bold' }, { type: 'italic' }],
            },
          ],
        },
      ],
    };
    // Stateful Post I/O double: the real controller, validators, commands and queries run.
    const articleStore = () => {
      let saved: Record<string, unknown> | undefined;
      const detail = () =>
        saved
          ? {
              ...structuredClone(saved),
              author: {
                id: 'user-1',
                username: 'reader',
                name: 'Reader',
                avatarUrl: null,
              },
              categories: [],
              tags: [],
            }
          : null;
      persistence.post.create.mockImplementation(async (args) => {
        const { data } = args as { data: Record<string, unknown> };
        const fields = Object.fromEntries(
          Object.entries(data)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => [
              key,
              key === 'contentDocument' && value === Prisma.DbNull
                ? null
                : structuredClone(value),
            ]),
        );
        saved = {
          id: 'rich-post',
          createdAt: new Date('2020-01-01'),
          updatedAt: new Date('2020-01-01'),
          status: 'DRAFT',
          publishedAt: null,
          contentDocument: null,
          ...fields,
          categories: [],
          tags: [],
        };
        return detail();
      });
      persistence.post.update.mockImplementation(async (args) => {
        const { data } = args as { data: Record<string, unknown> };
        for (const [key, value] of Object.entries(data))
          if (value !== undefined && key !== 'categories' && key !== 'tags')
            saved![key] =
              key === 'contentDocument' && value === Prisma.DbNull
                ? null
                : structuredClone(value);
        return detail();
      });
      persistence.post.findUnique.mockImplementation(async (args) =>
        (args as { where: { slug?: string } }).where.slug ? null : detail(),
      );
      persistence.post.findFirst.mockImplementation(async () =>
        saved?.status === 'PUBLISHED' ? detail() : null,
      );
      const matches = (args: unknown) => {
        const { where } = (args ?? {}) as {
          where?: {
            status?: string;
            authorId?: string;
            OR?: Array<{
              title?: { contains: string };
              content?: { contains: string };
            }>;
          };
        };
        return (
          !!saved &&
          (!where?.status || saved.status === where.status) &&
          (!where?.authorId || saved.authorId === where.authorId) &&
          (!where?.OR ||
            where.OR.some((term) =>
              term.title
                ? String(saved!.title)
                    .toLowerCase()
                    .includes(term.title.contains.toLowerCase())
                : String(saved!.content)
                    .toLowerCase()
                    .includes(term.content!.contains.toLowerCase()),
            ))
        );
      };
      persistence.post.findMany.mockImplementation(async (args) =>
        matches(args) ? [detail()] : [],
      );
      persistence.post.count.mockImplementation(async (args) =>
        matches(args) ? 1 : 0,
      );
      return { detail };
    };

    it('round-trips canonical JSON through creation, private detail, public detail and edit while deriving search text', async () => {
      articleStore();
      const token = auth('AUTHOR');
      const created = await request(app.getHttpServer())
        .post('/posts')
        .auth(token, { type: 'bearer' })
        .send({
          title: 'Rich article',
          contentDocument: document,
          status: 'PUBLISHED',
        })
        .expect(201);
      expect(created.body.contentDocument).toEqual(document);
      expect(created.body.content).toBe('Heading\nSearchable words');
      const own = await request(app.getHttpServer())
        .get('/posts/mine/rich-post')
        .auth(token, { type: 'bearer' })
        .expect(200);
      const published = await request(app.getHttpServer())
        .get('/posts/rich-article')
        .expect(200);
      expect(own.body.contentDocument).toEqual(document);
      expect(published.body.contentDocument).toEqual(document);
      const edited = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Edited plain projection' }],
          },
        ],
      };
      const updated = await request(app.getHttpServer())
        .patch('/posts/rich-post')
        .auth(token, { type: 'bearer' })
        .send({ contentDocument: edited })
        .expect(200);
      expect(updated.body.contentDocument).toEqual(edited);
      expect(updated.body.content).toBe('Edited plain projection');
      const listed = await request(app.getHttpServer())
        .get('/posts')
        .expect(200);
      expect(listed.body.data[0].contentDocument).toEqual(edited);
    });

    it('rejects excessively deep raw JSON safely before DTO transformation', async () => {
      let node: object = { type: 'paragraph' };
      for (let depth = 0; depth < 2000; depth++)
        node = { type: 'blockquote', content: [node] };
      await request(app.getHttpServer())
        .post('/posts')
        .auth(auth('AUTHOR'), { type: 'bearer' })
        .send({
          title: 'Too deep',
          contentDocument: { type: 'doc', content: [node] },
        })
        .expect(400);
      expect(persistence.post.create).not.toHaveBeenCalled();
    });

    const textDocument = (text: string) => ({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
    });
    const createDocument = (contentDocument: unknown) =>
      request(app.getHttpServer())
        .post('/posts')
        .auth(auth('AUTHOR'), { type: 'bearer' })
        .send({ title: 'Rich article', contentDocument });

    it('preserves lists, blockquotes, inline/code-block text, links, directions and text marks exactly', async () => {
      articleStore();
      const formatted = {
        type: 'doc',
        attrs: { dir: 'rtl' },
        content: [
          {
            type: 'heading',
            attrs: { level: 3, dir: 'rtl' },
            content: [
              {
                type: 'text',
                text: 'عنوان',
                marks: [{ type: 'bold' }, { type: 'italic' }],
              },
            ],
          },
          {
            type: 'bulletList',
            attrs: { dir: 'rtl' },
            content: [
              {
                type: 'listItem',
                attrs: { dir: 'rtl' },
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'First' }],
                  },
                ],
              },
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Second' }],
                  },
                  {
                    type: 'orderedList',
                    attrs: { start: 3, type: 'I', dir: 'rtl' },
                    content: [
                      {
                        type: 'listItem',
                        content: [
                          {
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'Nested' }],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'blockquote',
            attrs: { dir: 'auto' },
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Quoted' }],
              },
            ],
          },
          {
            type: 'codeBlock',
            attrs: { dir: 'ltr', language: 'typescript' },
            content: [{ type: 'text', text: 'const n = 123;\n// فارسی ۱۲۳' }],
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Inline ' },
              { type: 'text', text: 'code', marks: [{ type: 'code' }] },
              { type: 'hardBreak', attrs: { dir: 'rtl' } },
              {
                type: 'text',
                text: 'Guide',
                marks: [
                  {
                    type: 'link',
                    attrs: {
                      href: 'https://example.test/guide',
                      target: '_blank',
                      rel: 'noopener noreferrer nofollow',
                      class: null,
                      title: null,
                    },
                  },
                ],
              },
            ],
          },
        ],
      };
      const response = await createDocument(formatted).expect(201);
      expect(response.body.contentDocument).toEqual(formatted);
      expect(response.body.content).toBe(
        'عنوان\nFirst\nSecond\nNested\nQuoted\nconst n = 123;\n// فارسی ۱۲۳\nInline code\nGuide',
      );
    });

    it.each([
      { label: 'null', document: null },
      { label: 'serialized JSON', document: JSON.stringify(document) },
      { label: 'array root', document: [] },
      { label: 'wrong root', document: { type: 'paragraph' } },
      { label: 'empty doc', document: { type: 'doc', content: [] } },
      {
        label: 'unknown node',
        document: { type: 'doc', content: [{ type: 'table' }] },
      },
      {
        label: 'image',
        document: {
          type: 'doc',
          content: [
            { type: 'image', attrs: { src: 'https://example.test/image.png' } },
          ],
        },
      },
      {
        label: 'raw HTML attribute',
        document: {
          type: 'doc',
          content: [{ type: 'paragraph', attrs: { onclick: 'unsafe' } }],
        },
      },
      {
        label: 'heading level',
        document: {
          type: 'doc',
          content: [{ type: 'heading', attrs: { level: 1 } }],
        },
      },
      {
        label: 'heading string level',
        document: {
          type: 'doc',
          content: [{ type: 'heading', attrs: { level: '2' } }],
        },
      },
      {
        label: 'invalid child',
        document: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'paragraph' }] }],
        },
      },
      {
        label: 'marked code block text',
        document: {
          type: 'doc',
          content: [
            {
              type: 'codeBlock',
              content: [
                { type: 'text', text: 'Code', marks: [{ type: 'bold' }] },
              ],
            },
          ],
        },
      },
      {
        label: 'list without items',
        document: {
          type: 'doc',
          content: [{ type: 'bulletList', content: [{ type: 'paragraph' }] }],
        },
      },
      {
        label: 'invalid list item',
        document: {
          type: 'doc',
          content: [
            {
              type: 'orderedList',
              content: [
                {
                  type: 'listItem',
                  content: [{ type: 'heading', attrs: { level: 2 } }],
                },
              ],
            },
          ],
        },
      },
      {
        label: 'invalid start',
        document: {
          type: 'doc',
          content: [
            {
              type: 'orderedList',
              attrs: { start: -1 },
              content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }],
            },
          ],
        },
      },
      {
        label: 'invalid direction',
        document: {
          type: 'doc',
          attrs: { dir: ['rtl'] },
          content: [{ type: 'paragraph' }],
        },
      },
      { label: 'empty text', document: textDocument('') },
      { label: 'NUL text', document: textDocument('bad\u0000text') },
      { label: 'unpaired surrogate', document: textDocument('bad\ud800text') },
      {
        label: 'unknown field',
        document: { ...document, version: 'fixture-preview' },
      },
      {
        label: 'preview envelope',
        document: { format: 'tiptap-ui-proposal-1', document },
      },
    ])(
      'rejects $label rich documents before writes',
      async ({ document: invalid }) => {
        await createDocument(invalid).expect(400);
        expect(persistence.post.create).not.toHaveBeenCalled();
        expect(persistence.post.findUnique).not.toHaveBeenCalled();
      },
    );

    it.each([
      { marks: [{ type: 'strike' }] },
      { marks: [{ type: 'underline' }] },
      { marks: [{ type: 'textStyle' }] },
      { marks: [{ type: 'bold', attrs: { style: 'color:red' } }] },
      { marks: [{ type: 'bold' }, { type: 'bold' }] },
      { marks: [{ type: 'code' }, { type: 'bold' }] },
    ])(
      'rejects unsupported or incompatible marks $marks',
      async ({ marks }) => {
        await createDocument({
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Marked', marks }],
            },
          ],
        }).expect(400);
        expect(persistence.post.create).not.toHaveBeenCalled();
      },
    );

    it.each([
      'javascript:alert(1)',
      'data:text/html,unsafe',
      'blob:unsafe',
      'file:///tmp/test',
      'mailto:user@example.test',
      '/relative',
      '//example.test',
      'https://user:pass@example.test',
      'https://example.test/\nunsafe',
    ])('rejects unsafe or unsupported link %s', async (href) => {
      await createDocument({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Link',
                marks: [{ type: 'link', attrs: { href } }],
              },
            ],
          },
        ],
      }).expect(400);
      expect(persistence.post.create).not.toHaveBeenCalled();
    });

    it.each([
      { target: 'named-window' },
      { target: '_blank', rel: null },
      { rel: 'opener' },
      { class: 'unsafe-class' },
      { onclick: 'unsafe' },
      { title: 'x'.repeat(257) },
    ])('rejects unsafe link attributes %j', async (attrs) => {
      await createDocument({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Link',
                marks: [
                  {
                    type: 'link',
                    attrs: { href: 'https://example.test', ...attrs },
                  },
                ],
              },
            ],
          },
        ],
      }).expect(400);
      expect(persistence.post.create).not.toHaveBeenCalled();
    });

    it('rejects prototype keys from the raw document before transformation can discard them', async () => {
      const hostile: unknown = JSON.parse(
        '{"type":"doc","attrs":{"__proto__":{"injected":true}},"content":[{"type":"paragraph"}]}',
      );
      await createDocument(hostile).expect(400);
      expect(persistence.post.create).not.toHaveBeenCalled();
    });

    it('bounds serialized UTF-8 bytes, structural depth and node/mark count', async () => {
      articleStore();
      const overhead = Buffer.byteLength(JSON.stringify(textDocument('')));
      const boundary = textDocument('a'.repeat(65536 - overhead));
      await createDocument(boundary).expect(201);
      await createDocument(textDocument('a'.repeat(65537 - overhead))).expect(
        400,
      );
      await createDocument(textDocument('ی'.repeat(32768))).expect(400);
      const nested = (levels: number) => {
        let node: object = {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Nested' }],
        };
        for (let i = 0; i < levels; i++)
          node = { type: 'blockquote', content: [node] };
        return { type: 'doc', content: [node] };
      };
      await createDocument(nested(13)).expect(201);
      await createDocument(nested(14)).expect(400);
      await createDocument({
        type: 'doc',
        content: Array.from({ length: 1999 }, () => ({ type: 'paragraph' })),
      }).expect(201);
      await createDocument({
        type: 'doc',
        content: Array.from({ length: 2000 }, () => ({ type: 'paragraph' })),
      }).expect(400);
    });

    it('never parses legacy strings, preserves omitted content, and clears JSON on explicit legacy replacement', async () => {
      articleStore();
      const token = auth('AUTHOR');
      const literal =
        '{"type":"doc","content":[]} <script>literal only</script> ۱۲۳';
      const old = await request(app.getHttpServer())
        .post('/posts')
        .auth(token, { type: 'bearer' })
        .send({ title: 'Legacy', content: literal, status: 'PUBLISHED' })
        .expect(201);
      expect(old.body.content).toBe(literal);
      expect(old.body.contentDocument).toBeNull();
      const rich = await request(app.getHttpServer())
        .patch('/posts/rich-post')
        .auth(token, { type: 'bearer' })
        .send({ contentDocument: document })
        .expect(200);
      const metadata = await request(app.getHttpServer())
        .patch('/posts/rich-post')
        .auth(token, { type: 'bearer' })
        .send({ title: 'Title only' })
        .expect(200);
      expect(metadata.body.contentDocument).toEqual(document);
      expect(metadata.body.content).toBe(rich.body.content);
      const legacy = await request(app.getHttpServer())
        .patch('/posts/rich-post')
        .auth(token, { type: 'bearer' })
        .send({ content: literal })
        .expect(200);
      expect(legacy.body.content).toBe(literal);
      expect(legacy.body.contentDocument).toBeNull();
      const published = await request(app.getHttpServer())
        .get('/posts/legacy')
        .expect(200);
      expect(published.body.content).toBe(literal);
      const largeLegacy = 'x'.repeat(70000);
      const retainedPolicy = await request(app.getHttpServer())
        .patch('/posts/rich-post')
        .auth(token, { type: 'bearer' })
        .send({ content: largeLegacy })
        .expect(200);
      expect(retainedPolicy.body.content).toBe(largeLegacy);
    });

    it('rejects ambiguous content sources, explicit nulls and malformed transport JSON', async () => {
      articleStore();
      const token = auth('AUTHOR');
      for (const input of [
        { title: 'Missing' },
        { title: 'Both', content: 'text', contentDocument: document },
        { title: 'Null', content: null },
      ]) {
        await request(app.getHttpServer())
          .post('/posts')
          .auth(token, { type: 'bearer' })
          .send(input)
          .expect(400);
      }
      for (const input of [
        { content: 'text', contentDocument: document },
        { contentDocument: null },
        { content: null },
      ]) {
        await request(app.getHttpServer())
          .patch('/posts/rich-post')
          .auth(token, { type: 'bearer' })
          .send(input)
          .expect(400);
      }
      await request(app.getHttpServer())
        .post('/posts')
        .auth(token, { type: 'bearer' })
        .set('Content-Type', 'application/json')
        .send('{"title":')
        .expect(400);
      expect(persistence.post.create).not.toHaveBeenCalled();
      expect(persistence.post.update).not.toHaveBeenCalled();
    });

    it('searches derived text across inline marks without indexing JSON metadata or link attributes', async () => {
      articleStore();
      const rich = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Need', marks: [{ type: 'bold' }] },
              { type: 'text', text: 'leWord', marks: [{ type: 'italic' }] },
              {
                type: 'text',
                text: ' Guide',
                marks: [
                  {
                    type: 'link',
                    attrs: { href: 'https://example.test/secret-keyword' },
                  },
                ],
              },
            ],
          },
        ],
      };
      await request(app.getHttpServer())
        .post('/posts')
        .auth(auth('AUTHOR'), { type: 'bearer' })
        .send({
          title: 'Search article',
          status: 'PUBLISHED',
          contentDocument: rich,
        })
        .expect(201);
      const found = await request(app.getHttpServer())
        .get('/posts?search=NeedleWord')
        .expect(200);
      expect(found.body.meta.total).toBe(1);
      expect(found.body.data[0].content).toBe('NeedleWord Guide');
      for (const term of ['secret-keyword', 'paragraph']) {
        const absent = await request(app.getHttpServer())
          .get('/posts')
          .query({ search: term })
          .expect(200);
        expect(absent.body).toMatchObject({
          data: [],
          meta: { total: 0, totalPages: 0 },
        });
      }
    });

    it('documents mutually exclusive content inputs and recursive nullable response JSON', async () => {
      const response = await request(app.getHttpServer())
        .get('/api-json')
        .expect(200);
      const api: OpenAPIObject = response.body;
      const create = api.paths['/posts'].post!.requestBody;
      expect(create).toMatchObject({
        content: {
          'application/json': { schema: { oneOf: expect.any(Array) } },
        },
      });
      const post = api.components!.schemas!.PostResponseDto as SchemaObject;
      expect(post.properties!.content).toMatchObject({ type: 'string' });
      expect(post.properties!.contentDocument).toMatchObject({
        nullable: true,
      });
      expect(JSON.stringify(post.properties!.contentDocument)).toContain(
        '#/components/schemas/TiptapDocumentDto',
      );
      const nodes = api.components!.schemas!.TiptapNodeDto as SchemaObject;
      expect(nodes.properties!.content).toMatchObject({
        type: 'array',
        items: { $ref: '#/components/schemas/TiptapNodeDto' },
      });
    });

    it.each(['anonymous', 'USER'])(
      'preserves create permissions for rich content submitted by %s',
      async (role) => {
        const operation = request(app.getHttpServer()).post('/posts');
        if (role !== 'anonymous')
          operation.auth(auth(role), { type: 'bearer' });
        await operation
          .send({ title: 'Rich', contentDocument: document })
          .expect(role === 'anonymous' ? 401 : 403);
        expect(persistence.post.create).not.toHaveBeenCalled();
      },
    );
  });

  describe('ADMIN post inventory', () => {
    // Test-only rows behind the existing persistence seam, including private
    // author data so response projection is exercised rather than assumed.
    const entry = (
      id: string,
      authorId: string,
      status: string,
      day: number,
    ) => ({
      id,
      authorId,
      status,
      title: `Title ${id}`,
      slug: `slug-${id}`,
      content: 'Body excluded from inventory',
      createdAt: new Date(`2020-01-${String(day).padStart(2, '0')}T00:00:00Z`),
      updatedAt: new Date('2020-02-01'),
      publishedAt: status === 'PUBLISHED' ? new Date('2020-01-01') : null,
      author: {
        id: authorId,
        username: authorId,
        name: `Author ${authorId}`,
        avatarUrl: null,
        email: 'private@example.invalid',
        passwordHash: 'test-only-private-hash',
        disabledAt: authorId === 'author-b' ? new Date('2020-01-01') : null,
        refreshTokens: ['test-only-private-token'],
      },
    });
    const entries = [
      entry('p1', 'author-a', 'DRAFT', 1),
      entry('p4', 'author-b', 'PUBLISHED', 3),
      entry('p3', 'author-a', 'DEPRECATED', 2),
      entry('p5', 'author-b', 'DRAFT', 3),
      entry('p2', 'author-c', 'PUBLISHED', 1),
    ];
    beforeEach(() => {
      const matching = (where: { authorId?: string; status?: string } = {}) =>
        entries.filter(
          (post) =>
            (!where.authorId || post.authorId === where.authorId) &&
            (!where.status || post.status === where.status),
        );
      persistence.post.findMany.mockImplementation(async (args) => {
        const { where, orderBy, skip, take, select } = args as {
          where?: { authorId?: string; status?: string };
          orderBy: Record<string, string> | Array<Record<string, string>>;
          skip: number;
          take: number;
          select?: Record<
            string,
            boolean | { select: Record<string, boolean> }
          >;
        };
        const selected = matching(where);
        const order = Array.isArray(orderBy) ? orderBy : [orderBy];
        selected.sort((a, b) => {
          for (const clause of order)
            for (const [key, direction] of Object.entries(clause)) {
              const left = a[key as keyof typeof a];
              const right = b[key as keyof typeof b];
              const result =
                left instanceof Date && right instanceof Date
                  ? left.getTime() - right.getTime()
                  : String(left).localeCompare(String(right));
              if (result) return direction === 'desc' ? -result : result;
            }
          return 0;
        });
        return selected.slice(skip, skip + take).map((post) =>
          !select
            ? post
            : Object.fromEntries(
                Object.entries(select)
                  .filter(([, value]) => value)
                  .map(([key, value]) => [
                    key,
                    key === 'author' && typeof value === 'object'
                      ? Object.fromEntries(
                          Object.keys(value.select)
                            .filter((field) => value.select[field])
                            .map((field) => [
                              field,
                              post.author[field as keyof typeof post.author],
                            ]),
                        )
                      : post[key as keyof typeof post],
                  ]),
              ),
        );
      });
      persistence.post.count.mockImplementation(
        async (args) =>
          matching(
            (
              args as
                { where?: { authorId?: string; status?: string } } | undefined
            )?.where,
          ).length,
      );
    });

    it('lets ADMIN inventory all authors and statuses with safe author identity and action identifiers', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts/admin/inventory')
        .auth(auth(), { type: 'bearer' })
        .expect(200);
      expect(response.body.meta).toEqual({
        page: 1,
        limit: 10,
        total: 5,
        totalPages: 1,
      });
      expect(response.body.data.map((post: { id: string }) => post.id)).toEqual(
        ['p5', 'p4', 'p3', 'p2', 'p1'],
      );
      expect(
        new Set(
          response.body.data.map((post: { status: string }) => post.status),
        ),
      ).toEqual(new Set(['DRAFT', 'PUBLISHED', 'DEPRECATED']));
      expect(
        new Set(
          response.body.data.map((post: { authorId: string }) => post.authorId),
        ),
      ).toEqual(new Set(['author-a', 'author-b', 'author-c']));
      for (const post of response.body.data) {
        expect(Object.keys(post).sort()).toEqual([
          'author',
          'authorId',
          'createdAt',
          'id',
          'publishedAt',
          'slug',
          'status',
          'title',
          'updatedAt',
        ]);
        expect(post.author).toMatchObject({
          id: post.authorId,
          username: post.authorId,
          name: expect.any(String),
          avatarUrl: null,
        });
        expect(Object.keys(post.author).sort()).toEqual([
          'avatarUrl',
          'id',
          'name',
          'username',
        ]);
      }
      expect(JSON.stringify(response.body)).not.toContain('test-only-private');
    });

    it.each(['anonymous', 'USER', 'AUTHOR'])(
      'denies ADMIN inventory to %s before reading posts',
      async (role) => {
        const operation = request(app.getHttpServer()).get(
          '/posts/admin/inventory',
        );
        if (role !== 'anonymous')
          operation.auth(auth(role), { type: 'bearer' });
        await operation.expect(role === 'anonymous' ? 401 : 403);
        expect(persistence.post.findMany).not.toHaveBeenCalled();
        expect(persistence.post.count).not.toHaveBeenCalled();
      },
    );

    it.each([
      { page: 1, ids: ['p5', 'p4'] },
      { page: 2, ids: ['p3', 'p2'] },
      { page: 3, ids: ['p1'] },
      { page: 4, ids: [] },
    ])(
      'paginates the complete inventory at page $page with deterministic ties',
      async ({ page, ids }) => {
        const response = await request(app.getHttpServer())
          .get('/posts/admin/inventory')
          .query({ page, limit: 2 })
          .auth(auth(), { type: 'bearer' })
          .expect(200);
        expect(
          response.body.data.map((post: { id: string }) => post.id),
        ).toEqual(ids);
        expect(response.body.meta).toEqual({
          page,
          limit: 2,
          total: 5,
          totalPages: 3,
        });
      },
    );

    it('returns an empty inventory with zero pages when no posts exist', async () => {
      persistence.post.findMany.mockResolvedValue([]);
      persistence.post.count.mockResolvedValue(0);
      const response = await request(app.getHttpServer())
        .get('/posts/admin/inventory')
        .auth(auth(), { type: 'bearer' })
        .expect(200);
      expect(response.body).toEqual({
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });
    });

    it('reuses pagination bounds and rejects filters that are outside inventory scope', async () => {
      for (const query of [
        'page=0',
        'page=1.5',
        'page=wrong',
        'limit=0',
        'limit=51',
        'status=DRAFT',
        'author=author-a',
        'search=Title',
        'sort=oldest',
      ]) {
        await request(app.getHttpServer())
          .get(`/posts/admin/inventory?${query}`)
          .auth(auth(), { type: 'bearer' })
          .expect(400);
      }
      expect(persistence.post.findMany).not.toHaveBeenCalled();
      expect(persistence.post.count).not.toHaveBeenCalled();
    });

    it('does not reserve the existing public article slug admin', async () => {
      persistence.post.findFirst.mockResolvedValue({
        id: 'public-admin',
        slug: 'admin',
        title: 'Public admin article',
        status: 'PUBLISHED',
      });
      const response = await request(app.getHttpServer())
        .get('/posts/admin')
        .expect(200);
      expect(response.body.id).toBe('public-admin');
      expect(persistence.post.findMany).not.toHaveBeenCalled();
    });

    it('documents inventory authorization, pagination and exact safe summary fields', async () => {
      const response = await request(app.getHttpServer())
        .get('/api-json')
        .expect(200);
      const document: OpenAPIObject = response.body;
      const operation = document.paths['/posts/admin/inventory'].get!;
      expect(operation.security).toEqual([{ 'access-token': [] }]);
      expect(Object.keys(operation.responses)).toEqual(
        expect.arrayContaining(['200', '400', '401', '403']),
      );
      expect(
        operation
          .parameters!.map((parameter) =>
            'name' in parameter ? parameter.name : '',
          )
          .sort(),
      ).toEqual(['limit', 'page']);
      expect(operation.responses['200']).toMatchObject({
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AdminPostsResponseDto' },
          },
        },
      });
      const envelope = document.components!.schemas!
        .AdminPostsResponseDto as SchemaObject;
      expect(envelope.properties!.data).toMatchObject({
        type: 'array',
        items: { $ref: '#/components/schemas/AdminPostSummaryResponseDto' },
      });
      expect(envelope.properties!.meta).toMatchObject({
        $ref: '#/components/schemas/PaginationMetaResponseDto',
      });
      const summary = document.components!.schemas!
        .AdminPostSummaryResponseDto as SchemaObject;
      expect(Object.keys(summary.properties!).sort()).toEqual([
        'author',
        'authorId',
        'createdAt',
        'id',
        'publishedAt',
        'slug',
        'status',
        'title',
        'updatedAt',
      ]);
      expect(summary.properties!.status).toMatchObject({
        enum: ['DRAFT', 'PUBLISHED', 'DEPRECATED'],
      });
      expect(summary.properties!.author).toMatchObject({
        $ref: '#/components/schemas/AuthorResponseDto',
      });
      const author = document.components!.schemas!
        .AuthorResponseDto as SchemaObject;
      expect(Object.keys(author.properties!).sort()).toEqual([
        'avatarUrl',
        'id',
        'name',
        'username',
      ]);
    });
  });

  describe('Own-post status filters', () => {
    // Test-only posts behind the existing substituted persistence boundary.
    const row = (
      id: string,
      status: string,
      day: number,
      authorId = 'user-1',
    ) => ({
      id,
      status,
      authorId,
      title: id,
      slug: id,
      content: 'Test article',
      publishedAt:
        status === 'PUBLISHED'
          ? new Date(`2020-01-${String(day).padStart(2, '0')}T00:00:00Z`)
          : null,
      createdAt: new Date(`2020-01-${String(day).padStart(2, '0')}T00:00:00Z`),
      updatedAt: new Date('2020-02-01'),
    });
    const rows = [
      row('draft-old', 'DRAFT', 1),
      row('foreign-draft', 'DRAFT', 10, 'other-author'),
      row('draft-new', 'DRAFT', 9),
      row('published-old', 'PUBLISHED', 2),
      row('deprecated', 'DEPRECATED', 6),
      row('published-middle', 'PUBLISHED', 4),
      row('draft-middle', 'DRAFT', 5),
      row('published-new', 'PUBLISHED', 8),
      row('foreign-published', 'PUBLISHED', 11, 'other-author'),
    ];
    beforeEach(() => {
      const matches = (where: { authorId?: string; status?: string }) =>
        rows.filter(
          (row) =>
            (!where.authorId || row.authorId === where.authorId) &&
            (!where.status || row.status === where.status),
        );
      persistence.post.findMany.mockImplementation(async (args) => {
        const { where, orderBy, skip, take } = args as {
          where: { authorId?: string; status?: string };
          orderBy: { createdAt?: string };
          skip: number;
          take: number;
        };
        const selected = matches(where);
        if (orderBy.createdAt)
          selected.sort(
            (a, b) =>
              (orderBy.createdAt === 'desc' ? -1 : 1) *
              (a.createdAt.getTime() - b.createdAt.getTime()),
          );
        return selected.slice(skip, skip + take);
      });
      persistence.post.count.mockImplementation(
        async (args) =>
          matches(
            (args as { where: { authorId?: string; status?: string } }).where,
          ).length,
      );
    });

    it('filters owned DRAFT posts before pagination and counts only matching posts', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts/mine?status=DRAFT&page=2&limit=2')
        .auth(auth('AUTHOR'), { type: 'bearer' })
        .expect(200);
      expect(response.body.data.map((post: { id: string }) => post.id)).toEqual(
        ['draft-old'],
      );
      expect(response.body.meta).toEqual({
        page: 2,
        limit: 2,
        total: 3,
        totalPages: 2,
      });
    });

    it.each([
      { status: 'DRAFT', ids: ['draft-new', 'draft-middle'] },
      { status: 'PUBLISHED', ids: ['published-new', 'published-middle'] },
    ])(
      'returns owned $status posts in existing newest-created order',
      async ({ status, ids }) => {
        const response = await request(app.getHttpServer())
          .get('/posts/mine')
          .query({ status, limit: 2 })
          .auth(auth('AUTHOR'), { type: 'bearer' })
          .expect(200);
        expect(
          response.body.data.map((post: { id: string }) => post.id),
        ).toEqual(ids);
        expect(response.body.meta).toEqual({
          page: 1,
          limit: 2,
          total: 3,
          totalPages: 2,
        });
      },
    );

    it('includes owned DEPRECATED posts when status is omitted and retains default pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts/mine')
        .auth(auth('AUTHOR'), { type: 'bearer' })
        .expect(200);
      expect(response.body.data.map((post: { id: string }) => post.id)).toEqual(
        [
          'draft-new',
          'published-new',
          'deprecated',
          'draft-middle',
          'published-middle',
          'published-old',
          'draft-old',
        ],
      );
      expect(response.body.meta).toEqual({
        page: 1,
        limit: 10,
        total: 7,
        totalPages: 1,
      });
    });

    it.each([
      { status: 'DRAFT', page: 3, limit: 1, ids: ['draft-old'], totalPages: 3 },
      { status: 'DRAFT', page: 4, limit: 1, ids: [], totalPages: 3 },
      {
        status: 'PUBLISHED',
        page: 2,
        limit: 2,
        ids: ['published-old'],
        totalPages: 2,
      },
      { status: 'PUBLISHED', page: 3, limit: 2, ids: [], totalPages: 2 },
    ])(
      'preserves page $page boundaries for $status with limit $limit',
      async ({ status, page, limit, ids, totalPages }) => {
        const response = await request(app.getHttpServer())
          .get('/posts/mine')
          .query({ status, page, limit })
          .auth(auth('AUTHOR'), { type: 'bearer' })
          .expect(200);
        expect(
          response.body.data.map((post: { id: string }) => post.id),
        ).toEqual(ids);
        expect(response.body.meta).toEqual({
          page,
          limit,
          total: 3,
          totalPages,
        });
      },
    );

    it.each(['AUTHOR', 'ADMIN'])(
      'keeps %s filtering scoped to the current owner despite an author query parameter',
      async (role) => {
        const response = await request(app.getHttpServer())
          .get('/posts/mine?status=DRAFT&author=other-author')
          .auth(auth(role), { type: 'bearer' })
          .expect(200);
        expect(
          response.body.data.map((post: { id: string }) => post.id),
        ).toEqual(['draft-new', 'draft-middle', 'draft-old']);
        expect(response.body.meta.total).toBe(3);
        expect(
          response.body.data.every(
            (post: { authorId: string }) => post.authorId === safeUser.id,
          ),
        ).toBe(true);
      },
    );

    it('returns zero filtered pages for an owner with no matching posts', async () => {
      const token = jwt.sign({
        sub: 'empty-author',
        sid: 'empty-session',
        email: 'empty@example.com',
        role: 'AUTHOR',
      });
      persistence.refreshToken.findUnique.mockResolvedValue({
        userId: 'empty-author',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60000),
        user: { ...safeUser, id: 'empty-author', role: { name: 'AUTHOR' } },
      });
      const response = await request(app.getHttpServer())
        .get('/posts/mine?status=DRAFT')
        .auth(token, { type: 'bearer' })
        .expect(200);
      expect(response.body).toEqual({
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });
    });

    it.each(['DEPRECATED', 'draft', 'PUBLISHED ', 'UNKNOWN', ''])(
      'rejects unsupported own-post status %j before querying posts',
      async (status) => {
        await request(app.getHttpServer())
          .get('/posts/mine')
          .query({ status })
          .auth(auth('AUTHOR'), { type: 'bearer' })
          .expect(400);
        expect(persistence.post.findMany).not.toHaveBeenCalled();
        expect(persistence.post.count).not.toHaveBeenCalled();
      },
    );

    it('rejects repeated status values and preserves existing pagination validation', async () => {
      for (const query of [
        'status=DRAFT&status=PUBLISHED',
        'status=DRAFT&page=0',
        'status=DRAFT&page=1.5',
        'status=DRAFT&page=wrong',
        'status=PUBLISHED&limit=0',
        'status=PUBLISHED&limit=51',
      ]) {
        await request(app.getHttpServer())
          .get(`/posts/mine?${query}`)
          .auth(auth('AUTHOR'), { type: 'bearer' })
          .expect(400);
      }
      expect(persistence.post.findMany).not.toHaveBeenCalled();
      expect(persistence.post.count).not.toHaveBeenCalled();
    });

    it.each(['anonymous', 'USER'])(
      'does not expose own-post filtering to %s',
      async (role) => {
        const operation = request(app.getHttpServer()).get(
          '/posts/mine?status=DRAFT',
        );
        if (role !== 'anonymous')
          operation.auth(auth(role), { type: 'bearer' });
        await operation.expect(role === 'anonymous' ? 401 : 403);
        expect(persistence.post.findMany).not.toHaveBeenCalled();
        expect(persistence.post.count).not.toHaveBeenCalled();
      },
    );

    it('documents the optional own-post status enum and keeps the public feed contract unchanged', async () => {
      const response = await request(app.getHttpServer())
        .get('/api-json')
        .expect(200);
      const document: OpenAPIObject = response.body;
      const mine = document.paths['/posts/mine'].get!;
      expect(mine.parameters).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'status',
            required: false,
            schema: { type: 'string', enum: ['DRAFT', 'PUBLISHED'] },
          }),
        ]),
      );
      expect(mine.responses['400']).toBeDefined();
      expect(mine.responses['200']).toMatchObject({
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/MyPostsResponseDto' },
          },
        },
      });
      expect(document.paths['/posts'].get!.parameters).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'status' })]),
      );
    });
  });

  describe('Author deactivation', () => {
    // Stateful persistence test double at the existing I/O seam; no live resources.
    const managedAuthor = () => {
      const author = {
        ...safeUser,
        id: 'author-1',
        email: 'author@example.com',
        role: { name: 'AUTHOR' },
        disabledAt: null as Date | null,
      };
      const sessions: Array<{
        id: string;
        userId: string;
        tokenHash: string;
        expiresAt: Date;
        revokedAt: Date | null;
      }> = [];
      const projection = (select: unknown) => {
        const { disabledAt, ...publicUser } = author;
        return (select as { disabledAt?: boolean })?.disabledAt
          ? { ...publicUser, disabledAt }
          : publicUser;
      };
      persistence.user.findUnique.mockImplementation(async (args) => {
        const query = args as {
          where: { id?: string; email?: string };
          select?: unknown;
        };
        if (query.where.id !== author.id && query.where.email !== author.email)
          return null;
        return query.select
          ? projection(query.select)
          : { ...author, passwordHash };
      });
      persistence.user.findMany.mockImplementation(async (args) => [
        projection((args as { select?: unknown }).select),
      ]);
      persistence.user.updateMany.mockImplementation(async (args) => {
        const { where, data } = args as {
          where: {
            id: string;
            disabledAt: null;
            role: { is: { name: string } };
          };
          data: { disabledAt: Date };
        };
        if (
          author.id !== where.id ||
          author.role.name !== where.role.is.name ||
          author.disabledAt !== where.disabledAt
        )
          return { count: 0 };
        author.disabledAt = data.disabledAt;
        return { count: 1 };
      });
      persistence.refreshToken.create.mockImplementation(async (args) => {
        const { data } = args as {
          data: { userId: string; tokenHash: string; expiresAt: Date };
        };
        const session = {
          ...data,
          id: `author-session-${sessions.length + 1}`,
          revokedAt: null,
        };
        sessions.push(session);
        return session;
      });
      persistence.refreshToken.findUnique.mockImplementation(async (args) => {
        const { where } = args as { where: { id: string } };
        if (where.id === 'session-1')
          return {
            userId: safeUser.id,
            revokedAt: null,
            expiresAt: new Date(Date.now() + 60000),
            user: { ...safeUser, role: { name: 'ADMIN' } },
          };
        const session = sessions.find((session) => session.id === where.id);
        return session ? { ...session, user: { ...author } } : null;
      });
      persistence.refreshToken.findMany.mockImplementation(async () =>
        sessions.filter((session) => !session.revokedAt),
      );
      persistence.refreshToken.updateMany.mockImplementation(async (args) => {
        const { where, data } = args as {
          where: { userId: string; revokedAt: null };
          data: { revokedAt: Date };
        };
        const active = sessions.filter(
          (session) =>
            session.userId === where.userId &&
            session.revokedAt === where.revokedAt,
        );
        for (const session of active) session.revokedAt = data.revokedAt;
        return { count: active.length };
      });
      persistence.$transaction.mockImplementation(async (run) => {
        const before = structuredClone(author);
        const oldSessions = structuredClone(sessions);
        try {
          return await run(persistence);
        } catch (error) {
          Object.assign(author, before);
          sessions.splice(0, sessions.length, ...oldSessions);
          throw error;
        }
      });
      return { author, sessions };
    };

    it('lets ADMIN deactivate an AUTHOR and invalidates issued sessions and future logins', async () => {
      const admin = auth();
      const { author } = managedAuthor();
      const first = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: author.email, password: 'CorrectPassword123!' })
        .expect(200);
      const second = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: author.email, password: 'CorrectPassword123!' })
        .expect(200);
      await request(app.getHttpServer())
        .get('/auth/me')
        .auth(first.body.accessToken, { type: 'bearer' })
        .expect(200);
      const disabled = await request(app.getHttpServer())
        .patch('/admin/authors/author-1/deactivate')
        .auth(admin, { type: 'bearer' })
        .expect(200);
      expect(disabled.body).toMatchObject({
        id: author.id,
        role: { name: 'AUTHOR' },
        disabledAt: expect.any(String),
      });
      expect(disabled.body).not.toHaveProperty('passwordHash');
      for (const login of [first, second]) {
        await request(app.getHttpServer())
          .get('/auth/me')
          .auth(login.body.accessToken, { type: 'bearer' })
          .expect(401);
        await request(app.getHttpServer())
          .post('/auth/refresh')
          .send({ refreshToken: login.body.refreshToken })
          .expect(401);
      }
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: author.email, password: 'CorrectPassword123!' })
        .expect(401);
      expect(persistence.user.delete).not.toHaveBeenCalled();
      expect(persistence.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: author.id, revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('shows enabled and disabled AUTHOR state truthfully in existing ADMIN list and detail responses', async () => {
      const admin = auth();
      managedAuthor();
      const enabled = await request(app.getHttpServer())
        .get('/admin/users/author-1')
        .auth(admin, { type: 'bearer' })
        .expect(200);
      expect(enabled.body.disabledAt).toBeNull();
      const disabled = await request(app.getHttpServer())
        .patch('/admin/authors/author-1/deactivate')
        .auth(admin, { type: 'bearer' })
        .expect(200);
      const detail = await request(app.getHttpServer())
        .get('/admin/users/author-1')
        .auth(admin, { type: 'bearer' })
        .expect(200);
      const list = await request(app.getHttpServer())
        .get('/admin/users')
        .auth(admin, { type: 'bearer' })
        .expect(200);
      expect(detail.body.disabledAt).toBe(disabled.body.disabledAt);
      expect(list.body[0].disabledAt).toBe(disabled.body.disabledAt);
      expect(detail.body).not.toHaveProperty('passwordHash');
    });

    it.each(['anonymous', 'USER', 'AUTHOR'])(
      'denies AUTHOR deactivation to %s',
      async (role) => {
        const operation = request(app.getHttpServer()).patch(
          '/admin/authors/author-1/deactivate',
        );
        if (role !== 'anonymous')
          operation.auth(auth(role), { type: 'bearer' });
        await operation.expect(role === 'anonymous' ? 401 : 403);
        expect(persistence.$transaction).not.toHaveBeenCalled();
        expect(persistence.user.updateMany).not.toHaveBeenCalled();
        expect(persistence.refreshToken.updateMany).not.toHaveBeenCalled();
      },
    );

    it.each(['USER', 'ADMIN'])(
      'rejects deactivation of a %s target without changing it or its sessions',
      async (role) => {
        const admin = auth();
        const { author } = managedAuthor();
        author.role.name = role;
        await request(app.getHttpServer())
          .patch('/admin/authors/author-1/deactivate')
          .auth(admin, { type: 'bearer' })
          .expect(409);
        expect(author.disabledAt).toBeNull();
        expect(persistence.refreshToken.updateMany).not.toHaveBeenCalled();
        expect(persistence.user.delete).not.toHaveBeenCalled();
      },
    );

    it('returns 404 for an unknown deactivation target', async () => {
      const admin = auth();
      const { author } = managedAuthor();
      await request(app.getHttpServer())
        .patch('/admin/authors/missing/deactivate')
        .auth(admin, { type: 'bearer' })
        .expect(404);
      expect(author.disabledAt).toBeNull();
      expect(persistence.refreshToken.updateMany).not.toHaveBeenCalled();
    });

    it('preserves the original disabled timestamp and revoked sessions on repeated deactivation', async () => {
      const admin = auth();
      const { author, sessions } = managedAuthor();
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: author.email, password: 'CorrectPassword123!' })
        .expect(200);
      const first = await request(app.getHttpServer())
        .patch('/admin/authors/author-1/deactivate')
        .auth(admin, { type: 'bearer' })
        .expect(200);
      const revokedAt = sessions[0].revokedAt!.toISOString();
      const second = await request(app.getHttpServer())
        .patch('/admin/authors/author-1/deactivate')
        .auth(admin, { type: 'bearer' })
        .expect(200);
      expect(second.body.disabledAt).toBe(first.body.disabledAt);
      expect(sessions[0].revokedAt!.toISOString()).toBe(revokedAt);
      expect(persistence.user.delete).not.toHaveBeenCalled();
    });

    it('revokes lingering sessions even when an AUTHOR was already disabled', async () => {
      const admin = auth();
      const { author, sessions } = managedAuthor();
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: author.email, password: 'CorrectPassword123!' })
        .expect(200);
      author.disabledAt = new Date('2026-01-01T00:00:00.000Z');
      const response = await request(app.getHttpServer())
        .patch('/admin/authors/author-1/deactivate')
        .auth(admin, { type: 'bearer' })
        .expect(200);
      expect(response.body.disabledAt).toBe('2026-01-01T00:00:00.000Z');
      expect(sessions[0].revokedAt).toEqual(expect.any(Date));
    });

    it('rolls back deactivation if session revocation cannot commit', async () => {
      const admin = auth();
      const { author } = managedAuthor();
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: author.email, password: 'CorrectPassword123!' })
        .expect(200);
      persistence.refreshToken.updateMany.mockRejectedValueOnce(
        new InternalServerErrorException('Test-only persistence failure'),
      );
      await request(app.getHttpServer())
        .patch('/admin/authors/author-1/deactivate')
        .auth(admin, { type: 'bearer' })
        .expect(500);
      const detail = await request(app.getHttpServer())
        .get('/admin/users/author-1')
        .auth(admin, { type: 'bearer' })
        .expect(200);
      expect(detail.body.disabledAt).toBeNull();
      await request(app.getHttpServer())
        .get('/auth/me')
        .auth(login.body.accessToken, { type: 'bearer' })
        .expect(200);
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: login.body.refreshToken })
        .expect(200);
    });

    it('preserves the AUTHOR record, published post and ownership while writing only account status', async () => {
      const admin = auth();
      const { author } = managedAuthor();
      const post = {
        id: 'retained-post',
        slug: 'retained-post',
        title: 'Retained content',
        content: 'Existing published article with media',
        status: 'PUBLISHED',
        authorId: author.id,
        author: { id: author.id, name: author.name },
        categories: [],
        tags: [],
      };
      persistence.post.findFirst.mockResolvedValue(post);
      const before = await request(app.getHttpServer())
        .get('/posts/retained-post')
        .expect(200);
      await request(app.getHttpServer())
        .patch('/admin/authors/author-1/deactivate')
        .auth(admin, { type: 'bearer' })
        .expect(200);
      const after = await request(app.getHttpServer())
        .get('/posts/retained-post')
        .expect(200);
      const retained = await request(app.getHttpServer())
        .get('/admin/users/author-1')
        .auth(admin, { type: 'bearer' })
        .expect(200);
      expect(after.body).toEqual(before.body);
      expect(after.body.authorId).toBe(author.id);
      expect(retained.body.id).toBe(author.id);
      expect(persistence.user.delete).not.toHaveBeenCalled();
      expect(persistence.user.updateMany).toHaveBeenCalledWith({
        where: {
          id: author.id,
          role: { is: { name: 'AUTHOR' } },
          disabledAt: null,
        },
        data: { disabledAt: expect.any(Date) },
      });
      expect(persistence.user.update).not.toHaveBeenCalled();
    });

    it('keeps disabled state in role-change responses and enabled state in author-creation responses', async () => {
      const admin = auth();
      const { author } = managedAuthor();
      author.disabledAt = new Date('2026-01-01T00:00:00.000Z');
      persistence.user.update.mockResolvedValue({ ...author });
      const changed = await request(app.getHttpServer())
        .patch('/admin/users/author-1/role')
        .auth(admin, { type: 'bearer' })
        .send({ role: 'AUTHOR' })
        .expect(200);
      expect(changed.body.disabledAt).toBe(author.disabledAt.toISOString());
      persistence.user.findFirst.mockResolvedValue(null);
      persistence.user.create.mockResolvedValue({
        ...author,
        id: 'new-author',
        disabledAt: null,
      });
      const created = await request(app.getHttpServer())
        .post('/admin/authors')
        .auth(admin, { type: 'bearer' })
        .send({
          name: 'New Author',
          email: 'new-author@example.com',
          password: 'AuthorInitial123!',
        })
        .expect(201);
      expect(created.body.disabledAt).toBeNull();
      expect(persistence.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ select: userAdminSelect }),
      );
    });

    it('documents deactivation and ADMIN disabled-state responses without expanding the public user schema', async () => {
      const response = await request(app.getHttpServer())
        .get('/api-json')
        .expect(200);
      const document: OpenAPIObject = response.body;
      const operation = document.paths['/admin/authors/{id}/deactivate'].patch!;
      expect(operation.security).toEqual([{ 'access-token': [] }]);
      expect(Object.keys(operation.responses)).toEqual(
        expect.arrayContaining(['200', '401', '403', '404', '409']),
      );
      const adminSchema = document.components!.schemas!
        .AdminUserResponseDto as SchemaObject;
      expect(adminSchema.required).toContain('disabledAt');
      expect(adminSchema.properties!.disabledAt).toMatchObject({
        type: 'string',
        format: 'date-time',
        nullable: true,
      });
      const publicSchema = document.components!.schemas!
        .UserResponseDto as SchemaObject;
      expect(publicSchema.properties).not.toHaveProperty('disabledAt');
      for (const [path, verb, status] of [
        ['/admin/users', 'get', '200'],
        ['/admin/users/{id}', 'get', '200'],
        ['/admin/users/{id}/role', 'patch', '200'],
        ['/admin/authors', 'post', '201'],
      ] as const) {
        const schema = document.paths[path][verb]!.responses[status];
        expect(JSON.stringify(schema)).toContain(
          '#/components/schemas/AdminUserResponseDto',
        );
      }
    });
  });

  describe('Users and Roles', () => {
    it.each(['anonymous', 'USER', 'AUTHOR'])(
      'denies AUTHOR creation to %s',
      async (role) => {
        const operation = request(app.getHttpServer()).post('/admin/authors');
        if (role !== 'anonymous')
          operation.auth(auth(role), { type: 'bearer' });
        await operation
          .send({
            name: 'New Author',
            email: 'new-author@example.com',
            password: 'AuthorInitial123!',
          })
          .expect(role === 'anonymous' ? 401 : 403);
        expect(persistence.user.create).not.toHaveBeenCalled();
        expect(persistence.role.findUnique).not.toHaveBeenCalled();
      },
    );

    it('rejects invalid AUTHOR fields and reuses the registration password policy', async () => {
      const valid = {
        name: 'New Author',
        email: 'new-author@example.com',
        password: 'AuthorInitial123!',
      };
      for (const input of [
        {},
        { email: valid.email, password: valid.password },
        { ...valid, name: '' },
        { ...valid, name: '   ' },
        { ...valid, name: null },
        { ...valid, name: 42 },
        { ...valid, email: 'invalid' },
        { ...valid, email: ' new-author@example.com ' },
        { name: valid.name, email: valid.email },
        ...[
          'Ab1!',
          'abcdefgh!',
          '12345678!',
          'Abcdefg1',
          'Valid 123!',
          'Valid123!\n',
          'رمزValid123!',
          'Valid123!é',
        ].map((password) => ({ ...valid, password })),
        { ...valid, password: null },
        { ...valid, password: 42 },
        { ...valid, role: 'ADMIN' },
        { ...valid, roleId: 'admin-id' },
        { ...valid, username: 'caller-choice' },
        { ...valid, confirmPassword: valid.password },
      ]) {
        const rejected = await request(app.getHttpServer())
          .post('/admin/authors')
          .auth(auth(), { type: 'bearer' })
          .send(input)
          .expect(400);
        expect(JSON.stringify(rejected.body)).not.toContain(valid.password);
      }
      expect(persistence.user.create).not.toHaveBeenCalled();
      expect(persistence.refreshToken.create).not.toHaveBeenCalled();
      expect(persistence.emailVerificationToken.create).not.toHaveBeenCalled();
    });

    it('sanitizes AUTHOR persistence failures that could contain credential diagnostics', async () => {
      persistence.user.create.mockRejectedValue(
        new Error('test-only-passwordHash-diagnostic'),
      );
      const failure = await request(app.getHttpServer())
        .post('/admin/authors')
        .auth(auth(), { type: 'bearer' })
        .send({
          name: 'New Author',
          email: 'new-author@example.com',
          password: 'AuthorInitial123!',
        })
        .expect(500);
      expect(failure.body.message).toBe('Author creation failed.');
      expect(JSON.stringify(failure.body)).not.toContain(
        'test-only-passwordHash-diagnostic',
      );
      expect(persistence.refreshToken.create).not.toHaveBeenCalled();
    });

    it('enforces USER-to-AUTHOR rejection at persistence time after a concurrent role change', async () => {
      persistence.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: { name: 'ADMIN' },
      });
      persistence.user.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError(
          'test-only-missing-conditional-update',
          { code: 'P2025', clientVersion: 'test' },
        ),
      );
      await request(app.getHttpServer())
        .patch('/admin/users/user-1/role')
        .auth(auth(), { type: 'bearer' })
        .send({ role: 'AUTHOR' })
        .expect(409);
      expect(persistence.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1', NOT: { role: { is: { name: 'USER' } } } },
        }),
      );
    });

    it('documents the ADMIN author request, safe response and all requested errors without password examples', async () => {
      const response = await request(app.getHttpServer())
        .get('/api-json')
        .expect(200);
      const document: OpenAPIObject = response.body;
      const operation = document.paths['/admin/authors'].post!;
      expect(operation.security).toEqual([{ 'access-token': [] }]);
      expect(Object.keys(operation.responses)).toEqual(
        expect.arrayContaining(['201', '400', '401', '403', '409']),
      );
      const dto = document.components!.schemas!.CreateAuthorDto as SchemaObject;
      expect(dto.required).toEqual(
        expect.arrayContaining(['name', 'email', 'password']),
      );
      expect(Object.keys(dto.properties!).sort()).toEqual([
        'email',
        'name',
        'password',
      ]);
      expect(dto.properties!.password).toMatchObject({
        writeOnly: true,
        minLength: 8,
        pattern: expect.any(String),
      });
      expect(dto.properties!.password).not.toHaveProperty('example');
      expect(operation.requestBody).not.toHaveProperty(
        'content.application/json.example',
      );
      expect(operation.responses['201']).toMatchObject({
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AdminUserResponseDto' },
          },
        },
      });
      const user = document.components!.schemas!
        .UserResponseDto as SchemaObject;
      expect(user.properties).not.toHaveProperty('password');
      expect(user.properties).not.toHaveProperty('passwordHash');
    });

    it('does not promote an existing USER to AUTHOR through role administration', async () => {
      await request(app.getHttpServer())
        .patch('/admin/users/user-1/role')
        .auth(auth(), { type: 'bearer' })
        .send({ role: 'AUTHOR' })
        .expect(409);
      expect(persistence.user.update).not.toHaveBeenCalled();
    });
    it('rejects a case-variant existing email before AUTHOR creation', async () => {
      persistence.user.findFirst.mockResolvedValue({ id: safeUser.id });
      await request(app.getHttpServer())
        .post('/admin/authors')
        .auth(auth(), { type: 'bearer' })
        .send({
          name: 'New Author',
          email: 'READER@example.com',
          password: 'AuthorInitial123!',
        })
        .expect(409);
      expect(persistence.user.create).not.toHaveBeenCalled();
      expect(persistence.user.update).not.toHaveBeenCalled();
    });

    it('rejects duplicate AUTHOR email safely without promoting or overwriting the existing account', async () => {
      persistence.user.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError(
          'test-only-private-database-detail',
          { code: 'P2002', clientVersion: 'test' },
        ),
      );
      const response = await request(app.getHttpServer())
        .post('/admin/authors')
        .auth(auth(), { type: 'bearer' })
        .send({
          name: 'New Author',
          email: safeUser.email,
          password: 'AuthorInitial123!',
        })
        .expect(409);
      expect(JSON.stringify(response.body)).not.toContain(
        'test-only-private-database-detail',
      );
      expect(persistence.user.update).not.toHaveBeenCalled();
      expect(persistence.refreshToken.create).not.toHaveBeenCalled();
      expect(persistence.emailVerificationToken.create).not.toHaveBeenCalled();
    });

    it('lets ADMIN create an AUTHOR who immediately signs in with the initial password', async () => {
      const initialPassword = 'AuthorInitial123!'; // Test-only credential.
      let stored: { passwordHash: string } | undefined;
      const author = {
        ...safeUser,
        id: 'created-author',
        email: 'author@example.com',
        name: 'New Author',
        role: { name: 'AUTHOR' },
      };
      persistence.user.create.mockImplementation(async (args) => {
        stored = (args as { data: { passwordHash: string } }).data;
        return author;
      });
      const created = await request(app.getHttpServer())
        .post('/admin/authors')
        .auth(auth(), { type: 'bearer' })
        .send({
          name: '  New Author  ',
          email: author.email,
          password: initialPassword,
        })
        .expect(201);
      expect(created.body).toMatchObject({
        id: author.id,
        name: author.name,
        email: author.email,
        role: { name: 'AUTHOR' },
      });
      expect(created.body).not.toHaveProperty('password');
      expect(created.body).not.toHaveProperty('passwordHash');
      expect(created.body).not.toHaveProperty('accessToken');
      expect(created.body).not.toHaveProperty('refreshToken');
      expect(await argon2.verify(stored!.passwordHash, initialPassword)).toBe(
        true,
      );
      expect(persistence.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          select: userAdminSelect,
          data: expect.objectContaining({
            name: author.name,
            email: author.email,
            roleId: 'role-id',
            username: expect.stringMatching(/^user_[a-f0-9]{64}$/),
          }),
        }),
      );
      expect(persistence.role.findUnique).toHaveBeenCalledWith({
        where: { name: 'AUTHOR' },
      });
      expect(persistence.emailVerificationToken.create).not.toHaveBeenCalled();
      expect(mail.sendEmailVerification).not.toHaveBeenCalled();
      expect(mail.sendPasswordReset).not.toHaveBeenCalled();
      expect(persistence.refreshToken.create).not.toHaveBeenCalled();
      persistence.user.findUnique.mockImplementation(async (args) =>
        (args as { select?: unknown }).select
          ? author
          : { ...author, disabledAt: null, passwordHash: stored!.passwordHash },
      );
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: author.email, password: initialPassword })
        .expect(200);
      expect(jwt.verify(login.body.accessToken)).toMatchObject({
        sub: author.id,
        role: 'AUTHOR',
        sid: 'session-1',
      });
      persistence.refreshToken.findUnique.mockResolvedValue({
        userId: author.id,
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60000),
        user: author,
      });
      const me = await request(app.getHttpServer())
        .get('/auth/me')
        .auth(login.body.accessToken, { type: 'bearer' })
        .expect(200);
      expect(me.body).toMatchObject({
        id: author.id,
        role: { name: 'AUTHOR' },
      });
      expect(me.body).not.toHaveProperty('passwordHash');
    });

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
        select: userAdminSelect,
        orderBy: { createdAt: 'desc' },
      });
      expect(persistence.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: userAdminSelect,
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
        .send({ role: 'ADMIN' })
        .expect(200);
      expect(persistence.role.findUnique).toHaveBeenCalledWith({
        where: { name: 'ADMIN' },
      });
      expect(persistence.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { roleId: 'role-id' },
        select: userAdminSelect,
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
        .send({ role: 'ADMIN' })
        .expect(500);
      expect(persistence.user.update).not.toHaveBeenCalled();
    });
  });

  describe('Auth and Sessions', () => {
    it('prevents shared caching for case-insensitive auth routes', async () => {
      const login = await request(app.getHttpServer())
        .post('/AUTH/login')
        .send({ email: safeUser.email, password: 'CorrectPassword123!' })
        .expect(200);
      expect(login.headers['cache-control']).toBe('private, no-store');
      const refresh = await request(app.getHttpServer())
        .post('/Auth/refresh')
        .send({ refreshToken: 'invalid' })
        .expect(401);
      expect(refresh.headers['cache-control']).toBe('private, no-store');
    });
    it('invalidates issued access and refresh tokens after logout and rejects disabled login/refresh', async () => {
      let revoked = false;
      let disabled = false;
      let tokenHash = '';
      persistence.user.findUnique.mockImplementation(async (args) => ({
        ...safeUser,
        disabledAt: disabled ? new Date() : null,
        ...((args as { select?: unknown }).select ? {} : { passwordHash }),
      }));
      persistence.refreshToken.create.mockImplementation(async (args) => {
        tokenHash = (args as { data: { tokenHash: string } }).data.tokenHash;
        return { id: 's' };
      });
      persistence.refreshToken.findUnique.mockImplementation(async () => ({
        userId: safeUser.id,
        revokedAt: revoked ? new Date() : null,
        expiresAt: new Date(Date.now() + 60000),
        user: { ...safeUser, disabledAt: disabled ? new Date() : null },
      }));
      persistence.refreshToken.findMany.mockImplementation(async () =>
        revoked ? [] : [{ id: 's', tokenHash }],
      );
      persistence.refreshToken.update.mockImplementation(async () => {
        revoked = true;
        return {};
      });
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: safeUser.email, password: 'CorrectPassword123!' })
        .expect(200);
      await request(app.getHttpServer())
        .get('/auth/me')
        .auth(login.body.accessToken, { type: 'bearer' })
        .expect(200);
      disabled = true;
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: safeUser.email, password: 'CorrectPassword123!' })
        .expect(401);
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: login.body.refreshToken })
        .expect(401);
      disabled = false;
      const refreshed = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: login.body.refreshToken })
        .expect(200);
      await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken: login.body.refreshToken })
        .expect(200);
      for (const token of [login.body.accessToken, refreshed.body.accessToken])
        await request(app.getHttpServer())
          .get('/auth/me')
          .auth(token, { type: 'bearer' })
          .expect(401);
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: login.body.refreshToken })
        .expect(401);
      revoked = false;
      persistence.refreshToken.updateMany.mockImplementation(async () => {
        revoked = true;
        return { count: 1 };
      });
      await request(app.getHttpServer())
        .post('/auth/logout-all')
        .auth(login.body.accessToken, { type: 'bearer' })
        .expect(200);
      await request(app.getHttpServer())
        .get('/auth/me')
        .auth(login.body.accessToken, { type: 'bearer' })
        .expect(401);
    });
    it('marks token exchanges and authenticated failures private/no-store and ignores ambient cookies', async () => {
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: safeUser.email, password: 'CorrectPassword123!' })
        .expect(200);
      expect(login.headers['cache-control']).toBe('private, no-store');
      const denied = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', `accessToken=${login.body.accessToken}`)
        .expect(401);
      expect(denied.headers['cache-control']).toBe('private, no-store');
      expect(login.headers['set-cookie']).toBeUndefined();
      const first = jwt.verify(login.body.accessToken);
      expect(first.sid).toBe('session-1');
      const second = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: safeUser.email, password: 'CorrectPassword123!' })
        .expect(200);
      expect(second.body.refreshToken).not.toBe(login.body.refreshToken);
    });
    it('rejects revoked, disabled and unbound access tokens and authorizes using the current role', async () => {
      const accessToken = jwt.sign({
        sub: 'user-1',
        email: safeUser.email,
        role: 'ADMIN',
        sid: 's',
      });
      for (const session of [
        null,
        {
          userId: 'other-user',
          revokedAt: null,
          expiresAt: new Date(Date.now() + 60000),
          user: safeUser,
        },
        {
          userId: safeUser.id,
          revokedAt: null,
          expiresAt: new Date(0),
          user: safeUser,
        },
        {
          userId: safeUser.id,
          revokedAt: null,
          expiresAt: new Date(Date.now() + 60000),
          user: null,
        },
      ]) {
        persistence.refreshToken.findUnique.mockResolvedValue(session);
        await request(app.getHttpServer())
          .get('/auth/me')
          .auth(accessToken, { type: 'bearer' })
          .expect(401);
      }
      persistence.refreshToken.findUnique.mockResolvedValue({
        userId: 'user-1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
        user: safeUser,
      });
      await request(app.getHttpServer())
        .get('/admin/users')
        .auth(accessToken, { type: 'bearer' })
        .expect(401);
      persistence.refreshToken.findUnique.mockResolvedValue({
        userId: 'user-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60000),
        user: { ...safeUser, disabledAt: new Date() },
      });
      await request(app.getHttpServer())
        .get('/auth/me')
        .auth(accessToken, { type: 'bearer' })
        .expect(401);
      persistence.refreshToken.findUnique.mockResolvedValue({
        userId: 'user-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60000),
        user: { ...safeUser, disabledAt: null },
      });
      await request(app.getHttpServer())
        .get('/admin/users')
        .auth(accessToken, { type: 'bearer' })
        .expect(403);
      await request(app.getHttpServer())
        .get('/auth/me')
        .auth(jwt.sign({ sub: 'user-1', role: 'ADMIN' }), { type: 'bearer' })
        .expect(401);
    });
    it('rejects invalid registration passwords, confirmations and role injection before persistence', async () => {
      const valid = { email: 'new@example.com', password: 'Valid123!' };
      for (const input of [
        ...[
          'Ab1!',
          'abcdefgh!',
          '12345678!',
          'Abcdefg1',
          'Valid 123!',
          'Valid123!\n',
          'رمزValid123!',
          'Valid123!é',
        ].map((password) => ({ ...valid, password })),
        { ...valid, confirmPassword: 'Different123!' },
        { ...valid, confirmPassword: null },
        { ...valid, role: 'AUTHOR' },
        { ...valid, roleId: 'admin-id' },
        { ...valid, username: '   ' },
        { ...valid, name: '   ' },
        { ...valid, email: ' new@example.com ' },
      ]) {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send(input)
          .expect(400);
      }
      expect(persistence.user.create).not.toHaveBeenCalled();
      expect(persistence.emailVerificationToken.create).not.toHaveBeenCalled();
    });
    it('reports database uniqueness conflicts without creating verification or session state', async () => {
      persistence.user.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('duplicate', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'reader@example.com', password: 'Valid123!' })
        .expect(409);
      expect(persistence.emailVerificationToken.create).not.toHaveBeenCalled();
      expect(persistence.refreshToken.create).not.toHaveBeenCalled();
    });
    it('accepts frontend registration without profile fields and requires a separate login', async () => {
      persistence.user.create.mockImplementation(async (args) => ({
        ...safeUser,
        ...(args as { data: object }).data,
        passwordHash: undefined,
      }));
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'new@example.com',
          password: 'Valid123!',
          confirmPassword: 'Valid123!',
        })
        .expect(201);
      expect(response.body.user.username).toMatch(/^user_[a-f0-9]{64}$/);
      expect(response.body.user.name).toBe(response.body.user.username);
      expect(response.body).not.toHaveProperty('accessToken');
      expect(response.body).not.toHaveProperty('refreshToken');
      expect(response.body.message).toContain('Log in');
      expect(persistence.refreshToken.create).not.toHaveBeenCalled();
      expect(persistence.role.findUnique).toHaveBeenCalledWith({
        where: { name: 'USER' },
      });
      const stored = (
        persistence.user.create.mock.calls[0][0] as {
          data: { passwordHash: string };
        }
      ).data;
      expect(await argon2.verify(stored.passwordHash, 'Valid123!')).toBe(true);
      persistence.user.findUnique.mockImplementation(async (args) =>
        (args as { select?: unknown }).select
          ? safeUser
          : { ...safeUser, passwordHash: stored.passwordHash },
      );
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'new@example.com', password: 'Valid123!' })
        .expect(200);
    });
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
        expect(persistence.user.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              username: 'new_reader',
              name: 'New Reader',
            }),
          }),
        );
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

import { vi as jest } from 'vitest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
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
import { userPublicSelect } from '../../src/users/user.select';
import { ThrottlerStorage } from '@nestjs/throttler';
import { Prisma } from '../../src/generated/prisma/client';
import { setupSwagger } from '../../src/swagger';
import { GOOGLE_OAUTH_CLIENT } from '../../src/auth/services/google-oauth.service';
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
    googleOAuthState: { create: query(), updateMany: query() },
    googleIdentity: { findUnique: query() },
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
    user: {
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
    post: { findFirst: query(), findUnique: query() },
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

  beforeAll(async () => {
    passwordHash = await argon2.hash('CorrectPassword123!');
    const module = await Test.createTestingModule({ imports: [AppModule] })
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
    const checkSchema = (schema: SchemaObject | ReferenceObject): void => {
      const resolved = resolve(schema);
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
    expect(create.required).toEqual(['title', 'content']);
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

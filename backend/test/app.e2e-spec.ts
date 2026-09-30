import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaExceptionFilter } from '../src/common/filters/prisma-exception.filter';
import { PrismaService } from '../src/database/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  let testEmail: string;
  let testUsername: string;
  let password: string;
  let accessToken: string;
  let refreshToken: string;
  let prisma: PrismaService;

  let authorEmail: string;
  let authorUsername: string;
  let authorAccessToken: string;

  let postId: string;
  let postSlug: string;

  let otherAuthorEmail: string;
  let otherAuthorUsername: string;
  let otherAuthorAccessToken: string;

  let interactionPostId: string;
  let commentId: string;
  let replyId: string;

  let deletableCommentId: string;
  let adminModerationCommentId: string;

  let adminAccessToken: string;

  let uploadedMediaId: string;
  let firstAvatarMediaId: string;

  const createTestImage = () =>
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2K6sAAAAASUVORK5CYII=',
      'base64',
    );

  beforeAll(async () => {
    const unique = Date.now();
    authorEmail = `author-${unique}@example.com`;
    authorUsername = `author_${unique}`;
    otherAuthorEmail = `other-author-${unique}@example.com`;
    otherAuthorUsername = `other_author_${unique}`;

    testEmail = `e2e-${unique}@example.com`;
    testUsername = `e2e_user_${unique}`;
    password = 'StrongPassword123!';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get(PrismaService);

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

  describe('Auth', () => {
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
  });

  describe('Authorization', () => {
    it('forbids a regular user from accessing admin routes', async () => {
      await request(app.getHttpServer())
        .get('/admin/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
    });

    it('allows an admin to access admin routes', async () => {
      const adminRole = await prisma.role.findUnique({
        where: {
          name: 'ADMIN',
        },
      });

      expect(adminRole).toBeDefined();

      await prisma.user.update({
        where: {
          email: testEmail,
        },
        data: {
          roleId: adminRole!.id,
        },
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password,
        })
        .expect(200);

      adminAccessToken = loginResponse.body.accessToken;
      await request(app.getHttpServer())
        .get('/admin/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);
    });
  });

  describe('Posts', () => {
    it('creates an author user for post tests', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: authorEmail,
          username: authorUsername,
          password,
          name: 'E2E Author',
        })
        .expect(201);

      const authorRole = await prisma.role.findUnique({
        where: {
          name: 'AUTHOR',
        },
      });

      expect(authorRole).toBeDefined();

      await prisma.user.update({
        where: {
          email: authorEmail,
        },
        data: {
          roleId: authorRole!.id,
        },
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: authorEmail,
          password,
        })
        .expect(200);

      authorAccessToken = loginResponse.body.accessToken;

      expect(authorAccessToken).toBeDefined();
    });

    it('allows an author to create a draft post', async () => {
      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${authorAccessToken}`)
        .send({
          title: `E2E Post ${Date.now()}`,
          content: 'This is an E2E test post.',
          status: 'DRAFT',
        })
        .expect(201);

      expect(response.body.status).toBe('DRAFT');

      postId = response.body.id;
      postSlug = response.body.slug;

      expect(postId).toBeDefined();
      expect(postSlug).toBeDefined();
    });

    it('does not expose a draft post publicly', async () => {
      await request(app.getHttpServer()).get(`/posts/${postSlug}`).expect(404);
    });

    it('allows the author to publish their post', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/posts/${postId}`)
        .set('Authorization', `Bearer ${authorAccessToken}`)
        .send({
          status: 'PUBLISHED',
        })
        .expect(200);

      expect(response.body.status).toBe('PUBLISHED');
      expect(response.body.publishedAt).toBeDefined();
    });

    it('exposes the published post publicly', async () => {
      const response = await request(app.getHttpServer())
        .get(`/posts/${postSlug}`)
        .expect(200);

      expect(response.body.id).toBe(postId);
      expect(response.body.status).toBe('PUBLISHED');
      expect(response.body.slug).toBe(postSlug);
    });

    it('creates another author for ownership tests', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: otherAuthorEmail,
          username: otherAuthorUsername,
          password,
          name: 'Other E2E Author',
        })
        .expect(201);

      const authorRole = await prisma.role.findUnique({
        where: {
          name: 'AUTHOR',
        },
      });

      expect(authorRole).toBeDefined();

      await prisma.user.update({
        where: {
          email: otherAuthorEmail,
        },
        data: {
          roleId: authorRole!.id,
        },
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: otherAuthorEmail,
          password,
        })
        .expect(200);

      otherAuthorAccessToken = loginResponse.body.accessToken;
    });

    it('allows the owner to update their post', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/posts/${postId}`)
        .set('Authorization', `Bearer ${authorAccessToken}`)
        .send({
          title: 'Updated E2E Post',
        })
        .expect(200);

      expect(response.body.title).toBe('Updated E2E Post');
    });

    it('forbids another author from updating the post', async () => {
      await request(app.getHttpServer())
        .patch(`/posts/${postId}`)
        .set('Authorization', `Bearer ${otherAuthorAccessToken}`)
        .send({
          title: 'Unauthorized Update',
        })
        .expect(403);
    });

    it('forbids another author from deleting the post', async () => {
      await request(app.getHttpServer())
        .delete(`/posts/${postId}`)
        .set('Authorization', `Bearer ${otherAuthorAccessToken}`)
        .expect(403);
    });

    it('allows the owner to delete their post', async () => {
      await request(app.getHttpServer())
        .delete(`/posts/${postId}`)
        .set('Authorization', `Bearer ${authorAccessToken}`)
        .expect(200);
    });

    it('returns 404 for the deleted post', async () => {
      await request(app.getHttpServer()).get(`/posts/${postSlug}`).expect(404);
    });
  });

  describe('Comments', () => {
    it('creates a published post for interaction tests', async () => {
      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${authorAccessToken}`)
        .send({
          title: `Interaction Post ${Date.now()}`,
          content: 'Post used for comment, like and bookmark E2E tests.',
          status: 'PUBLISHED',
        })
        .expect(201);

      interactionPostId = response.body.id;

      expect(interactionPostId).toBeDefined();
      expect(response.body.status).toBe('PUBLISHED');
    });

    it('allows a user to comment on a published post', async () => {
      const response = await request(app.getHttpServer())
        .post(`/posts/${interactionPostId}/comments`)
        .set('Authorization', `Bearer ${otherAuthorAccessToken}`)
        .send({
          content: 'E2E comment',
        })
        .expect(201);

      commentId = response.body.id;

      expect(commentId).toBeDefined();
      expect(response.body.content).toBe('E2E comment');
    });

    it('allows a user to reply to a comment', async () => {
      const response = await request(app.getHttpServer())
        .post(`/comments/${commentId}/replies`)
        .set('Authorization', `Bearer ${authorAccessToken}`)
        .send({
          content: 'E2E reply',
        })
        .expect(201);

      replyId = response.body.id;

      expect(replyId).toBeDefined();
      expect(response.body.content).toBe('E2E reply');
    });

    it('returns comments and replies publicly', async () => {
      const response = await request(app.getHttpServer())
        .get(`/posts/${interactionPostId}/comments`)
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);

      const comment = response.body.find(
        (item: { id: string }) => item.id === commentId,
      );

      expect(comment).toBeDefined();
      expect(comment.replies.length).toBeGreaterThan(0);
    });

    it('allows the comment owner to update their comment', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/comments/${commentId}`)
        .set('Authorization', `Bearer ${otherAuthorAccessToken}`)
        .send({
          content: 'Updated E2E comment',
        })
        .expect(200);

      expect(response.body.content).toBe('Updated E2E comment');
    });

    it('forbids another user from updating the comment', async () => {
      await request(app.getHttpServer())
        .patch(`/comments/${commentId}`)
        .set('Authorization', `Bearer ${authorAccessToken}`)
        .send({
          content: 'Unauthorized edit',
        })
        .expect(403);
    });

    it('creates a comment for delete tests', async () => {
      const response = await request(app.getHttpServer())
        .post(`/posts/${interactionPostId}/comments`)
        .set('Authorization', `Bearer ${otherAuthorAccessToken}`)
        .send({
          content: 'Comment for delete test',
        })
        .expect(201);

      deletableCommentId = response.body.id;

      expect(deletableCommentId).toBeDefined();
    });

    it('forbids another user from deleting the comment', async () => {
      await request(app.getHttpServer())
        .delete(`/comments/${deletableCommentId}`)
        .set('Authorization', `Bearer ${authorAccessToken}`)
        .expect(403);
    });

    it('allows the comment owner to delete their comment', async () => {
      await request(app.getHttpServer())
        .delete(`/comments/${deletableCommentId}`)
        .set('Authorization', `Bearer ${otherAuthorAccessToken}`)
        .expect(200);
    });

    it('creates a comment for admin moderation', async () => {
      const response = await request(app.getHttpServer())
        .post(`/posts/${interactionPostId}/comments`)
        .set('Authorization', `Bearer ${otherAuthorAccessToken}`)
        .send({
          content: 'Comment for admin moderation',
        })
        .expect(201);

      adminModerationCommentId = response.body.id;

      expect(adminModerationCommentId).toBeDefined();
    });

    it('allows an admin to delete another users comment', async () => {
      await request(app.getHttpServer())
        .delete(`/comments/${adminModerationCommentId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);
    });
  });

  describe('Likes', () => {
    it('allows a user to like a published post', async () => {
      const response = await request(app.getHttpServer())
        .post(`/posts/${interactionPostId}/like`)
        .set('Authorization', `Bearer ${otherAuthorAccessToken}`)
        .expect(201);

      expect(response.body.postId).toBe(interactionPostId);
    });

    it('returns the like count for a post', async () => {
      const response = await request(app.getHttpServer())
        .get(`/posts/${interactionPostId}/likes`)
        .expect(200);

      expect(response.body.postId).toBe(interactionPostId);
      expect(response.body.likes).toBeGreaterThanOrEqual(1);
    });

    it('does not create a duplicate like', async () => {
      const firstResponse = await request(app.getHttpServer())
        .post(`/posts/${interactionPostId}/like`)
        .set('Authorization', `Bearer ${otherAuthorAccessToken}`)
        .expect(201);

      const secondResponse = await request(app.getHttpServer())
        .post(`/posts/${interactionPostId}/like`)
        .set('Authorization', `Bearer ${otherAuthorAccessToken}`)
        .expect(201);

      expect(secondResponse.body.id).toBe(firstResponse.body.id);
    });

    it('allows a user to remove their like', async () => {
      await request(app.getHttpServer())
        .delete(`/posts/${interactionPostId}/like`)
        .set('Authorization', `Bearer ${otherAuthorAccessToken}`)
        .expect(200);
    });
  });

  describe('Bookmarks', () => {
    it('allows a user to bookmark a published post', async () => {
      const response = await request(app.getHttpServer())
        .post(`/posts/${interactionPostId}/bookmark`)
        .set('Authorization', `Bearer ${otherAuthorAccessToken}`)
        .expect(201);

      expect(response.body.postId).toBe(interactionPostId);
    });

    it('does not create a duplicate bookmark', async () => {
      const firstResponse = await request(app.getHttpServer())
        .post(`/posts/${interactionPostId}/bookmark`)
        .set('Authorization', `Bearer ${otherAuthorAccessToken}`)
        .expect(201);

      const secondResponse = await request(app.getHttpServer())
        .post(`/posts/${interactionPostId}/bookmark`)
        .set('Authorization', `Bearer ${otherAuthorAccessToken}`)
        .expect(201);

      expect(secondResponse.body.id).toBe(firstResponse.body.id);
    });

    it('returns the current users bookmarks', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookmarks')
        .set('Authorization', `Bearer ${otherAuthorAccessToken}`)
        .expect(200);

      const bookmark = response.body.find(
        (item: { postId: string }) => item.postId === interactionPostId,
      );

      expect(bookmark).toBeDefined();
    });

    it('allows a user to remove their bookmark', async () => {
      await request(app.getHttpServer())
        .delete(`/posts/${interactionPostId}/bookmark`)
        .set('Authorization', `Bearer ${otherAuthorAccessToken}`)
        .expect(200);
    });
  });

  describe('Media', () => {
    it('uploads an image', async () => {
      const response = await request(app.getHttpServer())
        .post('/media/images')
        .set('Authorization', `Bearer ${otherAuthorAccessToken}`)
        .attach('file', createTestImage(), {
          filename: 'e2e-test.png',
          contentType: 'image/png',
        })
        .expect(201);

      uploadedMediaId = response.body.id;

      expect(uploadedMediaId).toBeDefined();
      expect(response.body.url).toBeDefined();
      expect(response.body.publicId).toBeDefined();
    });

    it('allows the media owner to delete their image', async () => {
      await request(app.getHttpServer())
        .delete(`/media/${uploadedMediaId}`)
        .set('Authorization', `Bearer ${otherAuthorAccessToken}`)
        .expect(200);

      const deletedMedia = await prisma.media.findUnique({
        where: {
          id: uploadedMediaId,
        },
      });

      expect(deletedMedia).toBeNull();
    });

    it('allows a user to upload an avatar', async () => {
      const response = await request(app.getHttpServer())
        .patch('/media/avatar')
        .set('Authorization', `Bearer ${otherAuthorAccessToken}`)
        .attach('file', createTestImage(), {
          filename: 'avatar-1.png',
          contentType: 'image/png',
        })
        .expect(200);

      expect(response.body.avatarUrl).toBeDefined();

      const user = await prisma.user.findUnique({
        where: {
          email: otherAuthorEmail,
        },
        select: {
          avatarMediaId: true,
          avatarUrl: true,
        },
      });

      expect(user?.avatarMediaId).toBeDefined();
      expect(user?.avatarUrl).toBeDefined();

      firstAvatarMediaId = user!.avatarMediaId!;
    });

    it('replaces the previous avatar', async () => {
      await request(app.getHttpServer())
        .patch('/media/avatar')
        .set('Authorization', `Bearer ${otherAuthorAccessToken}`)
        .attach('file', createTestImage(), {
          filename: 'avatar-2.png',
          contentType: 'image/png',
        })
        .expect(200);

      const user = await prisma.user.findUnique({
        where: {
          email: otherAuthorEmail,
        },
        select: {
          avatarMediaId: true,
        },
      });

      expect(user?.avatarMediaId).toBeDefined();
      expect(user?.avatarMediaId).not.toBe(firstAvatarMediaId);

      const oldAvatar = await prisma.media.findUnique({
        where: {
          id: firstAvatarMediaId,
        },
      });

      expect(oldAvatar).toBeNull();
    });
  });

  afterAll(async () => {
    await app.close();
  });
});

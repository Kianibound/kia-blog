import { jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { PostStatus } from '../generated/prisma/client';
import type { Prisma } from '../generated/prisma/client';
import { PostsModule } from '../posts/posts.module';
import { PostsService } from '../posts/posts.service';
import { CommentsModule } from '../comments/comments.module';
import { CommentsService } from '../comments/comments.service';
import { BookmarksModule } from '../bookmarks/bookmarks.module';
import { BookmarksService } from '../bookmarks/bookmarks.service';
import { PostLikesModule } from '../post-likes/post-likes.module';
import { PostLikesService } from '../post-likes/post-likes.service';
import { ROLE } from '../roles/constants/role.constants';
import { PublishedPosts } from './published-posts';

// Real modules and shared policy; only persistence is replaced. Never reads .env.
describe('Published Post visibility across features', () => {
  let module: TestingModule;
  let posts: PostsService;
  let comments: CommentsService;
  let bookmarks: BookmarksService;
  let likes: PostLikesService;
  let policy: PublishedPosts;
  const postRows = [
    {
      id: 'published',
      slug: 'published',
      status: PostStatus.PUBLISHED,
      authorId: 'owner',
      publishedAt: new Date(),
    },
    {
      id: 'draft',
      slug: 'draft',
      status: PostStatus.DRAFT,
      authorId: 'owner',
      publishedAt: null,
    },
    {
      id: 'deprecated',
      slug: 'deprecated',
      status: PostStatus.DEPRECATED,
      authorId: 'owner',
      publishedAt: new Date(),
    },
  ];
  const parentRows = postRows.map((post) => ({
    id: `parent-${post.id}`,
    postId: post.id,
    post,
  }));
  const bookmarkRows = postRows.map((post) => ({
    id: `bookmark-${post.id}`,
    userId: 'reader',
    post,
  }));
  const visiblePost = (where: Prisma.PostWhereInput) =>
    postRows.find(
      (post) =>
        (!where.id || post.id === where.id) &&
        (!where.slug || post.slug === where.slug) &&
        (!where.status || post.status === where.status),
    );
  const repository = {
    post: {
      findFirst:
        jest.fn<
          ({ where }: { where: Prisma.PostWhereInput }) => Promise<unknown>
        >(),
      findUnique:
        jest.fn<({ where }: { where: { id: string } }) => Promise<unknown>>(),
      findMany: jest.fn<(args: unknown) => Promise<unknown[]>>(),
      count: jest.fn<(args: unknown) => Promise<number>>(),
    },
    comment: {
      findFirst:
        jest.fn<
          ({
            where,
          }: {
            where: { id: string; post: Prisma.PostWhereInput };
          }) => Promise<unknown>
        >(),
      findMany: jest.fn<(args: unknown) => Promise<unknown[]>>(),
      create: jest.fn<(args: unknown) => Promise<unknown>>(),
      findUnique: jest.fn<(args: unknown) => Promise<unknown>>(),
      update: jest.fn<(args: unknown) => Promise<unknown>>(),
      delete: jest.fn<(args: unknown) => Promise<unknown>>(),
    },
    bookmark: {
      findUnique: jest.fn<(args: unknown) => Promise<unknown>>(),
      findMany:
        jest.fn<
          ({
            where,
          }: {
            where: { userId: string; post?: Prisma.PostWhereInput };
          }) => Promise<unknown[]>
        >(),
      create: jest.fn<(args: unknown) => Promise<unknown>>(),
      delete: jest.fn<(args: unknown) => Promise<unknown>>(),
    },
    postLike: {
      findUnique: jest.fn<(args: unknown) => Promise<unknown>>(),
      create: jest.fn<(args: unknown) => Promise<unknown>>(),
      delete: jest.fn<(args: unknown) => Promise<unknown>>(),
      count: jest.fn<(args: unknown) => Promise<number>>(),
    },
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        PostsModule,
        CommentsModule,
        BookmarksModule,
        PostLikesModule,
      ],
    })
      .overrideProvider(ConfigService)
      .useValue({
        getOrThrow: (key: string) =>
          ({
            JWT_ACCESS_SECRET: 'visibility-test-secret',
            JWT_ACCESS_EXPIRES_IN: '900',
          })[key],
      })
      .overrideProvider(PrismaService)
      .useValue(repository)
      .compile();
    await module.init();
    posts = module.get(PostsService);
    comments = module.get(CommentsService);
    bookmarks = module.get(BookmarksService);
    likes = module.get(PostLikesService);
    policy = module.get(PublishedPosts);
  });
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
    repository.post.findFirst.mockImplementation(
      async ({ where }) => visiblePost(where) ?? null,
    );
    repository.post.findUnique.mockImplementation(
      async ({ where }) =>
        postRows.find((post) => post.id === where.id) ?? null,
    );
    repository.post.findMany.mockResolvedValue([]);
    repository.post.count.mockResolvedValue(0);
    repository.comment.findFirst.mockImplementation(
      async ({ where }) =>
        parentRows.find(
          (parent) =>
            parent.id === where.id && parent.post.status === where.post.status,
        ) ?? null,
    );
    repository.comment.create.mockResolvedValue({ id: 'new-comment' });
    repository.comment.findMany.mockResolvedValue([]);
    repository.bookmark.findUnique.mockResolvedValue(null);
    repository.bookmark.create.mockResolvedValue({ id: 'new-bookmark' });
    repository.bookmark.findMany.mockImplementation(async ({ where }) =>
      bookmarkRows.filter(
        (bookmark) =>
          bookmark.userId === where.userId &&
          (!where.post || bookmark.post.status === where.post.status),
      ),
    );
    repository.postLike.findUnique.mockResolvedValue(null);
    repository.postLike.create.mockResolvedValue({ id: 'new-like' });
    repository.postLike.count.mockResolvedValue(3);
  });
  afterAll(async () => {
    await module?.close();
  });

  const operations = [
    {
      name: 'comment creation',
      run: (id: string) => comments.create(id, 'reader', { content: 'Hello' }),
      downstream: () => repository.comment.create,
    },
    {
      name: 'comment listing',
      run: (id: string) => comments.findByPost(id),
      downstream: () => repository.comment.findMany,
    },
    {
      name: 'comment reply',
      run: (id: string) =>
        comments.reply(`parent-${id}`, 'reader', { content: 'Reply' }),
      downstream: () => repository.comment.create,
    },
    {
      name: 'like creation',
      run: (id: string) => likes.create('reader', id),
      downstream: () => repository.postLike.create,
    },
    {
      name: 'like counting',
      run: (id: string) => likes.count(id),
      downstream: () => repository.postLike.count,
    },
    {
      name: 'bookmark creation',
      run: (id: string) => bookmarks.create('reader', id),
      downstream: () => repository.bookmark.create,
    },
  ];
  describe.each(operations)('$name', (operation) => {
    it('allows a Published Post', async () => {
      await expect(operation.run('published')).resolves.toBeDefined();
      expect(operation.downstream()).toHaveBeenCalledTimes(1);
    });
    it.each(['draft', 'deprecated', 'missing'])(
      'rejects %s before reading/writing interactions',
      async (id) => {
        await expect(operation.run(id)).rejects.toThrow(
          new NotFoundException(
            operation.name === 'comment reply'
              ? 'Parent comment not found.'
              : 'Post not found.',
          ),
        );
        expect(operation.downstream()).not.toHaveBeenCalled();
        expect(repository.bookmark.findUnique).not.toHaveBeenCalled();
        expect(repository.postLike.findUnique).not.toHaveBeenCalled();
      },
    );
  });
  it('returns a fresh, typed visibility predicate', () => {
    const first = policy.where();
    first.status = PostStatus.DRAFT;
    expect(policy.where()).toEqual({ status: PostStatus.PUBLISHED });
  });
  it('checks existence without loading private post content', async () => {
    await policy.requireById('published');
    expect(repository.post.findFirst).toHaveBeenCalledWith({
      where: { id: 'published', status: PostStatus.PUBLISHED },
      select: { id: true },
    });
  });
  it('keeps replies a single relational lookup with the original parent error', async () => {
    await comments.reply('parent-published', 'reader', { content: 'Reply' });
    expect(repository.post.findFirst).not.toHaveBeenCalled();
    expect(repository.comment.findFirst).toHaveBeenCalledWith({
      where: { id: 'parent-published', post: { status: PostStatus.PUBLISHED } },
      select: { id: true, postId: true },
    });
    expect(repository.comment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          content: 'Reply',
          authorId: 'reader',
          postId: 'published',
          parentId: 'parent-published',
        },
      }),
    );
  });
  it('hides bookmarked Posts after unpublishing, without deleting the bookmarks', async () => {
    const result = await bookmarks.findMine('reader');
    expect(result.map((bookmark) => bookmark.id)).toEqual([
      'bookmark-published',
    ]);
    expect(repository.bookmark.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'reader', post: { status: PostStatus.PUBLISHED } },
      }),
    );
    expect(repository.bookmark.delete).not.toHaveBeenCalled();
  });
  it('does not return other users bookmarks', async () => {
    expect(await bookmarks.findMine('other')).toEqual([]);
  });
  it.each(['draft', 'deprecated'])(
    'hides %s publicly but preserves owner/admin reads',
    async (id) => {
      await expect(posts.findBySlug(id)).rejects.toThrow(NotFoundException);
      expect(await posts.findById(id)).toEqual(expect.objectContaining({ id }));
      expect(await posts.findMineById(id, 'owner', ROLE.AUTHOR)).toEqual(
        expect.objectContaining({ id }),
      );
      await posts.findMine('owner', 1, 10);
      expect(repository.post.findMany).toHaveBeenCalledWith({
        where: { authorId: 'owner' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    },
  );
  it.each(['bookmark', 'like'] as const)(
    'keeps duplicate %s creation idempotent',
    async (kind) => {
      const model =
        kind === 'bookmark' ? repository.bookmark : repository.postLike;
      model.findUnique.mockResolvedValue({ id: 'existing' });
      const result =
        kind === 'bookmark'
          ? await bookmarks.create('reader', 'published')
          : await likes.create('reader', 'published');
      expect(result).toEqual({ id: 'existing' });
      expect(model.create).not.toHaveBeenCalled();
    },
  );
  it.each(['bookmark', 'like'] as const)(
    'allows removing an existing %s after unpublishing',
    async (kind) => {
      const model =
        kind === 'bookmark' ? repository.bookmark : repository.postLike;
      model.findUnique.mockResolvedValue({ id: 'existing' });
      if (kind === 'bookmark') await bookmarks.remove('reader', 'draft');
      else await likes.remove('reader', 'draft');
      expect(model.delete).toHaveBeenCalledWith({ where: { id: 'existing' } });
      expect(repository.post.findFirst).not.toHaveBeenCalled();
    },
  );
  it('keeps comment owner edit/delete possible after unpublishing', async () => {
    repository.comment.findUnique.mockResolvedValue({
      id: 'comment',
      authorId: 'reader',
      postId: 'draft',
    });
    await comments.update('comment', 'reader', ROLE.USER, {
      content: 'Edited',
    });
    await comments.remove('comment', 'reader', ROLE.USER);
    expect(repository.comment.update).toHaveBeenCalledTimes(1);
    expect(repository.comment.delete).toHaveBeenCalledTimes(1);
    expect(repository.post.findFirst).not.toHaveBeenCalled();
  });
  it('uses the same shared rule in feed results/count, detail, replies and bookmarks', async () => {
    const extraRule: Prisma.PostWhereInput = {
      status: PostStatus.PUBLISHED,
      publishedAt: { not: null },
    };
    jest.spyOn(policy, 'where').mockReturnValue(extraRule);
    await posts.findAll(1, 10);
    await posts.findBySlug('published');
    await comments.reply('parent-published', 'reader', { content: 'Reply' });
    await bookmarks.findMine('reader');
    await likes.count('published');
    expect(repository.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: extraRule }),
    );
    expect(repository.post.count).toHaveBeenCalledWith({ where: extraRule });
    expect(repository.post.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: 'published', ...extraRule } }),
    );
    expect(repository.post.findFirst).toHaveBeenCalledWith({
      where: { id: 'published', ...extraRule },
      select: { id: true },
    });
    expect(repository.comment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'parent-published', post: extraRule },
      }),
    );
    expect(repository.bookmark.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'reader', post: extraRule } }),
    );
  });
});

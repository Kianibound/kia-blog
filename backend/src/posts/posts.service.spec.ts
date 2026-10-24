import { jest } from '@jest/globals';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { PostStatus } from '../generated/prisma/client';
import { ROLE } from '../roles/constants/role.constants';
import { PostsService } from './posts.service';
import { PostsModule } from './posts.module';
import { PublishedPosts } from '../published-posts/published-posts';

// Tests cross the public Posts interface so internal refactors need no rewrites.
describe('Posts behavior', () => {
  const post = {
    id: 'p',
    authorId: 'owner',
    status: PostStatus.DRAFT,
    publishedAt: null as Date | null,
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
  let service: PostsService;
  beforeEach(async () => {
    jest.resetAllMocks();
    repository.findUnique.mockResolvedValue(post);
    repository.findFirst.mockResolvedValue(post);
    repository.findMany.mockResolvedValue([post]);
    repository.count.mockResolvedValue(5);
    repository.create.mockResolvedValue(post);
    repository.update.mockResolvedValue(post);
    const module = await Test.createTestingModule({
      providers: [
        ...Reflect.getMetadata('providers', PostsModule),
        PublishedPosts,
        { provide: PrismaService, useValue: { post: repository } },
      ],
    }).compile();
    service = module.get(PostsService);
  });

  it('creates a draft with connected relations and a collision-free slug', async () => {
    repository.findUnique
      .mockResolvedValueOnce({ id: 'existing' })
      .mockResolvedValueOnce(null);
    expect(
      await service.create('owner', {
        title: 'Hello World',
        content: 'Content',
        categoryIds: ['c'],
        tagIds: ['t'],
      }),
    ).toBe(post);
    expect(repository.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        authorId: 'owner',
        slug: 'hello-world-2',
        publishedAt: null,
        categories: { connect: [{ id: 'c' }] },
        tags: { connect: [{ id: 't' }] },
      }),
      include: { categories: true, tags: true },
    });
  });
  it('timestamps a newly published post', async () => {
    repository.findUnique.mockResolvedValue(null);
    await service.create('owner', {
      title: 'Hello',
      content: 'Content',
      status: PostStatus.PUBLISHED,
    });
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ publishedAt: expect.any(Date) }),
      }),
    );
  });
  it('applies identical public filters to results/count and paginates without author secrets', async () => {
    expect(
      await service.findAll(2, 2, 'nest', 'oldest', 'alice', 'tech', 'node'),
    ).toEqual({
      data: [post],
      meta: { page: 2, limit: 2, total: 5, totalPages: 3 },
    });
    const query = repository.findMany.mock.calls[0][0] as {
      where: unknown;
      include: { author: { select: unknown } };
    };
    expect(query).toEqual(
      expect.objectContaining({
        where: {
          status: PostStatus.PUBLISHED,
          author: { username: { equals: 'alice', mode: 'insensitive' } },
          categories: { some: { slug: 'tech' } },
          tags: { some: { slug: 'node' } },
          OR: [
            { title: { contains: 'nest', mode: 'insensitive' } },
            { content: { contains: 'nest', mode: 'insensitive' } },
          ],
        },
        orderBy: { publishedAt: 'asc' },
        skip: 2,
        take: 2,
      }),
    );
    expect(query.include.author.select).toEqual({
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
    });
    expect(repository.count).toHaveBeenCalledWith({ where: query.where });
  });
  it('defaults to newest published posts with zero pages for an empty feed', async () => {
    repository.findMany.mockResolvedValue([]);
    repository.count.mockResolvedValue(0);
    expect(await service.findAll(1, 10)).toEqual({
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });
    expect(repository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: PostStatus.PUBLISHED },
        orderBy: { publishedAt: 'desc' },
      }),
    );
  });
  it('lists only current author posts including drafts', async () => {
    expect((await service.findMine('owner', 2, 2)).data).toEqual([post]);
    expect(repository.findMany).toHaveBeenCalledWith({
      where: { authorId: 'owner' },
      orderBy: { createdAt: 'desc' },
      skip: 2,
      take: 2,
    });
    expect(repository.count).toHaveBeenCalledWith({
      where: { authorId: 'owner' },
    });
  });
  it('limits public slug lookup to published posts and rejects absent results', async () => {
    repository.findFirst.mockResolvedValue(null);
    await expect(service.findBySlug('hidden')).rejects.toThrow(
      NotFoundException,
    );
    expect(repository.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: 'hidden', status: PostStatus.PUBLISHED },
      }),
    );
  });
  it('preserves public/admin detail projection and allows private admin lookup', async () => {
    expect(await service.findBySlug('slug')).toBe(post);
    expect(await service.findById('p')).toBe(post);
    const query = repository.findFirst.mock.calls[0][0] as { include: unknown };
    expect(query.include).toEqual({
      author: {
        select: { id: true, username: true, name: true, avatarUrl: true },
      },
      categories: { select: { id: true, name: true, slug: true } },
      tags: { select: { id: true, name: true, slug: true } },
    });
    expect(repository.findUnique).toHaveBeenCalledWith({
      where: { id: 'p' },
      include: query.include,
    });
  });
  it('returns 404 for missing admin detail', async () => {
    repository.findUnique.mockResolvedValue(null);
    await expect(service.findById('missing')).rejects.toThrow(
      NotFoundException,
    );
  });
  it('loads private detail taxonomy while keeping the safe author projection', async () => {
    await service.findMineById('p', 'owner', ROLE.AUTHOR);
    expect(repository.findUnique).toHaveBeenCalledWith({
      where: { id: 'p' },
      include: {
        author: {
          select: { id: true, username: true, name: true, avatarUrl: true },
        },
        categories: { select: { id: true, name: true, slug: true } },
        tags: { select: { id: true, name: true, slug: true } },
      },
    });
  });
  describe.each(['read', 'update', 'delete'] as const)(
    '%s ownership',
    (action) => {
      const invoke = (
        target: PostsService,
        user: string,
        role: typeof ROLE.AUTHOR | typeof ROLE.ADMIN,
      ) => {
        if (action === 'read') return target.findMineById('p', user, role);
        if (action === 'update')
          return target.update('p', user, role, { title: 'Changed' });
        return target.remove('p', user, role);
      };
      it('rejects another author before writing', async () => {
        await expect(invoke(service, 'other', ROLE.AUTHOR)).rejects.toThrow(
          ForbiddenException,
        );
        expect(repository.update).not.toHaveBeenCalled();
        expect(repository.delete).not.toHaveBeenCalled();
      });
      it('allows the owner', async () => {
        await expect(
          invoke(service, 'owner', ROLE.AUTHOR),
        ).resolves.toBeDefined();
      });
      it('allows an admin acting on another author post', async () => {
        await expect(
          invoke(service, 'admin', ROLE.ADMIN),
        ).resolves.toBeDefined();
      });
      it('returns 404 for a missing post', async () => {
        repository.findUnique.mockResolvedValue(null);
        await expect(invoke(service, 'owner', ROLE.AUTHOR)).rejects.toThrow(
          NotFoundException,
        );
      });
    },
  );
  it.each([
    [PostStatus.DRAFT, PostStatus.PUBLISHED, 'new'],
    [PostStatus.PUBLISHED, PostStatus.PUBLISHED, 'keep'],
    [PostStatus.PUBLISHED, PostStatus.DRAFT, 'clear'],
    [PostStatus.PUBLISHED, PostStatus.DEPRECATED, 'keep'],
    [PostStatus.PUBLISHED, undefined, 'keep'],
    [PostStatus.DEPRECATED, PostStatus.PUBLISHED, 'new'],
  ] as const)(
    'preserves publication behavior: %s -> %s',
    async (before, after, expected) => {
      const oldDate = new Date('2020-01-01');
      repository.findUnique.mockResolvedValue({
        ...post,
        status: before,
        publishedAt: oldDate,
      });
      await service.update('p', 'owner', ROLE.AUTHOR, { status: after });
      const query = repository.update.mock.calls[0][0] as {
        data: { publishedAt: Date | null };
      };
      if (expected === 'clear') expect(query.data.publishedAt).toBeNull();
      else if (expected === 'keep')
        expect(query.data.publishedAt).toBe(oldDate);
      else
        expect(query.data.publishedAt!.getTime()).toBeGreaterThan(
          oldDate.getTime(),
        );
    },
  );
  it('clears empty relations while preserving omitted relations and the existing slug', async () => {
    await service.update('p', 'owner', ROLE.AUTHOR, {
      title: 'Changed',
      categoryIds: [],
    });
    const query = repository.update.mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(query.data.categories).toEqual({ set: [] });
    expect(query.data.tags).toBeUndefined();
    expect(query.data.slug).toBeUndefined();
    expect(query.data.categoryIds).toBeUndefined();
  });
  it('replaces supplied category/tag relations', async () => {
    await service.update('p', 'owner', ROLE.AUTHOR, {
      categoryIds: ['c'],
      tagIds: ['t'],
    });
    expect(repository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          categories: { set: [{ id: 'c' }] },
          tags: { set: [{ id: 't' }] },
        }),
      }),
    );
  });
  it('deletes an authorized post and preserves the response', async () => {
    expect(await service.remove('p', 'owner', ROLE.AUTHOR)).toEqual({
      message: 'Post deleted successfully.',
    });
    expect(repository.delete).toHaveBeenCalledWith({ where: { id: 'p' } });
  });
});

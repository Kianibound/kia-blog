import { jest } from '@jest/globals';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
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
    categories: [{ id: 'c' }],
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
    ).toEqual({ ...post, contentMedia: [], coverImage: null });
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
      categoryIds: ['c'],
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
      data: [{ ...post, contentMedia: [], coverImage: null }],
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
    expect((await service.findMine('owner', 2, 2)).data).toEqual([
      { ...post, contentMedia: [], coverImage: null },
    ]);
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
    expect(await service.findBySlug('slug')).toEqual({
      ...post,
      contentMedia: [],
      coverImage: null,
    });
    expect(await service.findById('p')).toEqual({
      ...post,
      contentMedia: [],
      coverImage: null,
    });
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
  describe.each(['read', 'update'] as const)(
    '%s ownership',
    (action) => {
      const invoke = (
        target: PostsService,
        user: string,
        role: typeof ROLE.AUTHOR | typeof ROLE.ADMIN,
      ) => {
        if (action === 'read') return target.findMineById('p', user, role);
        return target.update('p', user, role, { title: 'Changed' });
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
  describe('delete authorization (ADMIN only)', () => {
    it('rejects the owning author before writing', async () => {
      await expect(
        service.remove('p', 'owner', ROLE.AUTHOR),
      ).rejects.toThrow(ForbiddenException);
      expect(repository.delete).not.toHaveBeenCalled();
    });
    it('rejects another author and ordinary users', async () => {
      await expect(
        service.remove('p', 'other', ROLE.AUTHOR),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.remove('p', 'reader', ROLE.USER),
      ).rejects.toThrow(ForbiddenException);
      expect(repository.delete).not.toHaveBeenCalled();
    });
    it('allows an admin to delete another author post', async () => {
      await expect(
        service.remove('p', 'admin', ROLE.ADMIN),
      ).resolves.toEqual({ message: 'Post deleted successfully.' });
      expect(repository.delete).toHaveBeenCalledWith({ where: { id: 'p' } });
    });
    it('returns 404 for a missing post before the role check', async () => {
      repository.findUnique.mockResolvedValue(null);
      await expect(service.remove('p', 'owner', ROLE.AUTHOR)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });
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
  it('deletes an authorized ADMIN post and preserves the response', async () => {
    expect(await service.remove('p', 'admin', ROLE.ADMIN)).toEqual({
      message: 'Post deleted successfully.',
    });
    expect(repository.delete).toHaveBeenCalledWith({ where: { id: 'p' } });
  });
  describe('publication category invariant', () => {
    const published = { ...post, status: PostStatus.PUBLISHED };
    it('rejects publishing a draft without categories before writing', async () => {
      repository.findUnique.mockResolvedValue({
        ...post,
        status: PostStatus.DRAFT,
        categories: [],
      });
      await expect(
        service.update('p', 'owner', ROLE.AUTHOR, {
          status: PostStatus.PUBLISHED,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(repository.update).not.toHaveBeenCalled();
    });
    it('rejects creating a published post without categories', async () => {
      repository.findUnique.mockResolvedValue(null);
      await expect(
        service.create('owner', {
          title: 'Hello',
          content: 'Content',
          status: PostStatus.PUBLISHED,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(repository.create).not.toHaveBeenCalled();
    });
    it('rejects removing the last category while staying published', async () => {
      repository.findUnique.mockResolvedValue(published);
      await expect(
        service.update('p', 'owner', ROLE.ADMIN, { categoryIds: [] }),
      ).rejects.toThrow(BadRequestException);
      expect(repository.update).not.toHaveBeenCalled();
    });
    it('allows unpublishing before removing every category', async () => {
      repository.findUnique.mockResolvedValue(published);
      await expect(
        service.update('p', 'owner', ROLE.AUTHOR, {
          status: PostStatus.DRAFT,
          categoryIds: [],
        }),
      ).resolves.toBeDefined();
      expect(repository.update).toHaveBeenCalled();
    });
    it('allows replacing the categories of a published post', async () => {
      repository.findUnique.mockResolvedValue(published);
      await expect(
        service.update('p', 'owner', ROLE.AUTHOR, {
          categoryIds: ['c2'],
        }),
      ).resolves.toBeDefined();
    });
    it('keeps legacy published posts without categories editable', async () => {
      repository.findUnique.mockResolvedValue({
        ...published,
        categories: [],
      });
      await expect(
        service.update('p', 'owner', ROLE.AUTHOR, { title: 'Renamed' }),
      ).resolves.toBeDefined();
      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ title: 'Renamed' }),
        }),
      );
    });
    it('tolerates an unchanged empty category list on a legacy published post', async () => {
      repository.findUnique.mockResolvedValue({
        ...published,
        categories: [],
      });
      await expect(
        service.update('p', 'owner', ROLE.AUTHOR, { categoryIds: [] }),
      ).resolves.toBeDefined();
    });
    it('still requires a category to republish a legacy categoryless post', async () => {
      repository.findUnique.mockResolvedValue({
        ...published,
        status: PostStatus.DEPRECATED,
        categories: [],
      });
      await expect(
        service.update('p', 'owner', ROLE.AUTHOR, {
          status: PostStatus.PUBLISHED,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });
});

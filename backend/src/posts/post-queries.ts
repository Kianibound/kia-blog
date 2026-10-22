import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { RoleName } from '../roles/constants/role.constants';
import { PublishedPosts } from '../published-posts/published-posts';
import { assertPostAccess } from './post-access.policy';
import type { Prisma } from '../generated/prisma/client';

const authorProjection = {
  select: { id: true, username: true, name: true, avatarUrl: true },
} as const;
const taxonomyProjection = {
  select: { id: true, name: true, slug: true },
} as const;
const detailProjection = {
  author: authorProjection,
  categories: taxonomyProjection,
  tags: taxonomyProjection,
} satisfies Prisma.PostInclude;

export type PostFeedQuery = {
  page: number;
  limit: number;
  search?: string;
  sort?: 'newest' | 'oldest';
  author?: string;
  category?: string;
  tag?: string;
};

// Internal to PostsModule: reads own visibility, filters, pagination, and projections.
@Injectable()
export class PostQueries {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publishedPosts: PublishedPosts,
  ) {}

  async findAll({
    page,
    limit,
    search,
    sort = 'newest',
    author,
    category,
    tag,
  }: PostFeedQuery) {
    const skip = (page - 1) * limit;

    // Build filters for public posts
    const where = {
      ...this.publishedPosts.where(),

      // Filter by author username
      ...(author
        ? {
            author: {
              username: {
                equals: author,
                mode: 'insensitive' as const,
              },
            },
          }
        : {}),

      // Filter by category slug
      ...(category
        ? {
            categories: {
              some: {
                slug: category,
              },
            },
          }
        : {}),

      // Filter by tag slug
      ...(tag
        ? {
            tags: {
              some: {
                slug: tag,
              },
            },
          }
        : {}),

      // Search in title or content
      ...(search
        ? {
            OR: [
              {
                title: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              {
                content: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    // Build sorting based on query input
    const orderBy = {
      publishedAt: sort === 'oldest' ? 'asc' : 'desc',
    } as const;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: detailProjection,
      }),

      this.prisma.post.count({
        where,
      }),
    ]);

    return {
      data: posts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    // Find a post by its database id
    const post = await this.prisma.post.findUnique({
      where: {
        id,
      },
      include: detailProjection,
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    return post;
  }

  async findMine(authorId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    // Get the author's posts and total count in parallel
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: {
          authorId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),

      this.prisma.post.count({
        where: {
          authorId,
        },
      }),
    ]);

    return {
      data: posts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findMineById(
    postId: string,
    currentUserId: string,
    currentUserRole: RoleName,
  ) {
    // Load the post for the authenticated author's edit/detail page
    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
      include: { author: authorProjection },
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    // Authors can only access their own private posts.
    // Admins may access any post.
    assertPostAccess(post.authorId, currentUserId, currentUserRole, 'access');

    return post;
  }

  async findBySlug(slug: string) {
    // Public post pages should only expose published posts
    const post = await this.prisma.post.findFirst({
      where: {
        slug,
        ...this.publishedPosts.where(),
      },
      include: detailProjection,
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    return post;
  }
}

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import type { CreatePostDto } from './dto/create-post.dto';

import { ROLE } from '../roles/constants/role.constants';
import type { RoleName } from '../roles/constants/role.constants';
import type { UpdatePostDto } from './dto/update-post.dto';
import slugify from 'slugify';
import { PostStatus } from '../../generated/prisma/client';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(authorId: string, dto: CreatePostDto) {
    // Generate a unique public URL slug from the title
    const slug = await this.generateUniqueSlug(dto.title);

    // A post receives a publication date only when created as published
    const publishedAt = dto.status === PostStatus.PUBLISHED ? new Date() : null;

    // Create a new post owned by the authenticated author
    return this.prisma.post.create({
      data: {
        title: dto.title,
        slug,
        content: dto.content,
        status: dto.status,
        publishedAt,
        authorId,
      },
    });
  }

  async findAll(page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;

    // Build the public-post filter once and reuse it
    const where = {
      status: PostStatus.PUBLISHED,

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

    // Get the current page and total count in parallel
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        orderBy: {
          publishedAt: 'desc',
        },
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
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

  async findBySlug(slug: string) {
    // Public post pages should only expose published posts
    const post = await this.prisma.post.findFirst({
      where: {
        slug,
        status: PostStatus.PUBLISHED,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    return post;
  }

  async update(
    postId: string,
    currentUserId: string,
    currentUserRole: RoleName,
    dto: UpdatePostDto,
  ) {
    // Load the post first so we can verify ownership
    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    // Authors can only update their own posts.
    // Admins are allowed to update any post.
    const isOwner = post.authorId === currentUserId;
    const isAdmin = currentUserRole === ROLE.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to update this post.',
      );
    }

    // Keep publishedAt synchronized with status changes
    let publishedAt = post.publishedAt;

    if (
      dto.status === PostStatus.PUBLISHED &&
      post.status !== PostStatus.PUBLISHED
    ) {
      // The post is being published now
      publishedAt = new Date();
    }

    if (dto.status === PostStatus.DRAFT) {
      // A draft should not have an active publication date
      publishedAt = null;
    }

    // Update only the fields provided by the client
    return this.prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        ...dto,
        publishedAt,
      },
    });
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    // Convert the title into a URL-friendly base slug
    const baseSlug = slugify(title, {
      lower: true,
      strict: true,
      trim: true,
    });

    let slug = baseSlug;
    let counter = 2;

    // Keep trying until we find an unused slug
    while (
      await this.prisma.post.findUnique({
        where: { slug },
        select: { id: true },
      })
    ) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  async remove(
    postId: string,
    currentUserId: string,
    currentUserRole: RoleName,
  ) {
    // Load the post first so we can verify ownership
    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    // Authors can only delete their own posts.
    // Admins can delete any post.
    const isOwner = post.authorId === currentUserId;
    const isAdmin = currentUserRole === ROLE.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to delete this post.',
      );
    }

    // Delete the post after authorization checks pass
    await this.prisma.post.delete({
      where: {
        id: postId,
      },
    });

    return {
      message: 'Post deleted successfully.',
    };
  }
}

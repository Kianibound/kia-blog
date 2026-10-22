import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { RoleName } from '../roles/constants/role.constants';
import { PostStatus } from '../generated/prisma/client';
import { assertPostAccess } from './post-access.policy';
import type { CreatePostDto } from './dto/create-post.dto';
import type { UpdatePostDto } from './dto/update-post.dto';
import slugify from 'slugify';

// Internal to PostsModule: writes own lifecycle, relation changes, and slug allocation.
@Injectable()
export class PostCommands {
  constructor(private readonly prisma: PrismaService) {}

  async create(authorId: string, dto: CreatePostDto) {
    // Generate a unique public URL slug from the title
    const slug = await this.generateUniqueSlug(dto.title);

    // Set publication time only when the post starts as published
    const publishedAt = dto.status === PostStatus.PUBLISHED ? new Date() : null;

    return this.prisma.post.create({
      data: {
        title: dto.title,
        slug,
        content: dto.content,
        status: dto.status,
        publishedAt,
        authorId,

        // Connect existing categories by id
        categories: dto.categoryIds
          ? {
              connect: dto.categoryIds.map((id) => ({
                id,
              })),
            }
          : undefined,

        // Connect existing tags by id
        tags: dto.tagIds
          ? {
              connect: dto.tagIds.map((id) => ({
                id,
              })),
            }
          : undefined,
      },

      // Return attached categories and tags in the response
      include: {
        categories: true,
        tags: true,
      },
    });
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
    assertPostAccess(post.authorId, currentUserId, currentUserRole, 'update');

    // Keep publishedAt synchronized with status changes
    let publishedAt = post.publishedAt;

    // Separate relation ids from regular post fields
    const { categoryIds, tagIds, ...postData } = dto;

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
        ...postData,
        publishedAt,

        // Replace categories only when categoryIds is provided
        categories:
          categoryIds !== undefined
            ? {
                set: categoryIds.map((id) => ({
                  id,
                })),
              }
            : undefined,

        // Replace tags only when tagIds is provided
        tags:
          tagIds !== undefined
            ? {
                set: tagIds.map((id) => ({
                  id,
                })),
              }
            : undefined,
      },

      // Return updated relations in the response
      include: {
        categories: true,
        tags: true,
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
    assertPostAccess(post.authorId, currentUserId, currentUserRole, 'delete');

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

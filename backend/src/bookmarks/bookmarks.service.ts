import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

@Injectable()
export class BookmarksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, postId: string) {
    // Make sure the target post exists
    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: {
        id: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    // Prevent duplicate bookmarks.
    // If it already exists, simply return the existing bookmark.
    const existingBookmark = await this.prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingBookmark) {
      return existingBookmark;
    }

    return this.prisma.bookmark.create({
      data: {
        userId,
        postId,
      },
    });
  }

  async remove(userId: string, postId: string) {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found.');
    }

    await this.prisma.bookmark.delete({
      where: {
        id: bookmark.id,
      },
    });

    return {
      message: 'Bookmark removed successfully.',
    };
  }

  async findMine(userId: string) {
    return this.prisma.bookmark.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                name: true,
                avatarUrl: true,
              },
            },
            categories: true,
            tags: true,
          },
        },
      },
    });
  }
}

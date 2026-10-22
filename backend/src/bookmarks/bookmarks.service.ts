import { Injectable, NotFoundException } from '@nestjs/common';
import { PublishedPosts } from '../published-posts/published-posts';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class BookmarksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publishedPosts: PublishedPosts,
  ) {}

  async create(userId: string, postId: string) {
    await this.publishedPosts.requireById(postId);

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
        post: this.publishedPosts.where(),
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

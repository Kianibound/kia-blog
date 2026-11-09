import { Injectable } from '@nestjs/common';
import { PublishedPosts } from '../published-posts/published-posts';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { isUniqueConstraintError } from '../common/taxonomy-name';
import { presentPostsWithMedia } from '../media/body-image';

const BOOKMARK_REMOVED = { message: 'Bookmark removed successfully.' };

@Injectable()
export class BookmarksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publishedPosts: PublishedPosts,
  ) {}

  async create(userId: string, postId: string) {
    await this.publishedPosts.requireById(postId);

    // Idempotent: an existing bookmark is returned as-is.
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

    try {
      return await this.prisma.bookmark.create({
        data: {
          userId,
          postId,
        },
      });
    } catch (error) {
      // Concurrent duplicate: the (userId, postId) unique index is the final
      // arbiter. Return the row the winning request created instead of failing.
      if (isUniqueConstraintError(error)) {
        const concurrent = await this.prisma.bookmark.findUnique({
          where: {
            userId_postId: {
              userId,
              postId,
            },
          },
        });
        if (concurrent) return concurrent;
      }
      throw error;
    }
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

    // Idempotent removal: an already-removed bookmark is a successful no-op.
    if (!bookmark) {
      return BOOKMARK_REMOVED;
    }

    try {
      await this.prisma.bookmark.delete({
        where: {
          id: bookmark.id,
        },
      });
    } catch (error) {
      // A concurrent removal of the same row is also a successful no-op.
      if (
        !(
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2025'
        )
      )
        throw error;
    }

    return BOOKMARK_REMOVED;
  }

  async findMine(userId: string) {
    const bookmarks = await this.prisma.bookmark.findMany({
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
    const posts = await presentPostsWithMedia(
      this.prisma,
      bookmarks.map((bookmark) => bookmark.post),
    );
    return bookmarks.map((bookmark, index) => ({
      ...bookmark,
      post: posts[index],
    }));
  }
}

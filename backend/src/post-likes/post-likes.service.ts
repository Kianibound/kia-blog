import { Injectable, NotFoundException } from '@nestjs/common';
import { PublishedPosts } from '../published-posts/published-posts';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PostLikesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publishedPosts: PublishedPosts,
  ) {}

  async create(userId: string, postId: string) {
    await this.publishedPosts.requireById(postId);

    // Prevent duplicate likes
    const existingLike = await this.prisma.postLike.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingLike) {
      return existingLike;
    }

    return this.prisma.postLike.create({
      data: {
        userId,
        postId,
      },
    });
  }

  async remove(userId: string, postId: string) {
    const like = await this.prisma.postLike.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (!like) {
      throw new NotFoundException('Like not found.');
    }

    await this.prisma.postLike.delete({
      where: {
        id: like.id,
      },
    });

    return {
      message: 'Like removed successfully.',
    };
  }

  async count(postId: string) {
    await this.publishedPosts.requireById(postId);

    const count = await this.prisma.postLike.count({
      where: {
        postId,
      },
    });

    return {
      postId,
      likes: count,
    };
  }
}

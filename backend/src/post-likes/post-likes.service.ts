import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PostLikesService {
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

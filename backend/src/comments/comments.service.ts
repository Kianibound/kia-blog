import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import type { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(postId: string, authorId: string, dto: CreateCommentDto) {
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

    // Create a top-level comment.
    // parentId stays null because this is not a reply.
    return this.prisma.comment.create({
      data: {
        content: dto.content,
        postId,
        authorId,
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
  }

  async findByPost(postId: string) {
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

    // Return top-level comments with their direct replies
    return this.prisma.comment.findMany({
      where: {
        postId,
        parentId: null,
      },
      orderBy: {
        createdAt: 'asc',
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

        // Load direct replies for each parent comment
        replies: {
          orderBy: {
            createdAt: 'asc',
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
        },
      },
    });
  }

  async reply(
    parentCommentId: string,
    authorId: string,
    dto: CreateCommentDto,
  ) {
    // Make sure the parent comment exists
    const parentComment = await this.prisma.comment.findUnique({
      where: {
        id: parentCommentId,
      },
      select: {
        id: true,
        postId: true,
      },
    });

    if (!parentComment) {
      throw new NotFoundException('Parent comment not found.');
    }

    // Create a reply using the same Comment model
    return this.prisma.comment.create({
      data: {
        content: dto.content,
        authorId,
        postId: parentComment.postId,

        // This makes the comment a reply
        parentId: parentComment.id,
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
  }
}

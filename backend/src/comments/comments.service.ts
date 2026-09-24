import { PrismaService } from '../database/prisma.service';
import type { CreateCommentDto } from './dto/create-comment.dto';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ROLE } from '../roles/constants/role.constants';
import type { RoleName } from '../roles/constants/role.constants';
import type { UpdateCommentDto } from './dto/update-comment.dto';

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

  async update(
    commentId: string,
    currentUserId: string,
    currentUserRole: RoleName,
    dto: UpdateCommentDto,
  ) {
    // Load the comment first so we can check ownership
    const comment = await this.prisma.comment.findUnique({
      where: {
        id: commentId,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found.');
    }

    const isOwner = comment.authorId === currentUserId;
    const isAdmin = currentUserRole === ROLE.ADMIN;

    // Users can only update their own comments.
    // Admins can update any comment.
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to update this comment.',
      );
    }

    // Update only the provided comment fields
    return this.prisma.comment.update({
      where: {
        id: commentId,
      },
      data: dto,
    });
  }

  async remove(
    commentId: string,
    currentUserId: string,
    currentUserRole: RoleName,
  ) {
    // Load the comment first so we can check ownership
    const comment = await this.prisma.comment.findUnique({
      where: {
        id: commentId,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found.');
    }

    const isOwner = comment.authorId === currentUserId;
    const isAdmin = currentUserRole === ROLE.ADMIN;

    // Users can only delete their own comments.
    // Admins can delete any comment.
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to delete this comment.',
      );
    }

    // Replies are also deleted because of onDelete: Cascade
    await this.prisma.comment.delete({
      where: {
        id: commentId,
      },
    });

    return {
      message: 'Comment deleted successfully.',
    };
  }
}

import { PrismaService } from '../database/prisma.service';
import type { CreateCommentDto } from './dto/create-comment.dto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ROLE } from '../roles/constants/role.constants';
import type { RoleName } from '../roles/constants/role.constants';
import type { UpdateCommentDto } from './dto/update-comment.dto';
import { PublishedPosts } from '../published-posts/published-posts';
import { CommentStatus } from '../generated/prisma/client';

// Comment content is trimmed; blank or whitespace-only input is rejected before
// any write, and the stored value is the trimmed text.
function normalizeCommentContent(content: unknown): string {
  if (typeof content !== 'string')
    throw new BadRequestException('Comment content must be a string.');
  const trimmed = content.trim();
  if (!trimmed)
    throw new BadRequestException('Comment content cannot be blank.');
  return trimmed;
}

const adminCommentSelect = {
  id: true,
  status: true,
  content: true,
  version: true,
  author: {
    select: {
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} as const;

// Explicit safe projection for the owner's personal comment list.
const myCommentSelect = {
  id: true,
  content: true,
  status: true,
  version: true,
  postId: true,
  authorId: true,
  parentId: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publishedPosts: PublishedPosts,
  ) {}

  async create(postId: string, authorId: string, dto: CreateCommentDto) {
    await this.publishedPosts.requireById(postId);
    const content = normalizeCommentContent(dto.content);

    // Create a top-level comment.
    // parentId stays null because this is not a reply.
    return this.prisma.comment.create({
      data: {
        content,
        postId,
        authorId,
        // New comments stay hidden from public reads until approved.
        status: CommentStatus.PENDING,
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
    await this.publishedPosts.requireById(postId);

    // Return only APPROVED top-level comments with their APPROVED direct replies
    return this.prisma.comment.findMany({
      where: {
        postId,
        parentId: null,
        status: CommentStatus.APPROVED,
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

        // Load approved direct replies for each parent comment
        replies: {
          where: {
            status: CommentStatus.APPROVED,
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
          },
        },
      },
    });
  }

  // ADMIN dashboard inventory: moderation fields plus minimal safe author
  // identity, without article references.
  async findAdminInventory(page: number, limit: number) {
    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: adminCommentSelect,
      }),
      this.prisma.comment.count(),
    ]);

    return {
      data: comments,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async approve(commentId: string, version: number) {
    // One atomic conditional update: only the revision the ADMIN loaded can be
    // approved while it is still PENDING. A concurrent content edit bumps the
    // version (and resets to PENDING), so a stale approval changes nothing.
    const result = await this.prisma.comment.updateMany({
      where: {
        id: commentId,
        status: CommentStatus.PENDING,
        version,
      },
      data: {
        status: CommentStatus.APPROVED,
        version: { increment: 1 },
      },
    });

    if (result.count === 0) {
      const existing = await this.prisma.comment.findUnique({
        where: { id: commentId },
        select: { id: true, status: true },
      });
      if (!existing) throw new NotFoundException('Comment not found.');
      throw new ConflictException(
        'Comment changed since it was loaded; reload and retry.',
      );
    }

    const approved = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: adminCommentSelect,
    });
    if (!approved) throw new NotFoundException('Comment not found.');
    return approved;
  }

  // The authenticated user's own comments, in every status, newest first.
  async findMine(userId: string, page: number, limit: number) {
    const where = { authorId: userId };
    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: myCommentSelect,
      }),
      this.prisma.comment.count({ where }),
    ]);

    return {
      data: comments,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async reply(
    parentCommentId: string,
    authorId: string,
    dto: CreateCommentDto,
  ) {
    // Make sure the parent comment exists
    const parentComment = await this.prisma.comment.findFirst({
      where: {
        id: parentCommentId,
        post: this.publishedPosts.where(),
      },
      select: {
        id: true,
        postId: true,
      },
    });

    if (!parentComment) {
      throw new NotFoundException('Parent comment not found.');
    }

    const content = normalizeCommentContent(dto.content);

    // Create a reply using the same Comment model
    return this.prisma.comment.create({
      data: {
        content,
        authorId,
        postId: parentComment.postId,

        // This makes the comment a reply
        parentId: parentComment.id,

        // Replies are moderated the same way as top-level comments.
        status: CommentStatus.PENDING,
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

    // Editing content atomically returns the comment to PENDING, so revised text
    // stays hidden until it is reviewed again. The version bump invalidates any
    // approval prepared against the previous revision.
    const data =
      dto.content === undefined
        ? {}
        : {
            content: normalizeCommentContent(dto.content),
            status: CommentStatus.PENDING,
            version: { increment: 1 },
          };

    return this.prisma.comment.update({
      where: {
        id: commentId,
      },
      data,
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

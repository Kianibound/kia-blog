import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PostStatus } from '../generated/prisma/client';
import type { Prisma } from '../generated/prisma/client';

// Shared visibility seam for public reads and new interactions, not owner/admin access.
@Injectable()
export class PublishedPosts {
  constructor(private readonly prisma: PrismaService) {}

  where(): Prisma.PostWhereInput {
    return { status: PostStatus.PUBLISHED } satisfies Prisma.PostWhereInput;
  }

  async requireById(id: string): Promise<void> {
    const post = await this.prisma.post.findFirst({
      where: { id, ...this.where() },
      select: { id: true },
    });
    if (!post) {
      throw new NotFoundException('Post not found.');
    }
  }
}

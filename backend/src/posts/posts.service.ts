import { Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import type { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(authorId: string, dto: CreatePostDto) {
    // Create a post owned by the authenticated author
    return this.prisma.post.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        content: dto.content,
        status: dto.status,
        authorId,
      },
    });
  }
}

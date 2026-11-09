import { Injectable } from '@nestjs/common';
import type { RoleName } from '../roles/constants/role.constants';
import type { CreatePostDto } from './dto/create-post.dto';
import type { UpdatePostDto } from './dto/update-post.dto';
import { PostCommands } from './post-commands';
import { PostQueries } from './post-queries';
import type { PostStatus } from '../generated/prisma/client';
import { PrismaService } from '../database/prisma.service';
import {
  resolveDocumentMedia,
  resolvePostCover,
  presentPostsWithMedia,
} from '../media/body-image';
import { ROLE } from '../roles/constants/role.constants';

// Stable external Posts interface; read/write organization stays private to the module.
@Injectable()
export class PostsService {
  constructor(
    private readonly commands: PostCommands,
    private readonly queries: PostQueries,
    private readonly prisma: PrismaService,
  ) {}

  async create(
    authorId: string,
    dto: CreatePostDto,
    role: RoleName = ROLE.AUTHOR,
  ) {
    return this.present(await this.commands.create(authorId, dto, role));
  }

  async findAll(
    page: number,
    limit: number,
    search?: string,
    sort: 'newest' | 'oldest' = 'newest',
    author?: string,
    category?: string,
    tag?: string,
  ) {
    const result = await this.queries.findAll({
      page,
      limit,
      search,
      sort,
      author,
      category,
      tag,
    });
    return {
      ...result,
      data: await presentPostsWithMedia(this.prisma, result.data),
    };
  }

  async findById(id: string) {
    return this.present(await this.queries.findById(id));
  }

  findAdminInventory(page: number, limit: number) {
    return this.queries.findAdminInventory(page, limit);
  }

  async findMine(
    authorId: string,
    page: number,
    limit: number,
    status?: PostStatus,
  ) {
    const result = await this.queries.findMine(authorId, page, limit, status);
    return {
      ...result,
      data: await presentPostsWithMedia(this.prisma, result.data),
    };
  }

  async findMineById(
    postId: string,
    currentUserId: string,
    currentUserRole: RoleName,
  ) {
    return this.present(
      await this.queries.findMineById(postId, currentUserId, currentUserRole),
    );
  }

  async findBySlug(slug: string) {
    return this.present(await this.queries.findBySlug(slug));
  }

  async update(
    postId: string,
    currentUserId: string,
    currentUserRole: RoleName,
    dto: UpdatePostDto,
  ) {
    return this.present(
      await this.commands.update(postId, currentUserId, currentUserRole, dto),
    );
  }

  remove(postId: string, currentUserId: string, currentUserRole: RoleName) {
    return this.commands.remove(postId, currentUserId, currentUserRole);
  }

  private async present<
    T extends {
      contentDocument?: unknown;
      coverMediaId?: string | null;
      coverAlt?: string | null;
    },
  >(post: T) {
    const { coverMediaId, coverAlt, ...responsePost } = post;
    return {
      ...responsePost,
      contentMedia: await resolveDocumentMedia(
        this.prisma,
        post.contentDocument,
      ),
      coverImage: await resolvePostCover(
        this.prisma,
        coverMediaId,
        coverAlt,
      ),
    };
  }
}

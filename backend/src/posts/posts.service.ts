import { Injectable } from '@nestjs/common';
import type { RoleName } from '../roles/constants/role.constants';
import type { CreatePostDto } from './dto/create-post.dto';
import type { UpdatePostDto } from './dto/update-post.dto';
import { PostCommands } from './post-commands';
import { PostQueries } from './post-queries';

// Stable external Posts interface; read/write organization stays private to the module.
@Injectable()
export class PostsService {
  constructor(
    private readonly commands: PostCommands,
    private readonly queries: PostQueries,
  ) {}

  create(authorId: string, dto: CreatePostDto) {
    return this.commands.create(authorId, dto);
  }

  findAll(
    page: number,
    limit: number,
    search?: string,
    sort: 'newest' | 'oldest' = 'newest',
    author?: string,
    category?: string,
    tag?: string,
  ) {
    return this.queries.findAll({
      page,
      limit,
      search,
      sort,
      author,
      category,
      tag,
    });
  }

  findById(id: string) {
    return this.queries.findById(id);
  }

  findMine(authorId: string, page: number, limit: number) {
    return this.queries.findMine(authorId, page, limit);
  }

  findMineById(
    postId: string,
    currentUserId: string,
    currentUserRole: RoleName,
  ) {
    return this.queries.findMineById(postId, currentUserId, currentUserRole);
  }

  findBySlug(slug: string) {
    return this.queries.findBySlug(slug);
  }

  update(
    postId: string,
    currentUserId: string,
    currentUserRole: RoleName,
    dto: UpdatePostDto,
  ) {
    return this.commands.update(postId, currentUserId, currentUserRole, dto);
  }

  remove(postId: string, currentUserId: string, currentUserRole: RoleName) {
    return this.commands.remove(postId, currentUserId, currentUserRole);
  }
}

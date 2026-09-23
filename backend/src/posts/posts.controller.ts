import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Delete,
  Query,
} from '@nestjs/common';
import { PaginationQueryDto } from './dto/pagination-query.dto';

import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

import { ROLE } from '../roles/constants/role.constants';
import type { AccessTokenPayload } from '../auth/types/access-token-payload.type';

import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.AUTHOR, ROLE.ADMIN)
  create(@CurrentUser() user: AccessTokenPayload, @Body() dto: CreatePostDto) {
    // The author identity comes from the verified access token
    return this.postsService.create(user.sub, dto);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.postsService.findAll(
      query.page,
      query.limit,
      query.search,
      query.sort,
      query.author,
      query.category,
      query.tag,
    );
  }

  @Get('by-id/:id')
  findById(@Param('id') id: string) {
    // Useful for internal/admin/testing lookups by database id
    return this.postsService.findById(id);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.AUTHOR, ROLE.ADMIN)
  findMine(
    @CurrentUser() user: AccessTokenPayload,
    @Query() query: PaginationQueryDto,
  ) {
    // Return only posts owned by the authenticated author
    return this.postsService.findMine(user.sub, query.page, query.limit);
  }

  @Get('mine/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.AUTHOR, ROLE.ADMIN)
  findMineById(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    // Allow authors to load their own drafts for editing
    return this.postsService.findMineById(id, user.sub, user.role);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.postsService.findBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.AUTHOR, ROLE.ADMIN)
  update(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: UpdatePostDto,
  ) {
    // Role checks access level, while the service checks ownership
    return this.postsService.update(id, user.sub, user.role, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.AUTHOR, ROLE.ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload) {
    // Role controls access level; the service enforces ownership
    return this.postsService.remove(id, user.sub, user.role);
  }
}

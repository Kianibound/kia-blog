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

import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new post' })
  @ApiBody({
    schema: {
      example: {
        title: 'My First Post',
        content: 'This is the post content.',
        status: 'PUBLISHED',
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Post created successfully.' })
  @ApiResponse({
    status: 403,
    description: 'Only AUTHOR or ADMIN can create posts.',
  })
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.AUTHOR, ROLE.ADMIN)
  create(@CurrentUser() user: AccessTokenPayload, @Body() dto: CreatePostDto) {
    // The author identity comes from the verified access token
    return this.postsService.create(user.sub, dto);
  }

  @ApiOperation({ summary: 'Get published posts with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Published posts returned successfully.',
  })
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

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get a post by database ID (admin only)' })
  @ApiResponse({ status: 200, description: 'Post returned successfully.' })
  @ApiResponse({ status: 403, description: 'Admin access required.' })
  @Get('by-id/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  findById(@Param('id') id: string) {
    // Internal/admin lookup by database id
    return this.postsService.findById(id);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get posts owned by the current author' })
  @ApiResponse({
    status: 200,
    description: 'Author posts returned successfully.',
  })
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

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get one post owned by the current author' })
  @ApiResponse({ status: 200, description: 'Post returned successfully.' })
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

  @ApiOperation({ summary: 'Get a published post by slug' })
  @ApiResponse({
    status: 200,
    description: 'Published post returned successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found or not publicly available.',
  })
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.postsService.findBySlug(slug);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a post owned by the current author' })
  @ApiBody({
    schema: {
      example: {
        title: 'Updated Post Title',
        content: 'Updated content.',
        status: 'PUBLISHED',
        categoryIds: ['550e8400-e29b-41d4-a716-446655440000'],
        tagIds: ['550e8400-e29b-41d4-a716-446655440001'],
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Post updated successfully.' })
  @ApiResponse({
    status: 403,
    description: 'User is not allowed to update this post.',
  })
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

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a post owned by the current author' })
  @ApiResponse({ status: 200, description: 'Post deleted successfully.' })
  @ApiResponse({
    status: 403,
    description: 'User is not allowed to delete this post.',
  })
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.AUTHOR, ROLE.ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload) {
    // Role controls access level; the service enforces ownership
    return this.postsService.remove(id, user.sub, user.role);
  }
}

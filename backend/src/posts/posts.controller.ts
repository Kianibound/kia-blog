import {
  PostWriteResponseDto,
  PostFeedResponseDto,
  PostDetailResponseDto,
  MyPostsResponseDto,
  AdminPostsResponseDto,
} from './dto/post-response.dto';
import {
  ErrorResponseDto,
  MessageResponseDto,
} from '../common/dto/response.dto';
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
import { MyPostsQueryDto } from './dto/my-posts-query.dto';
import { AdminPostsQueryDto } from './dto/admin-posts-query.dto';
import { RichDocumentGuard } from './rich-document.guard';

import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../access-control/guards/jwt-auth.guard';
import { RolesGuard } from '../access-control/guards/roles.guard';
import { CurrentUser } from '../access-control/decorators/current-user.decorator';
import { Roles } from '../access-control/decorators/roles.decorator';

import { ROLE } from '../roles/constants/role.constants';
import type { AccessTokenPayload } from '../access-control/types/access-token-payload.type';

import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';

import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';

@ApiTags('Posts')
@ApiExtraModels(CreatePostDto, UpdatePostDto)
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get('admin/inventory')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Inventory all posts (admin only)',
    description:
      'All authors and publication statuses, including DRAFT and DEPRECATED. Pagination only. Ordered by createdAt descending, then id descending for ties. Returns compact summaries and safe author identity; existing mutation endpoints are unchanged.',
  })
  @ApiResponse({
    status: 200,
    type: AdminPostsResponseDto,
    description: 'Paginated inventory across all authors and statuses.',
  })
  @ApiResponse({
    status: 400,
    type: ErrorResponseDto,
    description: 'Invalid pagination or unsupported query fields.',
  })
  @ApiResponse({
    status: 401,
    type: ErrorResponseDto,
    description: 'Valid authenticated session required.',
  })
  @ApiResponse({
    status: 403,
    type: ErrorResponseDto,
    description: 'ADMIN required.',
  })
  findAdminInventory(@Query() query: AdminPostsQueryDto) {
    return this.postsService.findAdminInventory(query.page, query.limit);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new post' })
  @ApiBody({
    schema: {
      allOf: [{ $ref: getSchemaPath(CreatePostDto) }],
      oneOf: [
        {
          type: 'object',
          required: ['content'],
          not: { required: ['contentDocument'] },
        },
        {
          type: 'object',
          required: ['contentDocument'],
          not: { required: ['content'] },
        },
      ],
    },
    examples: {
      default: {
        value: {
          title: 'My First Post',
          content: 'This is the post content.',
          status: 'PUBLISHED',
        },
      },
    },
  })
  @ApiResponse({
    type: PostWriteResponseDto,
    status: 201,
    description: 'Post created successfully.',
  })
  @ApiResponse({
    type: ErrorResponseDto,
    status: 403,
    description: 'Only AUTHOR or ADMIN can create posts.',
  })
  @Post()
  @ApiResponse({
    status: 400,
    type: ErrorResponseDto,
    description:
      'Invalid fields, ambiguous content sources, unsupported/unsafe rich document, or document limits exceeded.',
  })
  @ApiResponse({
    status: 413,
    type: ErrorResponseDto,
    description: 'Request exceeds the existing HTTP parser body limit.',
  })
  @UseGuards(JwtAuthGuard, RolesGuard, RichDocumentGuard)
  @Roles(ROLE.AUTHOR, ROLE.ADMIN)
  create(@CurrentUser() user: AccessTokenPayload, @Body() dto: CreatePostDto) {
    // The author identity comes from the verified access token
    return this.postsService.create(user.sub, dto);
  }

  @ApiOperation({ summary: 'Get published posts with pagination and filters' })
  @ApiResponse({
    type: PostFeedResponseDto,
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
  @ApiResponse({
    type: PostDetailResponseDto,
    status: 200,
    description: 'Post returned successfully.',
  })
  @ApiResponse({
    type: ErrorResponseDto,
    status: 403,
    description: 'Admin access required.',
  })
  @Get('by-id/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  findById(@Param('id') id: string) {
    // Internal/admin lookup by database id
    return this.postsService.findById(id);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get posts owned by the current author',
    description:
      'Optionally filter DRAFT or PUBLISHED before pagination. Omitting status includes DEPRECATED. Results and totals remain scoped to the authenticated owner and ordered by createdAt descending.',
  })
  @ApiResponse({
    type: MyPostsResponseDto,
    status: 200,
    description: 'Author posts returned successfully.',
  })
  @Get('mine')
  @ApiResponse({
    status: 400,
    type: ErrorResponseDto,
    description:
      'Invalid status or pagination. Only DRAFT and PUBLISHED are valid explicit status filters.',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.AUTHOR, ROLE.ADMIN)
  findMine(
    @CurrentUser() user: AccessTokenPayload,
    @Query() query: MyPostsQueryDto,
  ) {
    // Return only posts owned by the authenticated author
    return this.postsService.findMine(
      user.sub,
      query.page,
      query.limit,
      query.status,
    );
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get one post owned by the current author' })
  @ApiResponse({
    type: PostDetailResponseDto,
    status: 200,
    description: 'Post returned successfully.',
  })
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
    type: PostDetailResponseDto,
    status: 200,
    description: 'Published post returned successfully.',
  })
  @ApiResponse({
    type: ErrorResponseDto,
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
      allOf: [{ $ref: getSchemaPath(UpdatePostDto) }],
      not: { required: ['content', 'contentDocument'] },
    },
    examples: {
      default: {
        value: {
          title: 'Updated Post Title',
          content: 'Updated content.',
          status: 'PUBLISHED',
          categoryIds: ['550e8400-e29b-41d4-a716-446655440000'],
          tagIds: ['550e8400-e29b-41d4-a716-446655440001'],
        },
      },
    },
  })
  @ApiResponse({
    type: PostWriteResponseDto,
    status: 200,
    description: 'Post updated successfully.',
  })
  @ApiResponse({
    type: ErrorResponseDto,
    status: 403,
    description: 'User is not allowed to update this post.',
  })
  @Patch(':id')
  @ApiResponse({
    status: 400,
    type: ErrorResponseDto,
    description:
      'Invalid fields, ambiguous content sources, unsupported/unsafe rich document, or document limits exceeded.',
  })
  @ApiResponse({
    status: 413,
    type: ErrorResponseDto,
    description: 'Request exceeds the existing HTTP parser body limit.',
  })
  @UseGuards(JwtAuthGuard, RolesGuard, RichDocumentGuard)
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
  @ApiResponse({
    type: MessageResponseDto,
    status: 200,
    description: 'Post deleted successfully.',
  })
  @ApiResponse({
    type: ErrorResponseDto,
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

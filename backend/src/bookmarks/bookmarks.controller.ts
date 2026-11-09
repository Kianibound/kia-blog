import {
  BookmarkResponseDto,
  BookmarkDetailResponseDto,
} from './dto/bookmark-response.dto';
import { ErrorResponseDto, MessageResponseDto } from '../common/dto/response.dto';
import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../access-control/decorators/current-user.decorator';
import { JwtAuthGuard } from '../access-control/guards/jwt-auth.guard';
import type { AccessTokenPayload } from '../access-control/types/access-token-payload.type';
import { BookmarksService } from './bookmarks.service';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Bookmarks')
@ApiBearerAuth('access-token')
@Controller()
@UseGuards(JwtAuthGuard)
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @ApiOperation({
    summary: 'Bookmark a published post',
    description:
      'Idempotent: repeating the request, or a concurrent duplicate, returns the existing bookmark row instead of creating a second one.',
  })
  @ApiResponse({
    type: BookmarkResponseDto,
    status: 201,
    description: 'Post bookmarked successfully (or already bookmarked).',
  })
  @ApiResponse({
    type: ErrorResponseDto,
    status: 401,
    description: 'Valid authenticated session required.',
  })
  @ApiResponse({
    type: ErrorResponseDto,
    status: 404,
    description: 'Post not found or not published.',
  })
  @Post('posts/:postId/bookmark')
  create(
    @Param('postId') postId: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.bookmarksService.create(user.sub, postId);
  }

  @ApiOperation({
    summary: 'Remove a bookmark from a post',
    description:
      'Idempotent: removing an already-removed bookmark (including a concurrent repeat) still succeeds with 200.',
  })
  @ApiResponse({
    type: MessageResponseDto,
    status: 200,
    description: 'Bookmark removed successfully.',
  })
  @ApiResponse({
    type: ErrorResponseDto,
    status: 401,
    description: 'Valid authenticated session required.',
  })
  @Delete('posts/:postId/bookmark')
  remove(
    @Param('postId') postId: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.bookmarksService.remove(user.sub, postId);
  }

  @ApiOperation({
    summary: 'Get bookmarks for the current user',
    description:
      'Returns only bookmarks whose post is still PUBLISHED, newest first, scoped to the authenticated user.',
  })
  @ApiResponse({
    type: [BookmarkDetailResponseDto],
    status: 200,
    description:
      'Bookmarks returned successfully, each with a resolved post projection.',
  })
  @ApiResponse({
    type: ErrorResponseDto,
    status: 401,
    description: 'Valid authenticated session required.',
  })
  @Get('bookmarks')
  findMine(@CurrentUser() user: AccessTokenPayload) {
    return this.bookmarksService.findMine(user.sub);
  }
}

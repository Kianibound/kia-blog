import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AccessTokenPayload } from '../auth/types/access-token-payload.type';
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

  @ApiOperation({ summary: 'Bookmark a published post' })
  @ApiResponse({ status: 201, description: 'Post bookmarked successfully.' })
  @Post('posts/:postId/bookmark')
  create(
    @Param('postId') postId: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.bookmarksService.create(user.sub, postId);
  }

  @ApiOperation({ summary: 'Remove a bookmark from a post' })
  @ApiResponse({ status: 200, description: 'Bookmark removed successfully.' })
  @Delete('posts/:postId/bookmark')
  remove(
    @Param('postId') postId: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.bookmarksService.remove(user.sub, postId);
  }

  @ApiOperation({ summary: 'Get bookmarks for the current user' })
  @ApiResponse({ status: 200, description: 'Bookmarks returned successfully.' })
  @Get('bookmarks')
  findMine(@CurrentUser() user: AccessTokenPayload) {
    return this.bookmarksService.findMine(user.sub);
  }
}

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

@Controller()
@UseGuards(JwtAuthGuard)
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post('posts/:postId/bookmark')
  create(
    @Param('postId') postId: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.bookmarksService.create(user.sub, postId);
  }

  @Delete('posts/:postId/bookmark')
  remove(
    @Param('postId') postId: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.bookmarksService.remove(user.sub, postId);
  }

  @Get('bookmarks')
  findMine(@CurrentUser() user: AccessTokenPayload) {
    return this.bookmarksService.findMine(user.sub);
  }
}

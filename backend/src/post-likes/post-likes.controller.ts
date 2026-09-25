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
import { PostLikesService } from './post-likes.service';

@Controller()
export class PostLikesController {
  constructor(private readonly postLikesService: PostLikesService) {}

  @Post('posts/:postId/like')
  @UseGuards(JwtAuthGuard)
  create(
    @Param('postId') postId: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.postLikesService.create(user.sub, postId);
  }

  @Delete('posts/:postId/like')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('postId') postId: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.postLikesService.remove(user.sub, postId);
  }

  @Get('posts/:postId/likes')
  count(@Param('postId') postId: string) {
    return this.postLikesService.count(postId);
  }
}

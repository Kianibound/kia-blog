import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AccessTokenPayload } from '../auth/types/access-token-payload.type';

import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('posts/:postId/comments')
  @UseGuards(JwtAuthGuard)
  create(
    @Param('postId') postId: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateCommentDto,
  ) {
    // user.sub is the authenticated user's id
    return this.commentsService.create(postId, user.sub, dto);
  }

  @Get('posts/:postId/comments')
  findByPost(@Param('postId') postId: string) {
    // Public endpoint for reading post comments
    return this.commentsService.findByPost(postId);
  }

  @Post('comments/:commentId/replies')
  @UseGuards(JwtAuthGuard)
  reply(
    @Param('commentId') commentId: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.reply(commentId, user.sub, dto);
  }
}

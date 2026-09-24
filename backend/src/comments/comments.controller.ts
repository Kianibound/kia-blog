import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

import type { AccessTokenPayload } from '../auth/types/access-token-payload.type';
import { UpdateCommentDto } from './dto/update-comment.dto';

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

  @Patch('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('commentId') commentId: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: UpdateCommentDto,
  ) {
    // Ownership is checked inside CommentsService
    return this.commentsService.update(commentId, user.sub, user.role, dto);
  }

  @Delete('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('commentId') commentId: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    // Ownership is checked inside CommentsService
    return this.commentsService.remove(commentId, user.sub, user.role);
  }
}

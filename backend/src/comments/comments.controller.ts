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

import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Comments')
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Add a comment to a published post' })
  @ApiBody({
    schema: {
      example: {
        content: 'This is a comment.',
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Comment created successfully.' })
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

  @ApiOperation({ summary: 'Get comments and replies for a post' })
  @ApiResponse({ status: 200, description: 'Comments returned successfully.' })
  @Get('posts/:postId/comments')
  findByPost(@Param('postId') postId: string) {
    // Public endpoint for reading post comments
    return this.commentsService.findByPost(postId);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Reply to a comment' })
  @ApiBody({
    schema: {
      example: {
        content: 'This is a reply.',
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Reply created successfully.' })
  @Post('comments/:commentId/replies')
  @UseGuards(JwtAuthGuard)
  reply(
    @Param('commentId') commentId: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.reply(commentId, user.sub, dto);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a comment owned by the current user' })
  @ApiBody({
    schema: {
      example: {
        content: 'Updated comment content.',
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Comment updated successfully.' })
  @ApiResponse({ status: 403, description: 'User cannot update this comment.' })
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

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully.' })
  @ApiResponse({ status: 403, description: 'User cannot delete this comment.' })
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

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

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Likes')
@Controller()
export class PostLikesController {
  constructor(private readonly postLikesService: PostLikesService) {}

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Like a published post' })
  @ApiResponse({ status: 201, description: 'Post liked successfully.' })
  @Post('posts/:postId/like')
  @UseGuards(JwtAuthGuard)
  create(
    @Param('postId') postId: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.postLikesService.create(user.sub, postId);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Remove the current user’s like from a post' })
  @ApiResponse({ status: 200, description: 'Like removed successfully.' })
  @Delete('posts/:postId/like')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('postId') postId: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.postLikesService.remove(user.sub, postId);
  }

  @ApiOperation({ summary: 'Get the like count for a post' })
  @ApiResponse({
    status: 200,
    description: 'Like count returned successfully.',
  })
  @Get('posts/:postId/likes')
  count(@Param('postId') postId: string) {
    return this.postLikesService.count(postId);
  }
}

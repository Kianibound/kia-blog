import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

import { ROLE } from '../roles/constants/role.constants';
import type { AccessTokenPayload } from '../auth/types/access-token-payload.type';

import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.AUTHOR, ROLE.ADMIN)
  create(@CurrentUser() user: AccessTokenPayload, @Body() dto: CreatePostDto) {
    // The author identity comes from the verified access token
    return this.postsService.create(user.sub, dto);
  }
}

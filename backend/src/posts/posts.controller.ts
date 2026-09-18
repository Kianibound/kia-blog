import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { UpdatePostDto } from './dto/update-post.dto';
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

  @Get()
  findAll() {
    return this.postsService.findAll();
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.AUTHOR, ROLE.ADMIN)
  findMine(@CurrentUser() user: AccessTokenPayload) {
    // user.sub is the authenticated author's id
    return this.postsService.findMine(user.sub);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.postsService.findBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.AUTHOR, ROLE.ADMIN)
  update(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: UpdatePostDto,
  ) {
    // Role checks access level, while the service checks ownership
    return this.postsService.update(id, user.sub, user.role, dto);
  }
}

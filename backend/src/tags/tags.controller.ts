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
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ROLE } from '../roles/constants/role.constants';

import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @ApiOperation({ summary: 'Get all tags' })
  @ApiResponse({ status: 200, description: 'Tags returned successfully.' })
  @Get()
  findAll() {
    return this.tagsService.findAll();
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a tag (admin only)' })
  @ApiBody({
    schema: {
      example: {
        name: 'NestJS',
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Tag created successfully.' })
  @ApiResponse({ status: 403, description: 'Admin access required.' })
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  create(@Body() dto: CreateTagDto) {
    return this.tagsService.create(dto);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a tag (admin only)' })
  @ApiBody({
    schema: {
      example: {
        name: 'Backend',
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Tag updated successfully.' })
  @ApiResponse({ status: 403, description: 'Admin access required.' })
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateTagDto) {
    return this.tagsService.update(id, dto);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a tag (admin only)' })
  @ApiResponse({ status: 200, description: 'Tag deleted successfully.' })
  @ApiResponse({ status: 403, description: 'Admin access required.' })
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  remove(@Param('id') id: string) {
    return this.tagsService.remove(id);
  }
}

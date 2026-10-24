import {
  ErrorResponseDto,
  TaxonomyResponseDto,
  MessageResponseDto,
} from '../common/dto/response.dto';
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

import { JwtAuthGuard } from '../access-control/guards/jwt-auth.guard';
import { RolesGuard } from '../access-control/guards/roles.guard';
import { Roles } from '../access-control/decorators/roles.decorator';
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
  @ApiResponse({
    type: [TaxonomyResponseDto],
    status: 200,
    description: 'Tags returned successfully.',
  })
  @Get()
  findAll() {
    return this.tagsService.findAll();
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a tag (admin only)' })
  @ApiBody({
    type: CreateTagDto,
    examples: {
      default: {
        value: {
          name: 'NestJS',
        },
      },
    },
  })
  @ApiResponse({
    type: TaxonomyResponseDto,
    status: 201,
    description: 'Tag created successfully.',
  })
  @ApiResponse({
    type: ErrorResponseDto,
    status: 403,
    description: 'Admin access required.',
  })
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  create(@Body() dto: CreateTagDto) {
    return this.tagsService.create(dto);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a tag (admin only)' })
  @ApiBody({
    type: UpdateTagDto,
    examples: {
      default: {
        value: {
          name: 'Backend',
        },
      },
    },
  })
  @ApiResponse({
    type: TaxonomyResponseDto,
    status: 200,
    description: 'Tag updated successfully.',
  })
  @ApiResponse({
    type: ErrorResponseDto,
    status: 403,
    description: 'Admin access required.',
  })
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateTagDto) {
    return this.tagsService.update(id, dto);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a tag (admin only)' })
  @ApiResponse({
    type: MessageResponseDto,
    status: 200,
    description: 'Tag deleted successfully.',
  })
  @ApiResponse({
    type: ErrorResponseDto,
    status: 403,
    description: 'Admin access required.',
  })
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  remove(@Param('id') id: string) {
    return this.tagsService.remove(id);
  }
}

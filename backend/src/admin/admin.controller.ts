import { ErrorResponseDto } from '../common/dto/response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { CreateAuthorDto } from './dto/create-author.dto';

import { JwtAuthGuard } from '../access-control/guards/jwt-auth.guard';
import { RolesGuard } from '../access-control/guards/roles.guard';
import { Roles } from '../access-control/decorators/roles.decorator';

import { ROLE } from '../roles/constants/role.constants';
import { UsersService } from '../users/users.service';

import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.ADMIN)
export class AdminController {
  constructor(private readonly usersService: UsersService) {}

  @Post('authors')
  @ApiOperation({
    summary: 'Create an AUTHOR (admin only)',
    description:
      'Creates a new AUTHOR with name, email and initial password. No invitation, email, activation, reset or session is created. The AUTHOR can immediately use POST /auth/login. Existing accounts are never promoted by this endpoint.',
  })
  @ApiBody({ type: CreateAuthorDto })
  @ApiResponse({
    status: 201,
    type: UserResponseDto,
    description:
      'AUTHOR created; safe account fields only, no credentials or tokens.',
  })
  @ApiResponse({
    status: 400,
    type: ErrorResponseDto,
    description: 'Invalid name/email/password or undeclared fields.',
  })
  @ApiResponse({
    status: 401,
    type: ErrorResponseDto,
    description: 'Valid authenticated session required.',
  })
  @ApiResponse({
    status: 403,
    type: ErrorResponseDto,
    description: 'ADMIN required.',
  })
  @ApiResponse({
    status: 409,
    type: ErrorResponseDto,
    description:
      'Email or generated username already exists; existing account is unchanged.',
  })
  createAuthor(@Body() dto: CreateAuthorDto) {
    return this.usersService.createAuthor(dto);
  }

  @ApiOperation({ summary: 'Get all users (admin only)' })
  @ApiResponse({
    type: [UserResponseDto],
    status: 200,
    description: 'Users returned successfully.',
  })
  @ApiResponse({
    type: ErrorResponseDto,
    status: 403,
    description: 'Admin access required.',
  })
  @Get('users')
  findUsers() {
    return this.usersService.findAll();
  }

  @ApiOperation({
    summary: 'Change a user role (admin only)',
    description:
      'Existing USER accounts cannot become AUTHOR. Create new authors through POST /admin/authors.',
  })
  @ApiBody({
    type: UpdateUserRoleDto,
    examples: {
      default: {
        value: {
          role: 'ADMIN',
        },
      },
    },
  })
  @ApiResponse({
    type: UserResponseDto,
    status: 200,
    description: 'User role updated successfully.',
  })
  @ApiResponse({
    type: ErrorResponseDto,
    status: 403,
    description: 'Admin access required.',
  })
  @Patch('users/:id/role')
  @ApiResponse({
    status: 409,
    type: ErrorResponseDto,
    description:
      'Existing USER-to-AUTHOR promotion is prohibited or the account changed concurrently.',
  })
  updateUserRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.usersService.updateRole(id, dto.role);
  }

  @ApiOperation({ summary: 'Get a user by ID (admin only)' })
  @ApiResponse({
    type: UserResponseDto,
    status: 200,
    description: 'User returned successfully.',
  })
  @ApiResponse({
    type: ErrorResponseDto,
    status: 404,
    description: 'User not found.',
  })
  @Get('users/:id')
  findUserById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}

import { ErrorResponseDto } from '../common/dto/response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';

import { UpdateUserRoleDto } from './dto/update-user-role.dto';

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

  @ApiOperation({ summary: 'Change a user role (admin only)' })
  @ApiBody({
    type: UpdateUserRoleDto,
    examples: {
      default: {
        value: {
          role: 'AUTHOR',
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

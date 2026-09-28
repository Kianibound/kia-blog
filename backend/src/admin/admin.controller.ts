import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';

import { UpdateUserRoleDto } from './dto/update-user-role.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { ROLE } from '../roles/constants/role.constants';
import { UsersService } from '../users/users.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.ADMIN)
export class AdminController {
  constructor(private readonly usersService: UsersService) {}

  @Get('users')
  findUsers() {
    return this.usersService.findAll();
  }

  @Patch('users/:id/role')
  updateUserRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.usersService.updateRole(id, dto.role);
  }
}

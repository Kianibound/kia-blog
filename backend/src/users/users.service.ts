import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { userPublicSelect } from './user.select';
import { UserResponseDto } from './dto/user-response.dto';
import { RolesService } from '../roles/roles.service';
import { RoleName } from '../roles/constants/role.constants';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rolesService: RolesService,
  ) {}

  async findAll(): Promise<UserResponseDto[]> {
    return this.prisma.user.findMany({
      select: userPublicSelect,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userPublicSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  async create(data: {
    email: string;
    username: string;
    name: string;
    passwordHash: string;
    roleId: string;
  }): Promise<UserResponseDto> {
    return this.prisma.user.create({
      data,
      select: userPublicSelect,
    });
  }

  async findByEmailForAuth(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  async updateRole(
    userId: string,
    roleName: RoleName,
  ): Promise<UserResponseDto> {
    // Make sure the target user exists
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // System roles are seeded and resolved by RolesService
    const role = await this.rolesService.findRequiredByName(roleName);

    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        roleId: role.id,
      },
      select: userPublicSelect,
    });
  }
}

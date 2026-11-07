import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { userAdminSelect, userPublicSelect } from './user.select';
import { UserResponseDto } from './dto/user-response.dto';
import { RolesService } from '../roles/roles.service';
import { RoleName } from '../roles/constants/role.constants';
import { createHash } from 'node:crypto';
import * as argon2 from 'argon2';
import { Prisma } from '../generated/prisma/client';
import type { AdminUserResponseDto } from '../admin/dto/admin-user-response.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rolesService: RolesService,
  ) {}

  async deactivateAuthor(id: string): Promise<AdminUserResponseDto> {
    return this.prisma.$transaction(async (transaction) => {
      const now = new Date();
      // Conditional write preserves the first disabled timestamp on repeats and
      // prevents a concurrent role change from disabling a non-AUTHOR.
      await transaction.user.updateMany({
        where: { id, role: { is: { name: 'AUTHOR' } }, disabledAt: null },
        data: { disabledAt: now },
      });
      const user = await transaction.user.findUnique({
        where: { id },
        select: userAdminSelect,
      });
      if (!user) throw new NotFoundException('User not found.');
      if (user.role?.name !== 'AUTHOR')
        throw new ConflictException('Only AUTHOR accounts can be deactivated.');
      if (!user.disabledAt)
        throw new ConflictException('Account changed; retry deactivation.');
      // Same RefreshToken revocation contract as logout-all/password reset,
      // committed atomically with deactivation. No User or content is deleted.
      await transaction.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: now },
      });
      return user;
    });
  }

  async findAll(): Promise<AdminUserResponseDto[]> {
    return this.prisma.user.findMany({
      select: userAdminSelect,
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

  async findAdminById(id: string): Promise<AdminUserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userAdminSelect,
    });
    if (!user) throw new NotFoundException('User not found.');
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

  async createAuthor(input: {
    name: string;
    email: string;
    password: string;
  }): Promise<AdminUserResponseDto> {
    const existing = await this.prisma.user.findFirst({
      where: { email: { equals: input.email, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existing)
      throw new ConflictException(
        'An account with this email or username already exists.',
      );
    const role = await this.rolesService.findRequiredByName('AUTHOR');
    const passwordHash = await argon2.hash(input.password);
    return this.prisma.user
      .create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          roleId: role.id,
          username: `user_${createHash('sha256').update(input.email).digest('hex')}`,
        },
        select: userAdminSelect,
      })
      .catch((error: unknown) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictException(
            'An account with this email or username already exists.',
          );
        }
        // Persistence diagnostics may contain the hash. Do not log or attach them.
        throw new InternalServerErrorException('Author creation failed.');
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
  ): Promise<AdminUserResponseDto> {
    // Make sure the target user exists
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        role: { select: { name: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (roleName === 'AUTHOR' && user.role?.name === 'USER') {
      throw new ConflictException(
        'Existing USER accounts cannot become AUTHOR.',
      );
    }

    // System roles are seeded and resolved by RolesService
    const role = await this.rolesService.findRequiredByName(roleName);

    return this.prisma.user
      .update({
        where: {
          id: userId,
          // Enforce the same rule at write time if the stored role changes concurrently.
          ...(roleName === 'AUTHOR' && {
            NOT: { role: { is: { name: 'USER' } } },
          }),
        },
        data: {
          roleId: role.id,
        },
        select: userAdminSelect,
      })
      .catch((error: unknown) => {
        if (
          roleName === 'AUTHOR' &&
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          throw new ConflictException(
            'Account changed; existing USER accounts cannot become AUTHOR.',
          );
        }
        throw error;
      });
  }
}

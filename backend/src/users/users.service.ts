import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { userPublicSelect } from './user.select';
import { UserResponseDto } from './dto/user-response.dto';
import { RolesService } from '../roles/roles.service';
import { RoleName } from '../roles/constants/role.constants';
import { createHash } from 'node:crypto';
import * as argon2 from 'argon2';
import { Prisma } from '../generated/prisma/client';

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

  async createAuthor(input: {
    name: string;
    email: string;
    password: string;
  }): Promise<UserResponseDto> {
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
    return this.create({
      name: input.name,
      email: input.email,
      passwordHash,
      roleId: role.id,
      username: `user_${createHash('sha256').update(input.email).digest('hex')}`,
    }).catch((error: unknown) => {
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
  ): Promise<UserResponseDto> {
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
        select: userPublicSelect,
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

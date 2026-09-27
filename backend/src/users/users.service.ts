import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { userPublicSelect } from './user.select';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { MediaService } from '../media/media.service';
import type { RoleName } from '../roles/constants/role.constants';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findAll() {
    return this.prisma.user.findMany();
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

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    await this.findById(id);

    return this.prisma.user.update({
      where: { id },
      data: dto,
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

  // async updateAvatar(
  //   userId: string,
  //   currentUserRole: RoleName,
  //   file: Express.Multer.File,
  // ) {
  //   // Load the current avatar before replacing it
  //   const user = await this.prisma.user.findUnique({
  //     where: {
  //       id: userId,
  //     },
  //     select: {
  //       id: true,
  //       avatarMedia: {
  //         select: {
  //           id: true,
  //         },
  //       },
  //     },
  //   });

  //   if (!user) {
  //     throw new NotFoundException('User not found.');
  //   }

  //   // Upload the new avatar and create its Media record
  //   const newMedia = await this.mediaService.uploadImage(userId, file);

  //   // Point the user to the new avatar
  //   await this.prisma.user.update({
  //     where: {
  //       id: userId,
  //     },
  //     data: {
  //       avatarMediaId: newMedia.id,
  //       avatarUrl: newMedia.url,
  //     },
  //   });

  //   // Remove the previous avatar after the new one is active
  //   if (user.avatarMedia) {
  //     await this.mediaService.remove(
  //       user.avatarMedia.id,
  //       userId,
  //       currentUserRole,
  //     );
  //   }

  //   // Reuse the existing safe user response
  //   return this.findById(userId);
  // }
}

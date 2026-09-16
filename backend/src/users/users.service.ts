import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { userPublicSelect } from './user.select';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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
}

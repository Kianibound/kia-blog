import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}


  async findAll() {
    return this.prisma.user.findMany();
  }

async create(dto: CreateUserDto) {
  return this.prisma.user.create({
    data: dto,
  });
}
}
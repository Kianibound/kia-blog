import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findRequiredByName(name: string) {
    // Find a required system role
    const role = await this.prisma.role.findUnique({
      where: { name },
    });

    if (!role) {
      // Missing seeded role means application configuration is broken
      throw new InternalServerErrorException(
        `Required role "${name}" was not found.`,
      );
    }

    return role;
  }
}

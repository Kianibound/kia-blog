import { Injectable, NotFoundException } from '@nestjs/common';
import slugify from 'slugify';

import { PrismaService } from '../database/prisma.service';
import type { CreateTagDto } from './dto/create-tag.dto';
import type { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTagDto) {
    // Generate a URL-friendly slug from the tag name
    const slug = slugify(dto.name, {
      lower: true,
      strict: true,
      trim: true,
    });

    return this.prisma.tag.create({
      data: {
        name: dto.name,
        slug,
      },
    });
  }

  async findAll() {
    // Tags are public and can be used for navigation/filtering
    return this.prisma.tag.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async update(id: string, dto: UpdateTagDto) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found.');
    }

    // Regenerate slug only when the name changes
    const slug = dto.name
      ? slugify(dto.name, {
          lower: true,
          strict: true,
          trim: true,
        })
      : undefined;

    return this.prisma.tag.update({
      where: { id },
      data: {
        ...dto,
        slug,
      },
    });
  }

  async remove(id: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found.');
    }

    await this.prisma.tag.delete({
      where: { id },
    });

    return {
      message: 'Tag deleted successfully.',
    };
  }
}

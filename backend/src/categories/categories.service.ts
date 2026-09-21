import { Injectable, NotFoundException } from '@nestjs/common';
import slugify from 'slugify';

import { PrismaService } from '../database/prisma.service';
import type { CreateCategoryDto } from './dto/create-category.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    // Generate a URL-friendly slug from the category name
    const slug = slugify(dto.name, {
      lower: true,
      strict: true,
      trim: true,
    });

    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
      },
    });
  }

  async findAll() {
    // Categories are public and can be used for navigation/filtering
    return this.prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    // Regenerate slug only when the name changes
    const slug = dto.name
      ? slugify(dto.name, {
          lower: true,
          strict: true,
          trim: true,
        })
      : undefined;

    return this.prisma.category.update({
      where: { id },
      data: {
        ...dto,
        slug,
      },
    });
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return {
      message: 'Category deleted successfully.',
    };
  }
}

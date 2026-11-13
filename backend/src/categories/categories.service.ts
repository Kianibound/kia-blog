import {
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import slugify from 'slugify';

import { PrismaService } from '../database/prisma.service';
import { Prisma } from '../generated/prisma/client';
import type { CreateCategoryDto } from './dto/create-category.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';
import {
  isUniqueConstraintError,
  normalizeTaxonomyName,
  rethrowTaxonomyDeleteError,
} from '../common/taxonomy-name';

const DUPLICATE_MESSAGE =
  'A category with this name or slug already exists.';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  private slugFor(name: string) {
    return slugify(name, { lower: true, strict: true, trim: true });
  }

  async create(dto: CreateCategoryDto) {
    const name = normalizeTaxonomyName(dto.name);
    const slug = this.slugFor(name);

    try {
      // The unique index stays the final arbiter, so a concurrent create with
      // the same name/slug fails safely instead of producing a duplicate.
      return await this.prisma.category.create({
        data: {
          name,
          slug,
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error))
        throw new ConflictException(DUPLICATE_MESSAGE);
      throw error;
    }
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

    // Trim and regenerate the slug only when the name changes
    const name =
      dto.name === undefined ? undefined : normalizeTaxonomyName(dto.name);
    const slug = name === undefined ? undefined : this.slugFor(name);

    try {
      return await this.prisma.category.update({
        where: { id },
        data: {
          name,
          slug,
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error))
        throw new ConflictException(DUPLICATE_MESSAGE);
      throw error;
    }
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    // Never detach a category from an article: drafts and published posts alike
    // must be re-filed first. This also protects the PUBLISHED last-category
    // invariant, because a published post's category can never be removed here.
    // The reference count and the delete share one serializable transaction so a
    // concurrent attachment cannot slip between them and be cascade-detached by
    // the implicit join table.
    try {
      await this.prisma.$transaction(
        async (transaction) => {
          const references = await transaction.post.count({
            where: { categories: { some: { id } } },
          });
          if (references > 0) {
            throw new ConflictException(
              'Category is referenced by articles and cannot be deleted.',
            );
          }
          await transaction.category.delete({
            where: { id },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      // Preserve the domain conflict thrown inside the transaction unchanged.
      if (error instanceof HttpException) throw error;
      rethrowTaxonomyDeleteError(error, 'Category');
    }

    return {
      message: 'Category deleted successfully.',
    };
  }
}

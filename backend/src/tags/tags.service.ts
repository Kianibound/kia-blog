import {
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import slugify from 'slugify';

import { PrismaService } from '../database/prisma.service';
import { Prisma } from '../generated/prisma/client';
import type { CreateTagDto } from './dto/create-tag.dto';
import type { UpdateTagDto } from './dto/update-tag.dto';
import {
  isUniqueConstraintError,
  normalizeTaxonomyName,
  rethrowTaxonomyDeleteError,
} from '../common/taxonomy-name';

const DUPLICATE_MESSAGE = 'A tag with this name or slug already exists.';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  private slugFor(name: string) {
    return slugify(name, { lower: true, strict: true, trim: true });
  }

  async create(dto: CreateTagDto) {
    const name = normalizeTaxonomyName(dto.name);
    const slug = this.slugFor(name);

    try {
      // The unique index stays the final arbiter, so a concurrent create with
      // the same name/slug fails safely instead of producing a duplicate.
      return await this.prisma.tag.create({
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

    // Trim and regenerate the slug only when the name changes
    const name =
      dto.name === undefined ? undefined : normalizeTaxonomyName(dto.name);
    const slug = name === undefined ? undefined : this.slugFor(name);

    try {
      return await this.prisma.tag.update({
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
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found.');
    }

    // Never detach a tag from an article; posts must be re-filed first. The
    // reference count and the delete share one serializable transaction so a
    // concurrent attachment cannot slip between them and be cascade-detached by
    // the implicit join table.
    try {
      await this.prisma.$transaction(
        async (transaction) => {
          const references = await transaction.post.count({
            where: { tags: { some: { id } } },
          });
          if (references > 0) {
            throw new ConflictException(
              'Tag is referenced by articles and cannot be deleted.',
            );
          }
          await transaction.tag.delete({
            where: { id },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      // Preserve the domain conflict thrown inside the transaction unchanged.
      if (error instanceof HttpException) throw error;
      rethrowTaxonomyDeleteError(error, 'Tag');
    }

    return {
      message: 'Tag deleted successfully.',
    };
  }
}

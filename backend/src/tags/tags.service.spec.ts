import type { PrismaService } from '../database/prisma.service';
import { TagsService } from './tags.service';

describe('TagsService', () => {
  const service = new TagsService({} as PrismaService);

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

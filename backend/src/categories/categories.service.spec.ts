import type { PrismaService } from '../database/prisma.service';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  const service = new CategoriesService({} as PrismaService);

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

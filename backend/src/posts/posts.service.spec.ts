import type { PrismaService } from '../database/prisma.service';
import { PostsService } from './posts.service';

describe('PostsService', () => {
  const service = new PostsService({} as PrismaService);

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

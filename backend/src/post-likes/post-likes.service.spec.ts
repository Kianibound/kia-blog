import type { PrismaService } from '../database/prisma.service';
import { PostLikesService } from './post-likes.service';

describe('PostLikesService', () => {
  const service = new PostLikesService({} as PrismaService);

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import type { PrismaService } from '../database/prisma.service';
import { CommentsService } from './comments.service';

describe('CommentsService', () => {
  const service = new CommentsService({} as PrismaService);

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

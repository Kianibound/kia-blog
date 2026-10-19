import type { PrismaService } from '../database/prisma.service';
import { BookmarksService } from './bookmarks.service';

describe('BookmarksService', () => {
  const service = new BookmarksService({} as PrismaService);

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

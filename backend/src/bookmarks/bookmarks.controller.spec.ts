import type { BookmarksService } from './bookmarks.service';
import { BookmarksController } from './bookmarks.controller';

describe('BookmarksController', () => {
  const controller = new BookmarksController({} as BookmarksService);

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

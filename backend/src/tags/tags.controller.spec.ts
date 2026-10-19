import type { TagsService } from './tags.service';
import { TagsController } from './tags.controller';

describe('TagsController', () => {
  const controller = new TagsController({} as TagsService);

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

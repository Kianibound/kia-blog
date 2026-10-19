import type { PostsService } from './posts.service';
import { PostsController } from './posts.controller';

describe('PostsController', () => {
  const controller = new PostsController({} as PostsService);

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

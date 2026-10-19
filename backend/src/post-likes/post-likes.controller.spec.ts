import type { PostLikesService } from './post-likes.service';
import { PostLikesController } from './post-likes.controller';

describe('PostLikesController', () => {
  const controller = new PostLikesController({} as PostLikesService);

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

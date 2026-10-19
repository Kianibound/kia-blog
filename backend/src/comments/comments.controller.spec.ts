import type { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';

describe('CommentsController', () => {
  const controller = new CommentsController({} as CommentsService);

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

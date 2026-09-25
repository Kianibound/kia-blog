import { Test, TestingModule } from '@nestjs/testing';
import { PostLikesController } from './post-likes.controller';

describe('PostLikesController', () => {
  let controller: PostLikesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostLikesController],
    }).compile();

    controller = module.get<PostLikesController>(PostLikesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

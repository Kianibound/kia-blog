import type { MediaService } from './media.service';
import { MediaController } from './media.controller';

describe('MediaController', () => {
  const controller = new MediaController({} as MediaService);

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

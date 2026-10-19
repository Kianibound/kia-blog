import type { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';

describe('CategoriesController', () => {
  const controller = new CategoriesController({} as CategoriesService);

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

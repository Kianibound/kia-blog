import type { UsersService } from './users.service';
import { UsersController } from './users.controller';

describe('UsersController', () => {
  const controller = new UsersController({} as UsersService);

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

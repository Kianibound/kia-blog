import type { UsersService } from '../users/users.service';
import { AdminController } from './admin.controller';

describe('AdminController', () => {
  const controller = new AdminController({} as UsersService);

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

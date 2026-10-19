import type { PrismaService } from '../database/prisma.service';
import type { RolesService } from '../roles/roles.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const service = new UsersService({} as PrismaService, {} as RolesService);

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

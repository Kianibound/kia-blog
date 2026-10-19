import type { PrismaService } from '../database/prisma.service';
import { RolesService } from './roles.service';

describe('RolesService', () => {
  const service = new RolesService({} as PrismaService);

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

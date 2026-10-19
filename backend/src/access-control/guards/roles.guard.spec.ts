import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { jest } from '@jest/globals';

import { ROLE, type RoleName } from '../../roles/constants/role.constants';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const createFixture = (
    requiredRoles: RoleName[] | undefined,
    currentRole: RoleName = ROLE.USER,
  ) => {
    const reflector = {
      getAllAndOverride: jest.fn(() => requiredRoles),
    };
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            sub: 'user-id',
            email: 'user@example.com',
            role: currentRole,
          },
        }),
      }),
    } as unknown as ExecutionContext;
    const guard = new RolesGuard(reflector as unknown as Reflector);

    return { context, guard };
  };

  it('allows a route without role metadata', () => {
    const { context, guard } = createFixture(undefined);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows a user whose role is permitted', () => {
    const { context, guard } = createFixture(
      [ROLE.AUTHOR, ROLE.ADMIN],
      ROLE.AUTHOR,
    );

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects a user whose role is not permitted', () => {
    const { context, guard } = createFixture([ROLE.ADMIN], ROLE.USER);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});

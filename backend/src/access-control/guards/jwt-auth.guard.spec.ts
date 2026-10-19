import type { ExecutionContext } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { jest } from '@jest/globals';
import type { JwtService } from '@nestjs/jwt';

import { ROLE } from '../../roles/constants/role.constants';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const createFixture = (authorization?: string) => {
    const request = {
      headers: {
        authorization,
      },
    };
    const jwtService = {
      verifyAsync: jest.fn(),
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
    const guard = new JwtAuthGuard(jwtService as unknown as JwtService);

    return { context, guard, jwtService, request };
  };

  it('rejects requests without a bearer token', async () => {
    const { context, guard, jwtService } = createFixture();

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('rejects an invalid access token', async () => {
    const { context, guard, jwtService } = createFixture('Bearer invalid');
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('attaches a valid access-token payload to the request', async () => {
    const { context, guard, jwtService, request } =
      createFixture('Bearer valid');
    const payload = {
      sub: 'user-id',
      email: 'user@example.com',
      role: ROLE.AUTHOR,
    };
    jwtService.verifyAsync.mockResolvedValue(payload);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid');
    expect(request).toHaveProperty('user', payload);
  });
});

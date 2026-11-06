import type { ExecutionContext } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { jest } from '@jest/globals';
import type { JwtService } from '@nestjs/jwt';

import { ROLE } from '../../roles/constants/role.constants';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { PrismaService } from '../../database/prisma.service';

describe('JwtAuthGuard', () => {
  const createFixture = (authorization?: string) => {
    const request = {
      headers: {
        authorization,
      },
    };
    const jwtService = {
      verifyAsync: jest.fn<() => Promise<unknown>>(),
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
    const prisma = {
      refreshToken: {
        findUnique: jest
          .fn<() => Promise<unknown>>()
          .mockResolvedValue({
            userId: 'user-id',
            revokedAt: null,
            expiresAt: new Date(Date.now() + 60000),
            user: {
              email: 'user@example.com',
              disabledAt: null,
              role: { name: ROLE.AUTHOR },
            },
          }),
      },
    };
    const guard = new JwtAuthGuard(
      jwtService as unknown as JwtService,
      prisma as unknown as PrismaService,
    );

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
      sid: 'session-id',
    };
    jwtService.verifyAsync.mockResolvedValue(payload);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid');
    expect(request).toHaveProperty('user', payload);
  });
});

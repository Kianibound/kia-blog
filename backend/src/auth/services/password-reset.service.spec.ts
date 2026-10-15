import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { jest } from '@jest/globals';

import type { PrismaService } from '../../database/prisma.service';
import type { MailService } from '../../mail/mail.service';
import { PasswordResetService } from './password-reset.service';

describe('PasswordResetService', () => {
  const createFixture = () => {
    const transaction = {
      passwordResetToken: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      user: {
        update: jest.fn(),
      },
      refreshToken: {
        updateMany: jest.fn(),
      },
    };

    const prisma = {
      $transaction: jest.fn(
        async (callback: (client: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
    };

    const service = new PasswordResetService(
      prisma as unknown as PrismaService,
      {} as ConfigService,
      {} as MailService,
    );

    return { prisma, service, transaction };
  };

  it('consumes the token, changes the password, and revokes sessions atomically', async () => {
    const { prisma, service, transaction } = createFixture();

    transaction.passwordResetToken.findUnique.mockResolvedValue({
      id: 'reset-token-id',
      userId: 'user-id',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    transaction.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
    transaction.user.update.mockResolvedValue({ id: 'user-id' });
    transaction.refreshToken.updateMany.mockResolvedValue({ count: 2 });

    await expect(
      service.resetPassword({
        token: 'raw-token',
        newPassword: 'StrongPassword123!',
      }),
    ).resolves.toEqual({ message: 'Password reset successfully.' });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(transaction.user.update).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: { passwordHash: expect.any(String) },
    });
    expect(transaction.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-id', revokedAt: null },
      }),
    );
  });

  it('does not change the password when the token claim is lost', async () => {
    const { service, transaction } = createFixture();

    transaction.passwordResetToken.findUnique.mockResolvedValue({
      id: 'reset-token-id',
      userId: 'user-id',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    transaction.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.resetPassword({
        token: 'raw-token',
        newPassword: 'StrongPassword123!',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(transaction.user.update).not.toHaveBeenCalled();
    expect(transaction.refreshToken.updateMany).not.toHaveBeenCalled();
  });
});

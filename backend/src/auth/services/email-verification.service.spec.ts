import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { jest } from '@jest/globals';

import type { PrismaService } from '../../database/prisma.service';
import type { MailService } from '../../mail/mail.service';
import { EmailVerificationService } from './email-verification.service';

describe('EmailVerificationService', () => {
  const createFixture = () => {
    const transaction = {
      emailVerificationToken: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      user: {
        update: jest.fn(),
      },
    };

    const prisma = {
      $transaction: jest.fn(
        async (callback: (client: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
    };

    const service = new EmailVerificationService(
      {} as ConfigService,
      prisma as unknown as PrismaService,
      {} as MailService,
    );

    return { prisma, service, transaction };
  };

  it('claims the token and verifies the user in one transaction', async () => {
    const { prisma, service, transaction } = createFixture();
    const expiresAt = new Date(Date.now() + 60_000);

    transaction.emailVerificationToken.findUnique.mockResolvedValue({
      id: 'verification-token-id',
      userId: 'user-id',
      usedAt: null,
      expiresAt,
    });
    transaction.emailVerificationToken.updateMany.mockResolvedValue({
      count: 1,
    });
    transaction.user.update.mockResolvedValue({ id: 'user-id' });

    await expect(service.verifyEmail('raw-token')).resolves.toEqual({
      message: 'Email verified successfully.',
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(transaction.emailVerificationToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'verification-token-id',
          usedAt: null,
        }),
      }),
    );
    expect(transaction.user.update).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: { emailVerified: true },
    });
  });

  it('rejects a token that another request already claimed', async () => {
    const { service, transaction } = createFixture();

    transaction.emailVerificationToken.findUnique.mockResolvedValue({
      id: 'verification-token-id',
      userId: 'user-id',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    transaction.emailVerificationToken.updateMany.mockResolvedValue({
      count: 0,
    });

    await expect(service.verifyEmail('raw-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(transaction.user.update).not.toHaveBeenCalled();
  });
});

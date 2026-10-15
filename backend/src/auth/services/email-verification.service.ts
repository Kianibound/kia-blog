import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { MailService } from '../../mail/mail.service';

@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  private hashToken(token: string): string {
    // Hash token before storing or looking it up
    return createHash('sha256').update(token).digest('hex');
  }

  async createAndSend(userId: string, email: string) {
    // Generate secure one-time token
    const rawToken = randomBytes(32).toString('hex');

    const tokenHash = this.hashToken(rawToken);

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.emailVerificationToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt,
      },
    });

    const verificationUrl =
      `${this.configService.getOrThrow<string>('APP_URL')}` +
      `/auth/verify-email?token=${rawToken}`;

    if (this.configService.get<string>('EMAIL_ENABLED') === 'true') {
      // Send real email when email delivery is enabled
      await this.mailService.sendEmailVerification(email, verificationUrl);
    }

    return verificationUrl;
  }

  async verifyEmail(rawToken: string) {
    // Hash incoming raw token for DB lookup
    const tokenHash = this.hashToken(rawToken);

    const now = new Date();

    return this.prisma.$transaction(async (transaction) => {
      const verificationToken =
        await transaction.emailVerificationToken.findUnique({
          where: {
            tokenHash,
          },
        });

      // Reject invalid, used, or expired tokens before attempting to claim one.
      if (
        !verificationToken ||
        verificationToken.usedAt ||
        verificationToken.expiresAt <= now
      ) {
        throw new UnauthorizedException(
          'Invalid or expired verification token.',
        );
      }

      // Claim the token with a conditional write. If two requests race, only
      // one can change usedAt from null and continue the workflow.
      const claimedToken = await transaction.emailVerificationToken.updateMany({
        where: {
          id: verificationToken.id,
          usedAt: null,
          expiresAt: {
            gt: now,
          },
        },
        data: {
          usedAt: now,
        },
      });

      if (claimedToken.count !== 1) {
        throw new UnauthorizedException(
          'Invalid or expired verification token.',
        );
      }

      // The user update and token claim commit or roll back together.
      await transaction.user.update({
        where: {
          id: verificationToken.userId,
        },
        data: {
          emailVerified: true,
        },
      });

      return {
        message: 'Email verified successfully.',
      };
    });
  }
}

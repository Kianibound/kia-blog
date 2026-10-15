import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import * as argon2 from 'argon2';

import { PrismaService } from '../../database/prisma.service';
import { hashToken } from '../utils/hash-token.util';
import type { ForgotPasswordDto } from '../dto/forgot-password.dto';
import type { ResetPasswordDto } from '../dto/reset-password.dto';
import { MailService } from '../../mail/mail.service';

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  private async createPasswordResetToken(userId: string) {
    // Generate a secure one-time reset token
    const rawToken = randomBytes(32).toString('hex');

    const tokenHash = hashToken(rawToken);

    // Reset token is valid for one hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt,
      },
    });

    return rawToken;
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    // Always return the same message to prevent email enumeration
    if (!user) {
      return {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    }

    const resetToken = await this.createPasswordResetToken(user.id);

    const resetUrl =
      `${this.configService.getOrThrow<string>('APP_URL')}` +
      `/auth/reset-password?token=${resetToken}`;

    if (this.configService.get<string>('EMAIL_ENABLED') === 'true') {
      await this.mailService.sendPasswordReset(user.email, resetUrl);
    }

    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
      ...(process.env.NODE_ENV !== 'production' && {
        resetUrl,
      }),
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    // Hash incoming token for DB lookup
    const tokenHash = hashToken(dto.token);

    // Hash the new password
    const passwordHash = await argon2.hash(dto.newPassword);
    const now = new Date();

    return this.prisma.$transaction(async (transaction) => {
      const resetToken = await transaction.passwordResetToken.findUnique({
        where: {
          tokenHash,
        },
      });

      // Reject invalid, used, or expired tokens before attempting to claim one.
      if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= now) {
        throw new UnauthorizedException(
          'Invalid or expired password reset token.',
        );
      }

      // Claim the token with a conditional write so concurrent requests cannot
      // complete the same one-time workflow twice.
      const claimedToken = await transaction.passwordResetToken.updateMany({
        where: {
          id: resetToken.id,
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
          'Invalid or expired password reset token.',
        );
      }

      // Password replacement, session revocation, and token consumption are
      // committed together or rolled back together.
      await transaction.user.update({
        where: {
          id: resetToken.userId,
        },
        data: {
          passwordHash,
        },
      });

      await transaction.refreshToken.updateMany({
        where: {
          userId: resetToken.userId,
          revokedAt: null,
        },
        data: {
          revokedAt: now,
        },
      });

      return {
        message: 'Password reset successfully.',
      };
    });
  }
}

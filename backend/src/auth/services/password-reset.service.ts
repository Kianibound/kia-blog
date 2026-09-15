import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import * as argon2 from 'argon2';

import { PrismaService } from '../../database/prisma.service';
import { hashToken } from '../utils/hash-token.util';
import type { ForgotPasswordDto } from '../dto/forgot-password.dto';
import type { ResetPasswordDto } from '../dto/reset-password.dto';

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
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

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: {
        tokenHash,
      },
    });

    // Reject invalid, used, or expired tokens
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new UnauthorizedException(
        'Invalid or expired password reset token.',
      );
    }

    // Hash the new password
    const passwordHash = await argon2.hash(dto.newPassword);

    // Update user password
    await this.prisma.user.update({
      where: {
        id: resetToken.userId,
      },
      data: {
        passwordHash,
      },
    });

    // Revoke all active sessions after password reset
    await this.prisma.refreshToken.updateMany({
      where: {
        userId: resetToken.userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    // Prevent reset token reuse
    await this.prisma.passwordResetToken.update({
      where: {
        id: resetToken.id,
      },
      data: {
        usedAt: new Date(),
      },
    });

    return {
      message: 'Password reset successfully.',
    };
  }
}

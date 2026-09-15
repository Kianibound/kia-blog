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

    const verificationToken =
      await this.prisma.emailVerificationToken.findUnique({
        where: {
          tokenHash,
        },
      });

    // Reject invalid, used, or expired tokens
    if (
      !verificationToken ||
      verificationToken.usedAt ||
      verificationToken.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired verification token.');
    }

    // Mark user's email as verified
    await this.prisma.user.update({
      where: {
        id: verificationToken.userId,
      },
      data: {
        emailVerified: true,
      },
    });

    // Prevent this token from being reused
    await this.prisma.emailVerificationToken.update({
      where: {
        id: verificationToken.id,
      },
      data: {
        usedAt: new Date(),
      },
    });

    return {
      message: 'Email verified successfully.',
    };
  }
}

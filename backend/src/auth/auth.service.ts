import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as argon2 from 'argon2';
import { UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtPayload } from './types/jwt-payload.type';
import { createHash, randomBytes } from 'node:crypto';
import { MailService } from '../mail/mail.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    // Hash password before saving
    const passwordHash = await argon2.hash(dto.password);

    // Create user
    const user = await this.usersService.create({
      email: dto.email,
      username: dto.username,
      name: dto.name,
      passwordHash,
    });

    // Create one-time verification token
    const verificationToken = await this.createEmailVerificationToken(user.id);

    // Build verification URL
    const verificationUrl =
      `${this.configService.getOrThrow<string>('APP_URL')}` +
      `/auth/verify-email?token=${verificationToken}`;

    // Send verification email
    if (this.configService.get('EMAIL_ENABLED') === 'true') {
      await this.mailService.sendEmailVerification(user.email, verificationUrl);
    }

    return {
      user,
      message: 'Registration successful.',
      ...(process.env.NODE_ENV !== 'production' && {
        verificationUrl,
      }),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailForAuth(dto.email);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await argon2.verify(
      user.passwordHash,
      dto.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
      },
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );

    const refreshTokenHash = await argon2.hash(refreshToken);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: refreshTokenHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const safeUser = await this.usersService.findById(user.id);

    return {
      accessToken,
      refreshToken,
      user: safeUser,
    };
  }

  async getMe(userId: string) {
    return this.usersService.findById(userId);
  }

  async refresh(dto: RefreshTokenDto) {
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(
        dto.refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const tokens = await this.prisma.refreshToken.findMany({
      where: {
        userId: payload.sub,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    const matchingToken = await Promise.all(
      tokens.map(async (token) => ({
        token,
        matches: await argon2.verify(token.tokenHash, dto.refreshToken),
      })),
    );

    const validToken = matchingToken.find((item) => item.matches);

    if (!validToken) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: payload.sub,
      email: payload.email,
    });

    return {
      accessToken,
    };
  }

  async logout(dto: RefreshTokenDto) {
    let payload: JwtPayload;

    try {
      // Verify refresh token signature and expiration
      payload = await this.jwtService.verifyAsync<JwtPayload>(
        dto.refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    // Get active refresh tokens for this user
    const tokens = await this.prisma.refreshToken.findMany({
      where: {
        userId: payload.sub,
        revokedAt: null,
      },
    });

    // Find the database token that matches the raw refresh token
    const matchingToken = (
      await Promise.all(
        tokens.map(async (token) => ({
          token,
          matches: await argon2.verify(token.tokenHash, dto.refreshToken),
        })),
      )
    ).find((item) => item.matches);

    if (!matchingToken) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    // Revoke this refresh token
    await this.prisma.refreshToken.update({
      where: {
        id: matchingToken.token.id,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return {
      message: 'Logged out successfully.',
    };
  }

  async logoutAll(userId: string) {
    // Revoke all active refresh tokens for this user
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return {
      message: 'Logged out from all devices successfully.',
    };
  }

  private hashToken(token: string): string {
    // Store only the token hash in the database
    return createHash('sha256').update(token).digest('hex');
  }

  private async createEmailVerificationToken(userId: string) {
    // Generate a cryptographically secure random token
    const rawToken = randomBytes(32).toString('hex');

    const tokenHash = this.hashToken(rawToken);

    // Token is valid for 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.emailVerificationToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt,
      },
    });

    // Raw token is returned only once so it can be sent to the user
    return rawToken;
  }

  async verifyEmail(rawToken: string) {
    // Hash the incoming token to compare with the stored hash
    const tokenHash = this.hashToken(rawToken);

    const verificationToken =
      await this.prisma.emailVerificationToken.findUnique({
        where: {
          tokenHash,
        },
      });

    // Reject missing, already-used, or expired tokens
    if (
      !verificationToken ||
      verificationToken.usedAt ||
      verificationToken.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired verification token.');
    }

    // Mark the user's email as verified
    await this.prisma.user.update({
      where: {
        id: verificationToken.userId,
      },
      data: {
        emailVerified: true,
      },
    });

    // Mark this token as used
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

  private async createPasswordResetToken(userId: string) {
    // Generate a secure one-time token
    const rawToken = randomBytes(32).toString('hex');

    // Store only the SHA-256 hash
    const tokenHash = this.hashToken(rawToken);

    // Reset token expires after 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt,
      },
    });

    // Return raw token only once so it can be sent to the user
    return rawToken;
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    // Find user by email for the reset flow
    const user = await this.usersService.findByEmailForAuth(dto.email);

    // Always return the same response to avoid email enumeration
    if (!user) {
      return {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    }

    // Create a one-time reset token
    const resetToken = await this.createPasswordResetToken(user.id);

    const resetUrl =
      `${this.configService.getOrThrow<string>('APP_URL')}` +
      `/auth/reset-password?token=${resetToken}`;

    // In development we can expose the URL for easier testing
    if (this.configService.get<string>('EMAIL_ENABLED') === 'true') {
      // We'll wire real reset email sending next
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
    // Hash incoming raw token so we can look it up in DB
    const tokenHash = this.hashToken(dto.token);

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: {
        tokenHash,
      },
    });

    // Reject missing, used, or expired tokens
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new UnauthorizedException(
        'Invalid or expired password reset token.',
      );
    }

    // Hash the new password before storing it
    const passwordHash = await argon2.hash(dto.newPassword);

    // Update user's password
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

    // Mark reset token as used
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

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
import { TokenService } from './services/token.service';
import { EmailVerificationService } from './services/email-verification.service';
import { hashToken } from './utils/hash-token.util';
import { PasswordResetService } from './services/password-reset.service';
import { SessionService } from './services/session.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly passwordResetService: PasswordResetService,
    private readonly sessionService: SessionService,
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

    // Create and optionally send verification email
    const verificationUrl = await this.emailVerificationService.createAndSend(
      user.id,
      user.email,
    );

    return {
      user,
      message: 'Registration successful. Please verify your email.',
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

    const payload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = await this.tokenService.createAccessToken(payload);

    const refreshToken = await this.tokenService.createRefreshToken(payload);

    // Persist refresh token session
    await this.sessionService.storeRefreshToken(
      user.id,
      refreshToken,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    );

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
    return this.sessionService.refresh(dto.refreshToken);
  }

  async logout(dto: RefreshTokenDto) {
    return this.sessionService.logout(dto.refreshToken);
  }

  async logoutAll(userId: string) {
    return this.sessionService.logoutAll(userId);
  }

  async verifyEmail(token: string) {
    return this.emailVerificationService.verifyEmail(token);
  }

  private async createPasswordResetToken(userId: string) {
    // Generate a secure one-time token
    const rawToken = randomBytes(32).toString('hex');

    // Store only the SHA-256 hash
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

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
    return this.passwordResetService.forgotPassword(dto);
  }

  async resetPassword(dto: ResetPasswordDto) {
    return this.passwordResetService.resetPassword(dto);
  }
}

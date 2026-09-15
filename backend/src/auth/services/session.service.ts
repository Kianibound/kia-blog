import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { TokenService } from './token.service';
import type { JwtPayload } from '../types/jwt-payload.type';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  async storeRefreshToken(
    userId: string,
    refreshToken: string,
    expiresAt: Date,
  ) {
    // Store only the hashed refresh token
    const tokenHash = await argon2.hash(refreshToken);

    return this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  async logoutAll(userId: string) {
    // Revoke all active sessions for this user
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

  async refresh(refreshToken: string) {
    let payload: JwtPayload;

    try {
      // Verify refresh token signature and expiration
      payload = await this.tokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    // Get active sessions for this user
    const tokens = await this.prisma.refreshToken.findMany({
      where: {
        userId: payload.sub,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    // Find matching stored refresh token
    const matches = await Promise.all(
      tokens.map(async (token) => ({
        token,
        matches: await argon2.verify(token.tokenHash, refreshToken),
      })),
    );

    const validToken = matches.find((item) => item.matches);

    if (!validToken) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    // Issue a new access token
    const accessToken = await this.tokenService.createAccessToken({
      sub: payload.sub,
      email: payload.email,
    });

    return {
      accessToken,
    };
  }

  async logout(refreshToken: string) {
    let payload: JwtPayload;

    try {
      // Verify refresh token before revoking it
      payload = await this.tokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    // Get active sessions for this user
    const tokens = await this.prisma.refreshToken.findMany({
      where: {
        userId: payload.sub,
        revokedAt: null,
      },
    });

    const matches = await Promise.all(
      tokens.map(async (token) => ({
        token,
        matches: await argon2.verify(token.tokenHash, refreshToken),
      })),
    );

    const validToken = matches.find((item) => item.matches);

    if (!validToken) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    // Revoke only this session
    await this.prisma.refreshToken.update({
      where: {
        id: validToken.token.id,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return {
      message: 'Logged out successfully.',
    };
  }
}

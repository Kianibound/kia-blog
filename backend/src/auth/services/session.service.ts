import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { TokenService } from './token.service';
import type { RefreshTokenPayload } from '../types/refresh-token-payload.type';
import { PrismaService } from '../../database/prisma.service';
import { isRoleName } from '../../roles/constants/role.constants';

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
    // Revoke every active refresh-token session for this user
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
    let payload: RefreshTokenPayload;

    try {
      // Verify the refresh token and extract the user id
      payload = await this.tokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    // Find active refresh-token sessions for this user
    const tokens = await this.prisma.refreshToken.findMany({
      where: {
        userId: payload.sub,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    // Compare the provided refresh token with stored Argon2 hashes
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

    // Load the current user and current role from the database
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
      select: {
        id: true,
        email: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    // The user must still exist and have a valid role
    if (!user || !user.role) {
      throw new UnauthorizedException('User or role is no longer available.');
    }

    // Ensure the current database role is supported by the application
    if (!isRoleName(user.role.name)) {
      throw new UnauthorizedException('User role is invalid.');
    }

    // Create a new access token with the user's current role
    const accessToken = await this.tokenService.createAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role.name,
    });
    return {
      accessToken,
    };
  }
  async logout(refreshToken: string) {
    let payload: RefreshTokenPayload;

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

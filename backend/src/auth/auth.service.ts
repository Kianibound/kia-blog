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

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const passwordHash = await argon2.hash(dto.password);

    return this.usersService.create({
      email: dto.email,
      username: dto.username,
      name: dto.name,
      passwordHash,
    });
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
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async createAccessToken(payload: JwtPayload): Promise<string> {
    // Create short-lived access token
    return this.jwtService.signAsync(payload);
  }

  async createRefreshToken(payload: JwtPayload): Promise<string> {
    // Create long-lived refresh token
    return this.jwtService.signAsync(payload, {
      secret:
        this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    // Verify refresh token signature and expiration
    return this.jwtService.verifyAsync<JwtPayload>(token, {
      secret:
        this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
    });
  }
}
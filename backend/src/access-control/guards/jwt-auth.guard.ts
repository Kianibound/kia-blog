import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import type { AccessTokenPayload } from '../types/access-token-payload.type';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Access token is required.');
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload =
        await this.jwtService.verifyAsync<AccessTokenPayload>(token);

      request.user = payload;

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token.');
    }
  }
}

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import type { AccessTokenPayload } from '../types/access-token-payload.type';
import { PrismaService } from '../../database/prisma.service';
import { isRoleName } from '../../roles/constants/role.constants';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

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

      if (
        typeof payload.sub !== 'string' ||
        typeof payload.sid !== 'string' ||
        !payload.sid
      ) {
        throw new UnauthorizedException();
      }
      const session = await this.prisma.refreshToken.findUnique({
        where: { id: payload.sid },
        select: {
          userId: true,
          revokedAt: true,
          expiresAt: true,
          user: {
            select: {
              id: true,
              email: true,
              disabledAt: true,
              role: { select: { name: true } },
            },
          },
        },
      });
      if (
        !session ||
        session.userId !== payload.sub ||
        session.revokedAt ||
        session.expiresAt <= new Date() ||
        !session.user ||
        session.user.disabledAt ||
        !session.user.role ||
        !isRoleName(session.user.role.name)
      ) {
        throw new UnauthorizedException();
      }
      request.user = {
        sub: payload.sub,
        sid: payload.sid,
        email: session.user.email,
        role: session.user.role.name,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token.');
    }
  }
}

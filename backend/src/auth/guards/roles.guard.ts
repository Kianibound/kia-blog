import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedRequest } from '../types/authenticated-request.type';
import type { RoleName } from '../../roles/constants/role.constants';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Read required roles from the route or controller metadata
    const requiredRoles =
      this.reflector.getAllAndOverride<RoleName[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );

    // If no @Roles() decorator is defined, there is no role restriction
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // JwtAuthGuard runs before this guard and attaches
    // the verified access-token payload to request.user
    const request =
      context
        .switchToHttp()
        .getRequest<AuthenticatedRequest>();

    const userRole = request.user.role;

    // The user is authenticated but does not have
    // one of the roles required by this route
    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException(
        'You do not have permission to access this resource.',
      );
    }

    return true;
  }
}
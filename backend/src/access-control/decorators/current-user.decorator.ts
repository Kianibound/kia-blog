import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { AccessTokenPayload } from '../types/access-token-payload.type';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AccessTokenPayload => {
    const request = context.switchToHttp().getRequest();

    return request.user;
  },
);

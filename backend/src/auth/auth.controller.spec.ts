import { jest } from '@jest/globals';

import type { AuthService } from './auth.service';

jest.unstable_mockModule('@nestjs/throttler', () => ({
  Throttle: () => () => undefined,
}));

const { AuthController } = await import('./auth.controller');

describe('AuthController', () => {
  const controller = new AuthController({} as AuthService);

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

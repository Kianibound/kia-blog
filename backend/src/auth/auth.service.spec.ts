import type { RolesService } from '../roles/roles.service';
import type { UsersService } from '../users/users.service';
import type { EmailVerificationService } from './services/email-verification.service';
import type { PasswordResetService } from './services/password-reset.service';
import type { SessionService } from './services/session.service';
import type { TokenService } from './services/token.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const service = new AuthService(
    {} as UsersService,
    {} as TokenService,
    {} as EmailVerificationService,
    {} as PasswordResetService,
    {} as SessionService,
    {} as RolesService,
  );

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

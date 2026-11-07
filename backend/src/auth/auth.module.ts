import { DatabaseModule } from '../database/database.module';
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { TokenService } from './services/token.service';
import { EmailVerificationService } from './services/email-verification.service';
import { PasswordResetService } from './services/password-reset.service';
import { SessionService } from './services/session.service';
import { RolesModule } from '../roles/roles.module';
import { AccessControlModule } from '../access-control/access-control.module';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import {
  GITHUB_FETCH,
  GithubOAuthService,
} from './services/github-oauth.service';
import {
  GOOGLE_OAUTH_CLIENT,
  GoogleOAuthService,
} from './services/google-oauth.service';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    MailModule,
    RolesModule,
    AccessControlModule,
  ],
  controllers: [AuthController],
  providers: [
    GithubOAuthService,
    { provide: GITHUB_FETCH, useValue: globalThis.fetch },
    GoogleOAuthService,
    {
      provide: GOOGLE_OAUTH_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new OAuth2Client(
          config.get<string>('GOOGLE_CLIENT_ID'),
          config.get<string>('GOOGLE_CLIENT_SECRET'),
          config.get<string>('GOOGLE_REDIRECT_URI'),
        ),
    },
    AuthService,
    TokenService,
    SessionService,
    EmailVerificationService,
    PasswordResetService,
  ],
})
export class AuthModule {}

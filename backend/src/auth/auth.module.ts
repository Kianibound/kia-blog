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
    AuthService,
    TokenService,
    SessionService,
    EmailVerificationService,
    PasswordResetService,
  ],
})
export class AuthModule {}

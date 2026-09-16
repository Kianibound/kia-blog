import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { MailModule } from '../mail/mail.module';
import { TokenService } from './services/token.service';
import { EmailVerificationService } from './services/email-verification.service';
import { PasswordResetService } from './services/password-reset.service';
import { SessionService } from './services/session.service';
import { RolesModule } from '../roles/roles.module';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    UsersModule,
    MailModule,
    RolesModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: '15m',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
    TokenService,
    EmailVerificationService,
    PasswordResetService,
    SessionService,
    RolesGuard,
  ],
})
export class AuthModule {}

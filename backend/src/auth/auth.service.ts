import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as argon2 from 'argon2';
import { UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { TokenService } from './services/token.service';
import { EmailVerificationService } from './services/email-verification.service';
import { PasswordResetService } from './services/password-reset.service';
import { SessionService } from './services/session.service';
import { RolesService } from '../roles/roles.service';
import { isRoleName } from '../roles/constants/role.constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly passwordResetService: PasswordResetService,
    private readonly sessionService: SessionService,
    private readonly rolesService: RolesService,
  ) {}

  async register(dto: RegisterDto) {
    // Hash password before saving
    const passwordHash = await argon2.hash(dto.password);

    // Resolve the default role for new registrations
    const defaultRole = await this.rolesService.findRequiredByName('USER');

    // Create user
    const user = await this.usersService.create({
      email: dto.email,
      username: dto.username,
      name: dto.name,
      passwordHash,
      roleId: defaultRole.id,
    });

    // Create and optionally send verification email
    const verificationUrl = await this.emailVerificationService.createAndSend(
      user.id,
      user.email,
    );

    return {
      user,
      message: 'Registration successful. Please verify your email.',
      ...(process.env.NODE_ENV !== 'production' && {
        verificationUrl,
      }),
    };
  }

  async login(dto: LoginDto) {
    // Find the user with password hash and role for authentication
    const user = await this.usersService.findByEmailForAuth(dto.email);

    // Use the same error for unknown email or missing password
    // to avoid leaking whether an email exists
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    // Compare the provided password with the stored Argon2 hash
    const passwordMatches = await argon2.verify(
      user.passwordHash,
      dto.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    // Every authenticated user must have a valid role
    if (!user.role) {
      throw new UnauthorizedException('User role is not available.');
    }

    // Ensure the database role is one of the supported application roles
    if (!isRoleName(user.role.name)) {
      throw new UnauthorizedException('User role is invalid.');
    }

    // Access token contains the data needed for authenticated
    // and role-based requests
    const accessToken = await this.tokenService.createAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role.name,
    });

    // Refresh token only identifies the user/session.
    // Current role will be loaded from the database when refreshing.
    const refreshToken = await this.tokenService.createRefreshToken({
      sub: user.id,
    });

    // Store only the hashed refresh token in the database
    await this.sessionService.storeRefreshToken(
      user.id,
      refreshToken,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    );

    // Load the public/safe user response without passwordHash
    const safeUser = await this.usersService.findById(user.id);

    return {
      accessToken,
      refreshToken,
      user: safeUser,
    };
  }

  async getMe(userId: string) {
    return this.usersService.findById(userId);
  }

  async refresh(dto: RefreshTokenDto) {
    return this.sessionService.refresh(dto.refreshToken);
  }

  async logout(dto: RefreshTokenDto) {
    return this.sessionService.logout(dto.refreshToken);
  }

  async logoutAll(userId: string) {
    return this.sessionService.logoutAll(userId);
  }

  async verifyEmail(token: string) {
    return this.emailVerificationService.verifyEmail(token);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    return this.passwordResetService.forgotPassword(dto);
  }

  async resetPassword(dto: ResetPasswordDto) {
    return this.passwordResetService.resetPassword(dto);
  }
}

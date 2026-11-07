import {
  RegisterResponseDto,
  LoginResponseDto,
  AccessTokenResponseDto,
  ForgotPasswordResponseDto,
} from './dto/auth-response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import {
  ErrorResponseDto,
  MessageResponseDto,
} from '../common/dto/response.dto';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleOAuthService } from './services/google-oauth.service';
import { GithubOAuthService } from './services/github-oauth.service';
import {
  GithubAuthorizationResponseDto,
  GithubCallbackDto,
} from './dto/github-oauth.dto';
import {
  GoogleAuthorizationResponseDto,
  GoogleCallbackDto,
} from './dto/google-oauth.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from '../access-control/guards/jwt-auth.guard';
import { CurrentUser } from '../access-control/decorators/current-user.decorator';
import type { AccessTokenPayload } from '../access-control/types/access-token-payload.type';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleOAuth: GoogleOAuthService,
    private readonly githubOAuth: GithubOAuthService,
  ) {}

  @Post('github')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Begin GitHub login (server adapter only)',
    description:
      'Keep flowVerifier server-side bound to the initiating browser session. Redirect only to authorizationUrl. Nest sets no cookies.',
  })
  @ApiResponse({ status: 200, type: GithubAuthorizationResponseDto })
  @ApiResponse({
    status: 503,
    type: ErrorResponseDto,
    description: 'GitHub login configuration unavailable.',
  })
  github() {
    return this.githubOAuth.initiate();
  }

  @Post('github/callback')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Exchange GitHub code (server adapter only)',
    description:
      'Post code/error and state plus the private server-side flowVerifier. State is consumed before provider exchange. Login credentials must stay in server storage, never URLs. Existing accounts are never linked by matching email.',
  })
  @ApiBody({ type: GithubCallbackDto })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({
    status: 400,
    type: ErrorResponseDto,
    description: 'Malformed or undeclared callback fields.',
  })
  @ApiResponse({
    status: 401,
    type: ErrorResponseDto,
    description:
      'Invalid state, provider denial/identity, unavailable verified primary email for registration, or unavailable account/role.',
  })
  @ApiResponse({
    status: 409,
    type: ErrorResponseDto,
    description: 'Account collision; no automatic linking.',
  })
  @ApiResponse({
    status: 503,
    type: ErrorResponseDto,
    description: 'GitHub login configuration unavailable.',
  })
  githubCallback(@Body() dto: GithubCallbackDto) {
    return this.githubOAuth.callback(dto);
  }

  @Post('google')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Begin Google login (server adapter only)',
    description:
      'Retain flowVerifier server-side bound to the initiating browser session. Redirect the browser only to authorizationUrl. Nest sets no cookies.',
  })
  @ApiResponse({ status: 200, type: GoogleAuthorizationResponseDto })
  @ApiResponse({
    status: 503,
    type: ErrorResponseDto,
    description: 'Google login configuration unavailable.',
  })
  google() {
    return this.googleOAuth.initiate();
  }

  @Post('google/callback')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Exchange Google code (server adapter only)',
    description:
      'The adapter posts code/error and state from the redirect plus its private flowVerifier. Returns existing login credentials for server-side storage only. Never redirect with tokens. State is consumed before provider exchange, including denial/failure.',
  })
  @ApiBody({ type: GoogleCallbackDto })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({
    status: 400,
    type: ErrorResponseDto,
    description: 'Malformed callback.',
  })
  @ApiResponse({
    status: 401,
    type: ErrorResponseDto,
    description:
      'Invalid state, provider identity, denial or disabled account.',
  })
  @ApiResponse({
    status: 409,
    type: ErrorResponseDto,
    description: 'Account collision; no automatic linking.',
  })
  @ApiResponse({
    status: 503,
    type: ErrorResponseDto,
    description: 'Google login configuration unavailable.',
  })
  googleCallback(@Body() dto: GoogleCallbackDto) {
    return this.googleOAuth.callback(dto);
  }

  @ApiOperation({
    summary: 'Register a USER account',
    description:
      'Creates a USER only. Returns no access or refresh tokens; call POST /auth/login separately. Existing email-verification behavior is unchanged.',
  })
  @ApiBody({
    type: RegisterDto,
    examples: {
      default: {
        value: {
          email: 'user@example.com',
          password: 'StrongPassword123!',
          confirmPassword: 'StrongPassword123!',
        },
      },
    },
  })
  @ApiResponse({
    type: RegisterResponseDto,
    status: 201,
    description:
      'USER registered successfully. No session created; a subsequent login is required.',
  })
  @Post('register')
  @ApiResponse({
    type: ErrorResponseDto,
    status: 400,
    description: 'Invalid registration fields, password or confirmation.',
  })
  @ApiResponse({
    type: ErrorResponseDto,
    status: 409,
    description: 'Email or username already exists.',
  })
  @Throttle({
    default: {
      limit: 5,
      ttl: 60_000,
    },
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({
    type: LoginDto,
    examples: {
      default: {
        value: {
          email: 'user@example.com',
          password: 'StrongPassword123!',
        },
      },
    },
  })
  @ApiResponse({
    type: LoginResponseDto,
    status: 200,
    description: 'Login successful.',
  })
  @HttpCode(200)
  @Post('login')
  @Throttle({
    default: {
      limit: 10,
      ttl: 60_000,
    },
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get the current authenticated user' })
  @ApiResponse({
    type: UserResponseDto,
    status: 200,
    description: 'Current user returned successfully.',
  })
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AccessTokenPayload) {
    return this.authService.getMe(user.sub);
  }

  @ApiOperation({ summary: 'Refresh the access token' })
  @ApiBody({
    type: RefreshTokenDto,
    examples: {
      default: {
        value: {
          refreshToken: 'your-refresh-token',
        },
      },
    },
  })
  @ApiResponse({
    type: AccessTokenResponseDto,
    status: 200,
    description: 'A new access token is returned.',
  })
  @HttpCode(200)
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @ApiOperation({ summary: 'Logout the current session' })
  @ApiBody({
    type: RefreshTokenDto,
    examples: {
      default: {
        value: {
          refreshToken: 'your-refresh-token',
        },
      },
    },
  })
  @ApiResponse({
    type: MessageResponseDto,
    status: 200,
    description: 'Current refresh token is revoked.',
  })
  @HttpCode(200)
  @Post('logout')
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout all sessions for the current user' })
  @ApiResponse({
    type: MessageResponseDto,
    status: 200,
    description: 'All active refresh tokens are revoked.',
  })
  @HttpCode(200)
  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  logoutAll(@CurrentUser() user: AccessTokenPayload) {
    return this.authService.logoutAll(user.sub);
  }

  @ApiOperation({
    summary: 'Verify an email address using a verification token',
  })
  @ApiResponse({
    type: MessageResponseDto,
    status: 200,
    description: 'Email verified successfully.',
  })
  @Get('verify-email')
  @ApiQuery({ name: 'token', type: String, required: true })
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @ApiOperation({ summary: 'Request a password reset' })
  @ApiBody({
    type: ForgotPasswordDto,
    examples: {
      default: {
        value: {
          email: 'user@example.com',
        },
      },
    },
  })
  @ApiResponse({
    type: ForgotPasswordResponseDto,
    status: 200,
    description: 'Password reset request accepted.',
  })
  @Post('forgot-password')
  @HttpCode(200)
  @Throttle({
    default: {
      limit: 3,
      ttl: 60_000,
    },
  })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @ApiOperation({ summary: 'Reset password using a reset token' })
  @ApiBody({
    type: ResetPasswordDto,
    examples: {
      default: {
        value: {
          token: 'your-password-reset-token',
          newPassword: 'NewStrongPassword123!',
        },
      },
    },
  })
  @ApiResponse({
    type: MessageResponseDto,
    status: 200,
    description: 'Password reset successfully.',
  })
  @Post('reset-password')
  @HttpCode(200)
  @Throttle({
    default: {
      limit: 5,
      ttl: 60_000,
    },
  })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}

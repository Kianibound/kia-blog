import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from './types/jwt-payload.type';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({
    schema: {
      example: {
        email: 'user@example.com',
        username: 'test_user',
        password: 'StrongPassword123!',
        name: 'Test User',
      },
    },
  })
  @ApiResponse({ status: 201, description: 'User registered successfully.' })
  @Post('register')
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
    schema: {
      example: {
        email: 'user@example.com',
        password: 'StrongPassword123!',
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Login successful.' })
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
    status: 200,
    description: 'Current user returned successfully.',
  })
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtPayload) {
    return this.authService.getMe(user.sub);
  }

  @ApiOperation({ summary: 'Refresh the access token' })
  @ApiBody({
    schema: {
      example: {
        refreshToken: 'your-refresh-token',
      },
    },
  })
  @ApiResponse({
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
    schema: {
      example: {
        refreshToken: 'your-refresh-token',
      },
    },
  })
  @ApiResponse({
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
    status: 200,
    description: 'All active refresh tokens are revoked.',
  })
  @HttpCode(200)
  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @UseGuards(JwtAuthGuard)
  logoutAll(@CurrentUser() user: JwtPayload) {
    return this.authService.logoutAll(user.sub);
  }

  @ApiOperation({
    summary: 'Verify an email address using a verification token',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully.',
  })
  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @ApiOperation({ summary: 'Request a password reset' })
  @ApiBody({
    schema: {
      example: {
        email: 'user@example.com',
      },
    },
  })
  @ApiResponse({
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
    schema: {
      example: {
        token: 'your-password-reset-token',
        newPassword: 'NewStrongPassword123!',
      },
    },
  })
  @ApiResponse({
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

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Test access to an admin-only endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Admin access granted.',
  })
  @ApiResponse({
    status: 403,
    description: 'User does not have the ADMIN role.',
  })
  @Get('admin-test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminTest() {
    return {
      message: 'Admin access granted.',
    };
  }
}

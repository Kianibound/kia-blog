import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { JwtPayload } from './types/jwt-payload.type';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        verificationUrl?: string | undefined;
        user: import("../users/dto/user-response.dto").UserResponseDto;
        message: string;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: import("../users/dto/user-response.dto").UserResponseDto;
    }>;
    me(user: JwtPayload): Promise<import("../users/dto/user-response.dto").UserResponseDto>;
    refresh(dto: RefreshTokenDto): Promise<{
        accessToken: string;
    }>;
    logout(dto: RefreshTokenDto): Promise<{
        message: string;
    }>;
    logoutAll(user: JwtPayload): Promise<{
        message: string;
    }>;
    verifyEmail(token: string): Promise<{
        message: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        resetUrl?: string | undefined;
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    adminTest(): {
        message: string;
    };
}

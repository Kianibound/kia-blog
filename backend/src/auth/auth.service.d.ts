import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { TokenService } from './services/token.service';
import { EmailVerificationService } from './services/email-verification.service';
import { PasswordResetService } from './services/password-reset.service';
import { SessionService } from './services/session.service';
import { RolesService } from '../roles/roles.service';
export declare class AuthService {
    private readonly usersService;
    private readonly tokenService;
    private readonly emailVerificationService;
    private readonly passwordResetService;
    private readonly sessionService;
    private readonly rolesService;
    constructor(usersService: UsersService, tokenService: TokenService, emailVerificationService: EmailVerificationService, passwordResetService: PasswordResetService, sessionService: SessionService, rolesService: RolesService);
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
    getMe(userId: string): Promise<import("../users/dto/user-response.dto").UserResponseDto>;
    refresh(dto: RefreshTokenDto): Promise<{
        accessToken: string;
    }>;
    logout(dto: RefreshTokenDto): Promise<{
        message: string;
    }>;
    logoutAll(userId: string): Promise<{
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
}

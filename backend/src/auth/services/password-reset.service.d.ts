import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import type { ForgotPasswordDto } from '../dto/forgot-password.dto';
import type { ResetPasswordDto } from '../dto/reset-password.dto';
import { MailService } from '../../mail/mail.service';
export declare class PasswordResetService {
    private readonly prisma;
    private readonly configService;
    private readonly mailService;
    constructor(prisma: PrismaService, configService: ConfigService, mailService: MailService);
    private createPasswordResetToken;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        resetUrl?: string | undefined;
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
}

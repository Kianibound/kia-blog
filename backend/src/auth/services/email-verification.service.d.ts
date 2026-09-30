import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { MailService } from '../../mail/mail.service';
export declare class EmailVerificationService {
    private readonly configService;
    private readonly prisma;
    private readonly mailService;
    constructor(configService: ConfigService, prisma: PrismaService, mailService: MailService);
    private hashToken;
    createAndSend(userId: string, email: string): Promise<string>;
    verifyEmail(rawToken: string): Promise<{
        message: string;
    }>;
}

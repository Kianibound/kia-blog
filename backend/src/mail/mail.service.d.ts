import { ConfigService } from '@nestjs/config';
export declare class MailService {
    private readonly configService;
    private readonly resend;
    constructor(configService: ConfigService);
    sendEmailVerification(email: string, verificationUrl: string): Promise<void>;
    sendPasswordReset(email: string, resetUrl: string): Promise<void>;
}

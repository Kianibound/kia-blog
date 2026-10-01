import { TokenService } from './token.service';
import { PrismaService } from '../../database/prisma.service';
export declare class SessionService {
    private readonly prisma;
    private readonly tokenService;
    constructor(prisma: PrismaService, tokenService: TokenService);
    storeRefreshToken(userId: string, refreshToken: string, expiresAt: Date): Promise<{
        id: string;
        createdAt: Date;
        tokenHash: string;
        expiresAt: Date;
        userId: string;
        revokedAt: Date | null;
    }>;
    logoutAll(userId: string): Promise<{
        message: string;
    }>;
    refresh(refreshToken: string): Promise<{
        accessToken: string;
    }>;
    logout(refreshToken: string): Promise<{
        message: string;
    }>;
}

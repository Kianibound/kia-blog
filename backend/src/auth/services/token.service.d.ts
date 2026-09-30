import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenPayload } from '../types/access-token-payload.type';
import { RefreshTokenPayload } from '../types/refresh-token-payload.type';
export declare class TokenService {
    private readonly jwtService;
    private readonly configService;
    constructor(jwtService: JwtService, configService: ConfigService);
    createAccessToken(payload: AccessTokenPayload): Promise<string>;
    createRefreshToken(payload: RefreshTokenPayload): Promise<string>;
    verifyRefreshToken(token: string): Promise<RefreshTokenPayload>;
}

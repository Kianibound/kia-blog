"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const common_1 = require("@nestjs/common");
const argon2 = __importStar(require("argon2"));
const token_service_1 = require("./token.service");
const prisma_service_1 = require("../../database/prisma.service");
const role_constants_1 = require("../../roles/constants/role.constants");
let SessionService = class SessionService {
    prisma;
    tokenService;
    constructor(prisma, tokenService) {
        this.prisma = prisma;
        this.tokenService = tokenService;
    }
    async storeRefreshToken(userId, refreshToken, expiresAt) {
        const tokenHash = await argon2.hash(refreshToken);
        return this.prisma.refreshToken.create({
            data: {
                userId,
                tokenHash,
                expiresAt,
            },
        });
    }
    async logoutAll(userId) {
        await this.prisma.refreshToken.updateMany({
            where: {
                userId,
                revokedAt: null,
            },
            data: {
                revokedAt: new Date(),
            },
        });
        return {
            message: 'Logged out from all devices successfully.',
        };
    }
    async refresh(refreshToken) {
        let payload;
        try {
            payload = await this.tokenService.verifyRefreshToken(refreshToken);
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token.');
        }
        const tokens = await this.prisma.refreshToken.findMany({
            where: {
                userId: payload.sub,
                revokedAt: null,
                expiresAt: {
                    gt: new Date(),
                },
            },
        });
        const matches = await Promise.all(tokens.map(async (token) => ({
            token,
            matches: await argon2.verify(token.tokenHash, refreshToken),
        })));
        const validToken = matches.find((item) => item.matches);
        if (!validToken) {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token.');
        }
        const user = await this.prisma.user.findUnique({
            where: {
                id: payload.sub,
            },
            select: {
                id: true,
                email: true,
                role: {
                    select: {
                        name: true,
                    },
                },
            },
        });
        if (!user || !user.role) {
            throw new common_1.UnauthorizedException('User or role is no longer available.');
        }
        if (!(0, role_constants_1.isRoleName)(user.role.name)) {
            throw new common_1.UnauthorizedException('User role is invalid.');
        }
        const accessToken = await this.tokenService.createAccessToken({
            sub: user.id,
            email: user.email,
            role: user.role.name,
        });
        return {
            accessToken,
        };
    }
    async logout(refreshToken) {
        let payload;
        try {
            payload = await this.tokenService.verifyRefreshToken(refreshToken);
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token.');
        }
        const tokens = await this.prisma.refreshToken.findMany({
            where: {
                userId: payload.sub,
                revokedAt: null,
            },
        });
        const matches = await Promise.all(tokens.map(async (token) => ({
            token,
            matches: await argon2.verify(token.tokenHash, refreshToken),
        })));
        const validToken = matches.find((item) => item.matches);
        if (!validToken) {
            throw new common_1.UnauthorizedException('Invalid refresh token.');
        }
        await this.prisma.refreshToken.update({
            where: {
                id: validToken.token.id,
            },
            data: {
                revokedAt: new Date(),
            },
        });
        return {
            message: 'Logged out successfully.',
        };
    }
};
exports.SessionService = SessionService;
exports.SessionService = SessionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        token_service_1.TokenService])
], SessionService);
//# sourceMappingURL=session.service.js.map
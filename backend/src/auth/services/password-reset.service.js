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
exports.PasswordResetService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const node_crypto_1 = require("node:crypto");
const argon2 = __importStar(require("argon2"));
const prisma_service_1 = require("../../database/prisma.service");
const hash_token_util_1 = require("../utils/hash-token.util");
const mail_service_1 = require("../../mail/mail.service");
let PasswordResetService = class PasswordResetService {
    prisma;
    configService;
    mailService;
    constructor(prisma, configService, mailService) {
        this.prisma = prisma;
        this.configService = configService;
        this.mailService = mailService;
    }
    async createPasswordResetToken(userId) {
        const rawToken = (0, node_crypto_1.randomBytes)(32).toString('hex');
        const tokenHash = (0, hash_token_util_1.hashToken)(rawToken);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await this.prisma.passwordResetToken.create({
            data: {
                tokenHash,
                userId,
                expiresAt,
            },
        });
        return rawToken;
    }
    async forgotPassword(dto) {
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email,
            },
        });
        if (!user) {
            return {
                message: 'If an account with that email exists, a password reset link has been sent.',
            };
        }
        const resetToken = await this.createPasswordResetToken(user.id);
        const resetUrl = `${this.configService.getOrThrow('APP_URL')}` +
            `/auth/reset-password?token=${resetToken}`;
        if (this.configService.get('EMAIL_ENABLED') === 'true') {
            await this.mailService.sendPasswordReset(user.email, resetUrl);
        }
        return {
            message: 'If an account with that email exists, a password reset link has been sent.',
            ...(process.env.NODE_ENV !== 'production' && {
                resetUrl,
            }),
        };
    }
    async resetPassword(dto) {
        const tokenHash = (0, hash_token_util_1.hashToken)(dto.token);
        const resetToken = await this.prisma.passwordResetToken.findUnique({
            where: {
                tokenHash,
            },
        });
        if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Invalid or expired password reset token.');
        }
        const passwordHash = await argon2.hash(dto.newPassword);
        await this.prisma.user.update({
            where: {
                id: resetToken.userId,
            },
            data: {
                passwordHash,
            },
        });
        await this.prisma.refreshToken.updateMany({
            where: {
                userId: resetToken.userId,
                revokedAt: null,
            },
            data: {
                revokedAt: new Date(),
            },
        });
        await this.prisma.passwordResetToken.update({
            where: {
                id: resetToken.id,
            },
            data: {
                usedAt: new Date(),
            },
        });
        return {
            message: 'Password reset successfully.',
        };
    }
};
exports.PasswordResetService = PasswordResetService;
exports.PasswordResetService = PasswordResetService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        mail_service_1.MailService])
], PasswordResetService);
//# sourceMappingURL=password-reset.service.js.map
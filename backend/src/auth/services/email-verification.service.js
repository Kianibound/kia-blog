"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailVerificationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const node_crypto_1 = require("node:crypto");
const prisma_service_1 = require("../../database/prisma.service");
const mail_service_1 = require("../../mail/mail.service");
let EmailVerificationService = class EmailVerificationService {
    configService;
    prisma;
    mailService;
    constructor(configService, prisma, mailService) {
        this.configService = configService;
        this.prisma = prisma;
        this.mailService = mailService;
    }
    hashToken(token) {
        return (0, node_crypto_1.createHash)('sha256').update(token).digest('hex');
    }
    async createAndSend(userId, email) {
        const rawToken = (0, node_crypto_1.randomBytes)(32).toString('hex');
        const tokenHash = this.hashToken(rawToken);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await this.prisma.emailVerificationToken.create({
            data: {
                tokenHash,
                userId,
                expiresAt,
            },
        });
        const verificationUrl = `${this.configService.getOrThrow('APP_URL')}` +
            `/auth/verify-email?token=${rawToken}`;
        if (this.configService.get('EMAIL_ENABLED') === 'true') {
            await this.mailService.sendEmailVerification(email, verificationUrl);
        }
        return verificationUrl;
    }
    async verifyEmail(rawToken) {
        const tokenHash = this.hashToken(rawToken);
        const verificationToken = await this.prisma.emailVerificationToken.findUnique({
            where: {
                tokenHash,
            },
        });
        if (!verificationToken ||
            verificationToken.usedAt ||
            verificationToken.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Invalid or expired verification token.');
        }
        await this.prisma.user.update({
            where: {
                id: verificationToken.userId,
            },
            data: {
                emailVerified: true,
            },
        });
        await this.prisma.emailVerificationToken.update({
            where: {
                id: verificationToken.id,
            },
            data: {
                usedAt: new Date(),
            },
        });
        return {
            message: 'Email verified successfully.',
        };
    }
};
exports.EmailVerificationService = EmailVerificationService;
exports.EmailVerificationService = EmailVerificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        mail_service_1.MailService])
], EmailVerificationService);
//# sourceMappingURL=email-verification.service.js.map
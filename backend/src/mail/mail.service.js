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
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const resend_1 = require("resend");
let MailService = class MailService {
    configService;
    resend;
    constructor(configService) {
        this.configService = configService;
        this.resend = new resend_1.Resend(this.configService.getOrThrow('RESEND_API_KEY'));
    }
    async sendEmailVerification(email, verificationUrl) {
        const { error } = await this.resend.emails.send({
            from: this.configService.getOrThrow('EMAIL_FROM'),
            to: email,
            subject: 'Verify your email',
            html: `
        <p>Welcome to Kia Blog.</p>
        <p>Please verify your email:</p>
        <p><a href="${verificationUrl}">Verify email</a></p>
      `,
        });
        if (error) {
            throw new common_1.InternalServerErrorException('Failed to send verification email.');
        }
    }
    async sendPasswordReset(email, resetUrl) {
        const { error } = await this.resend.emails.send({
            from: this.configService.getOrThrow('EMAIL_FROM'),
            to: email,
            subject: 'Reset your password',
            html: `
      <p>You requested a password reset for Kia Blog.</p>
      <p>Use the link below to reset your password:</p>
      <p><a href="${resetUrl}">Reset password</a></p>
    `,
        });
        if (error) {
            throw new common_1.InternalServerErrorException('Failed to send password reset email.');
        }
    }
};
exports.MailService = MailService;
exports.MailService = MailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map
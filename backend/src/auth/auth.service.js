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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
const argon2 = __importStar(require("argon2"));
const common_2 = require("@nestjs/common");
const token_service_1 = require("./services/token.service");
const email_verification_service_1 = require("./services/email-verification.service");
const password_reset_service_1 = require("./services/password-reset.service");
const session_service_1 = require("./services/session.service");
const roles_service_1 = require("../roles/roles.service");
const role_constants_1 = require("../roles/constants/role.constants");
let AuthService = class AuthService {
    usersService;
    tokenService;
    emailVerificationService;
    passwordResetService;
    sessionService;
    rolesService;
    constructor(usersService, tokenService, emailVerificationService, passwordResetService, sessionService, rolesService) {
        this.usersService = usersService;
        this.tokenService = tokenService;
        this.emailVerificationService = emailVerificationService;
        this.passwordResetService = passwordResetService;
        this.sessionService = sessionService;
        this.rolesService = rolesService;
    }
    async register(dto) {
        const passwordHash = await argon2.hash(dto.password);
        const defaultRole = await this.rolesService.findRequiredByName('USER');
        const user = await this.usersService.create({
            email: dto.email,
            username: dto.username,
            name: dto.name,
            passwordHash,
            roleId: defaultRole.id,
        });
        const verificationUrl = await this.emailVerificationService.createAndSend(user.id, user.email);
        return {
            user,
            message: 'Registration successful. Please verify your email.',
            ...(process.env.NODE_ENV !== 'production' && {
                verificationUrl,
            }),
        };
    }
    async login(dto) {
        const user = await this.usersService.findByEmailForAuth(dto.email);
        if (!user || !user.passwordHash) {
            throw new common_2.UnauthorizedException('Invalid email or password.');
        }
        const passwordMatches = await argon2.verify(user.passwordHash, dto.password);
        if (!passwordMatches) {
            throw new common_2.UnauthorizedException('Invalid email or password.');
        }
        if (!user.role) {
            throw new common_2.UnauthorizedException('User role is not available.');
        }
        if (!(0, role_constants_1.isRoleName)(user.role.name)) {
            throw new common_2.UnauthorizedException('User role is invalid.');
        }
        const accessToken = await this.tokenService.createAccessToken({
            sub: user.id,
            email: user.email,
            role: user.role.name,
        });
        const refreshToken = await this.tokenService.createRefreshToken({
            sub: user.id,
        });
        await this.sessionService.storeRefreshToken(user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
        const safeUser = await this.usersService.findById(user.id);
        return {
            accessToken,
            refreshToken,
            user: safeUser,
        };
    }
    async getMe(userId) {
        return this.usersService.findById(userId);
    }
    async refresh(dto) {
        return this.sessionService.refresh(dto.refreshToken);
    }
    async logout(dto) {
        return this.sessionService.logout(dto.refreshToken);
    }
    async logoutAll(userId) {
        return this.sessionService.logoutAll(userId);
    }
    async verifyEmail(token) {
        return this.emailVerificationService.verifyEmail(token);
    }
    async forgotPassword(dto) {
        return this.passwordResetService.forgotPassword(dto);
    }
    async resetPassword(dto) {
        return this.passwordResetService.resetPassword(dto);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        token_service_1.TokenService,
        email_verification_service_1.EmailVerificationService,
        password_reset_service_1.PasswordResetService,
        session_service_1.SessionService,
        roles_service_1.RolesService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
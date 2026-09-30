"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const auth_controller_1 = require("./auth.controller");
const users_module_1 = require("../users/users.module");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const mail_module_1 = require("../mail/mail.module");
const token_service_1 = require("./services/token.service");
const email_verification_service_1 = require("./services/email-verification.service");
const password_reset_service_1 = require("./services/password-reset.service");
const session_service_1 = require("./services/session.service");
const roles_module_1 = require("../roles/roles.module");
const roles_guard_1 = require("./guards/roles.guard");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            users_module_1.UsersModule,
            mail_module_1.MailModule,
            roles_module_1.RolesModule,
            jwt_1.JwtModule.registerAsync({
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    secret: configService.getOrThrow('JWT_ACCESS_SECRET'),
                    signOptions: {
                        expiresIn: Number(configService.getOrThrow('JWT_ACCESS_EXPIRES_IN')),
                    },
                }),
            }),
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [
            auth_service_1.AuthService,
            jwt_auth_guard_1.JwtAuthGuard,
            roles_guard_1.RolesGuard,
            token_service_1.TokenService,
            session_service_1.SessionService,
            email_verification_service_1.EmailVerificationService,
            password_reset_service_1.PasswordResetService,
        ],
        exports: [jwt_1.JwtModule, jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map
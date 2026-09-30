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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const user_select_1 = require("./user.select");
const roles_service_1 = require("../roles/roles.service");
let UsersService = class UsersService {
    prisma;
    rolesService;
    constructor(prisma, rolesService) {
        this.prisma = prisma;
        this.rolesService = rolesService;
    }
    async findAll() {
        return this.prisma.user.findMany({
            select: user_select_1.userPublicSelect,
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async findById(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: user_select_1.userPublicSelect,
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found.');
        }
        return user;
    }
    async create(data) {
        return this.prisma.user.create({
            data,
            select: user_select_1.userPublicSelect,
        });
    }
    async findByEmailForAuth(email) {
        return this.prisma.user.findUnique({
            where: { email },
            include: {
                role: {
                    select: {
                        name: true,
                    },
                },
            },
        });
    }
    async updateRole(userId, roleName) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                id: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found.');
        }
        const role = await this.rolesService.findRequiredByName(roleName);
        return this.prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                roleId: role.id,
            },
            select: user_select_1.userPublicSelect,
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        roles_service_1.RolesService])
], UsersService);
//# sourceMappingURL=users.service.js.map
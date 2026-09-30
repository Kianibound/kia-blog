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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const slugify_1 = __importDefault(require("slugify"));
const prisma_service_1 = require("../database/prisma.service");
let CategoriesService = class CategoriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const slug = (0, slugify_1.default)(dto.name, {
            lower: true,
            strict: true,
            trim: true,
        });
        return this.prisma.category.create({
            data: {
                name: dto.name,
                slug,
            },
        });
    }
    async findAll() {
        return this.prisma.category.findMany({
            orderBy: {
                name: 'asc',
            },
        });
    }
    async update(id, dto) {
        const category = await this.prisma.category.findUnique({
            where: { id },
        });
        if (!category) {
            throw new common_1.NotFoundException('Category not found.');
        }
        const slug = dto.name
            ? (0, slugify_1.default)(dto.name, {
                lower: true,
                strict: true,
                trim: true,
            })
            : undefined;
        return this.prisma.category.update({
            where: { id },
            data: {
                ...dto,
                slug,
            },
        });
    }
    async remove(id) {
        const category = await this.prisma.category.findUnique({
            where: { id },
        });
        if (!category) {
            throw new common_1.NotFoundException('Category not found.');
        }
        await this.prisma.category.delete({
            where: { id },
        });
        return {
            message: 'Category deleted successfully.',
        };
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map
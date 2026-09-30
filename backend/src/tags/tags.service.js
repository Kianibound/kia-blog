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
exports.TagsService = void 0;
const common_1 = require("@nestjs/common");
const slugify_1 = __importDefault(require("slugify"));
const prisma_service_1 = require("../database/prisma.service");
let TagsService = class TagsService {
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
        return this.prisma.tag.create({
            data: {
                name: dto.name,
                slug,
            },
        });
    }
    async findAll() {
        return this.prisma.tag.findMany({
            orderBy: {
                name: 'asc',
            },
        });
    }
    async update(id, dto) {
        const tag = await this.prisma.tag.findUnique({
            where: { id },
        });
        if (!tag) {
            throw new common_1.NotFoundException('Tag not found.');
        }
        const slug = dto.name
            ? (0, slugify_1.default)(dto.name, {
                lower: true,
                strict: true,
                trim: true,
            })
            : undefined;
        return this.prisma.tag.update({
            where: { id },
            data: {
                ...dto,
                slug,
            },
        });
    }
    async remove(id) {
        const tag = await this.prisma.tag.findUnique({
            where: { id },
        });
        if (!tag) {
            throw new common_1.NotFoundException('Tag not found.');
        }
        await this.prisma.tag.delete({
            where: { id },
        });
        return {
            message: 'Tag deleted successfully.',
        };
    }
};
exports.TagsService = TagsService;
exports.TagsService = TagsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TagsService);
//# sourceMappingURL=tags.service.js.map
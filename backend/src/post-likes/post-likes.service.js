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
exports.PostLikesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../generated/prisma/client");
const prisma_service_1 = require("../database/prisma.service");
let PostLikesService = class PostLikesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, postId) {
        const post = await this.prisma.post.findFirst({
            where: {
                id: postId,
                status: client_1.PostStatus.PUBLISHED,
            },
            select: {
                id: true,
            },
        });
        if (!post) {
            throw new common_1.NotFoundException('Post not found.');
        }
        const existingLike = await this.prisma.postLike.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId,
                },
            },
        });
        if (existingLike) {
            return existingLike;
        }
        return this.prisma.postLike.create({
            data: {
                userId,
                postId,
            },
        });
    }
    async remove(userId, postId) {
        const like = await this.prisma.postLike.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId,
                },
            },
        });
        if (!like) {
            throw new common_1.NotFoundException('Like not found.');
        }
        await this.prisma.postLike.delete({
            where: {
                id: like.id,
            },
        });
        return {
            message: 'Like removed successfully.',
        };
    }
    async count(postId) {
        const post = await this.prisma.post.findFirst({
            where: {
                id: postId,
                status: client_1.PostStatus.PUBLISHED,
            },
            select: {
                id: true,
            },
        });
        if (!post) {
            throw new common_1.NotFoundException('Post not found.');
        }
        const count = await this.prisma.postLike.count({
            where: {
                postId,
            },
        });
        return {
            postId,
            likes: count,
        };
    }
};
exports.PostLikesService = PostLikesService;
exports.PostLikesService = PostLikesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PostLikesService);
//# sourceMappingURL=post-likes.service.js.map
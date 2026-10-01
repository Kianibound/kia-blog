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
exports.BookmarksService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../generated/prisma/client");
const prisma_service_1 = require("../database/prisma.service");
let BookmarksService = class BookmarksService {
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
        const existingBookmark = await this.prisma.bookmark.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId,
                },
            },
        });
        if (existingBookmark) {
            return existingBookmark;
        }
        return this.prisma.bookmark.create({
            data: {
                userId,
                postId,
            },
        });
    }
    async remove(userId, postId) {
        const bookmark = await this.prisma.bookmark.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId,
                },
            },
        });
        if (!bookmark) {
            throw new common_1.NotFoundException('Bookmark not found.');
        }
        await this.prisma.bookmark.delete({
            where: {
                id: bookmark.id,
            },
        });
        return {
            message: 'Bookmark removed successfully.',
        };
    }
    async findMine(userId) {
        return this.prisma.bookmark.findMany({
            where: {
                userId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                post: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                username: true,
                                name: true,
                                avatarUrl: true,
                            },
                        },
                        categories: true,
                        tags: true,
                    },
                },
            },
        });
    }
};
exports.BookmarksService = BookmarksService;
exports.BookmarksService = BookmarksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BookmarksService);
//# sourceMappingURL=bookmarks.service.js.map
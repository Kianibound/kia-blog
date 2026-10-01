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
exports.CommentsService = void 0;
const prisma_service_1 = require("../database/prisma.service");
const common_1 = require("@nestjs/common");
const role_constants_1 = require("../roles/constants/role.constants");
const client_1 = require("../generated/prisma/client");
let CommentsService = class CommentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(postId, authorId, dto) {
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
        return this.prisma.comment.create({
            data: {
                content: dto.content,
                postId,
                authorId,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
            },
        });
    }
    async findByPost(postId) {
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
        return this.prisma.comment.findMany({
            where: {
                postId,
                parentId: null,
            },
            orderBy: {
                createdAt: 'asc',
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
                replies: {
                    orderBy: {
                        createdAt: 'asc',
                    },
                    include: {
                        author: {
                            select: {
                                id: true,
                                username: true,
                                name: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
            },
        });
    }
    async reply(parentCommentId, authorId, dto) {
        const parentComment = await this.prisma.comment.findFirst({
            where: {
                id: parentCommentId,
                post: {
                    status: client_1.PostStatus.PUBLISHED,
                },
            },
            select: {
                id: true,
                postId: true,
            },
        });
        if (!parentComment) {
            throw new common_1.NotFoundException('Parent comment not found.');
        }
        return this.prisma.comment.create({
            data: {
                content: dto.content,
                authorId,
                postId: parentComment.postId,
                parentId: parentComment.id,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
            },
        });
    }
    async update(commentId, currentUserId, currentUserRole, dto) {
        const comment = await this.prisma.comment.findUnique({
            where: {
                id: commentId,
            },
        });
        if (!comment) {
            throw new common_1.NotFoundException('Comment not found.');
        }
        const isOwner = comment.authorId === currentUserId;
        const isAdmin = currentUserRole === role_constants_1.ROLE.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new common_1.ForbiddenException('You do not have permission to update this comment.');
        }
        return this.prisma.comment.update({
            where: {
                id: commentId,
            },
            data: dto,
        });
    }
    async remove(commentId, currentUserId, currentUserRole) {
        const comment = await this.prisma.comment.findUnique({
            where: {
                id: commentId,
            },
        });
        if (!comment) {
            throw new common_1.NotFoundException('Comment not found.');
        }
        const isOwner = comment.authorId === currentUserId;
        const isAdmin = currentUserRole === role_constants_1.ROLE.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new common_1.ForbiddenException('You do not have permission to delete this comment.');
        }
        await this.prisma.comment.delete({
            where: {
                id: commentId,
            },
        });
        return {
            message: 'Comment deleted successfully.',
        };
    }
};
exports.CommentsService = CommentsService;
exports.CommentsService = CommentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CommentsService);
//# sourceMappingURL=comments.service.js.map
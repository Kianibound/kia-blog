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
exports.PostsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const role_constants_1 = require("../roles/constants/role.constants");
const slugify_1 = __importDefault(require("slugify"));
const client_1 = require("../../generated/prisma/client");
let PostsService = class PostsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(authorId, dto) {
        const slug = await this.generateUniqueSlug(dto.title);
        const publishedAt = dto.status === client_1.PostStatus.PUBLISHED ? new Date() : null;
        return this.prisma.post.create({
            data: {
                title: dto.title,
                slug,
                content: dto.content,
                status: dto.status,
                publishedAt,
                authorId,
                categories: dto.categoryIds
                    ? {
                        connect: dto.categoryIds.map((id) => ({
                            id,
                        })),
                    }
                    : undefined,
                tags: dto.tagIds
                    ? {
                        connect: dto.tagIds.map((id) => ({
                            id,
                        })),
                    }
                    : undefined,
            },
            include: {
                categories: true,
                tags: true,
            },
        });
    }
    async findAll(page, limit, search, sort = 'newest', author, category, tag) {
        const skip = (page - 1) * limit;
        const where = {
            status: client_1.PostStatus.PUBLISHED,
            ...(author
                ? {
                    author: {
                        username: {
                            equals: author,
                            mode: 'insensitive',
                        },
                    },
                }
                : {}),
            ...(category
                ? {
                    categories: {
                        some: {
                            slug: category,
                        },
                    },
                }
                : {}),
            ...(tag
                ? {
                    tags: {
                        some: {
                            slug: tag,
                        },
                    },
                }
                : {}),
            ...(search
                ? {
                    OR: [
                        {
                            title: {
                                contains: search,
                                mode: 'insensitive',
                            },
                        },
                        {
                            content: {
                                contains: search,
                                mode: 'insensitive',
                            },
                        },
                    ],
                }
                : {}),
        };
        const orderBy = {
            publishedAt: sort === 'oldest' ? 'asc' : 'desc',
        };
        const [posts, total] = await Promise.all([
            this.prisma.post.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                include: {
                    author: {
                        select: {
                            id: true,
                            username: true,
                            name: true,
                            avatarUrl: true,
                        },
                    },
                    categories: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                    tags: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                },
            }),
            this.prisma.post.count({
                where,
            }),
        ]);
        return {
            data: posts,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findById(id) {
        const post = await this.prisma.post.findUnique({
            where: {
                id,
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
                categories: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
                tags: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
        });
        if (!post) {
            throw new common_1.NotFoundException('Post not found.');
        }
        return post;
    }
    async findMine(authorId, page, limit) {
        const skip = (page - 1) * limit;
        const [posts, total] = await Promise.all([
            this.prisma.post.findMany({
                where: {
                    authorId,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
            }),
            this.prisma.post.count({
                where: {
                    authorId,
                },
            }),
        ]);
        return {
            data: posts,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findMineById(postId, currentUserId, currentUserRole) {
        const post = await this.prisma.post.findUnique({
            where: {
                id: postId,
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
        if (!post) {
            throw new common_1.NotFoundException('Post not found.');
        }
        const isOwner = post.authorId === currentUserId;
        const isAdmin = currentUserRole === role_constants_1.ROLE.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new common_1.ForbiddenException('You do not have permission to access this post.');
        }
        return post;
    }
    async findBySlug(slug) {
        const post = await this.prisma.post.findFirst({
            where: {
                slug,
                status: client_1.PostStatus.PUBLISHED,
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
                categories: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
                tags: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
        });
        if (!post) {
            throw new common_1.NotFoundException('Post not found.');
        }
        return post;
    }
    async update(postId, currentUserId, currentUserRole, dto) {
        const post = await this.prisma.post.findUnique({
            where: {
                id: postId,
            },
        });
        if (!post) {
            throw new common_1.NotFoundException('Post not found.');
        }
        const isOwner = post.authorId === currentUserId;
        const isAdmin = currentUserRole === role_constants_1.ROLE.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new common_1.ForbiddenException('You do not have permission to update this post.');
        }
        let publishedAt = post.publishedAt;
        const { categoryIds, tagIds, ...postData } = dto;
        if (dto.status === client_1.PostStatus.PUBLISHED &&
            post.status !== client_1.PostStatus.PUBLISHED) {
            publishedAt = new Date();
        }
        if (dto.status === client_1.PostStatus.DRAFT) {
            publishedAt = null;
        }
        return this.prisma.post.update({
            where: {
                id: postId,
            },
            data: {
                ...postData,
                publishedAt,
                categories: categoryIds !== undefined
                    ? {
                        set: categoryIds.map((id) => ({
                            id,
                        })),
                    }
                    : undefined,
                tags: tagIds !== undefined
                    ? {
                        set: tagIds.map((id) => ({
                            id,
                        })),
                    }
                    : undefined,
            },
            include: {
                categories: true,
                tags: true,
            },
        });
    }
    async generateUniqueSlug(title) {
        const baseSlug = (0, slugify_1.default)(title, {
            lower: true,
            strict: true,
            trim: true,
        });
        let slug = baseSlug;
        let counter = 2;
        while (await this.prisma.post.findUnique({
            where: { slug },
            select: { id: true },
        })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
        return slug;
    }
    async remove(postId, currentUserId, currentUserRole) {
        const post = await this.prisma.post.findUnique({
            where: {
                id: postId,
            },
        });
        if (!post) {
            throw new common_1.NotFoundException('Post not found.');
        }
        const isOwner = post.authorId === currentUserId;
        const isAdmin = currentUserRole === role_constants_1.ROLE.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new common_1.ForbiddenException('You do not have permission to delete this post.');
        }
        await this.prisma.post.delete({
            where: {
                id: postId,
            },
        });
        return {
            message: 'Post deleted successfully.',
        };
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PostsService);
//# sourceMappingURL=posts.service.js.map
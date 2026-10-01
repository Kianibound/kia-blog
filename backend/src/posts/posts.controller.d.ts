import { PaginationQueryDto } from './dto/pagination-query.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import type { AccessTokenPayload } from '../auth/types/access-token-payload.type';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
export declare class PostsController {
    private readonly postsService;
    constructor(postsService: PostsService);
    create(user: AccessTokenPayload, dto: CreatePostDto): Promise<{
        tags: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
        }[];
        categories: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        content: string;
        status: import("../generated/prisma/enums").PostStatus;
        slug: string;
        publishedAt: Date | null;
        authorId: string;
    }>;
    findAll(query: PaginationQueryDto): Promise<{
        data: ({
            tags: {
                id: string;
                name: string;
                slug: string;
            }[];
            author: {
                id: string;
                username: string;
                name: string | null;
                avatarUrl: string | null;
            };
            categories: {
                id: string;
                name: string;
                slug: string;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            content: string;
            status: import("../generated/prisma/enums").PostStatus;
            slug: string;
            publishedAt: Date | null;
            authorId: string;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findById(id: string): Promise<{
        tags: {
            id: string;
            name: string;
            slug: string;
        }[];
        author: {
            id: string;
            username: string;
            name: string | null;
            avatarUrl: string | null;
        };
        categories: {
            id: string;
            name: string;
            slug: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        content: string;
        status: import("../generated/prisma/enums").PostStatus;
        slug: string;
        publishedAt: Date | null;
        authorId: string;
    }>;
    findMine(user: AccessTokenPayload, query: PaginationQueryDto): Promise<{
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            content: string;
            status: import("../generated/prisma/enums").PostStatus;
            slug: string;
            publishedAt: Date | null;
            authorId: string;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findMineById(id: string, user: AccessTokenPayload): Promise<{
        author: {
            id: string;
            username: string;
            name: string | null;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        content: string;
        status: import("../generated/prisma/enums").PostStatus;
        slug: string;
        publishedAt: Date | null;
        authorId: string;
    }>;
    findBySlug(slug: string): Promise<{
        tags: {
            id: string;
            name: string;
            slug: string;
        }[];
        author: {
            id: string;
            username: string;
            name: string | null;
            avatarUrl: string | null;
        };
        categories: {
            id: string;
            name: string;
            slug: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        content: string;
        status: import("../generated/prisma/enums").PostStatus;
        slug: string;
        publishedAt: Date | null;
        authorId: string;
    }>;
    update(id: string, user: AccessTokenPayload, dto: UpdatePostDto): Promise<{
        tags: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
        }[];
        categories: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        content: string;
        status: import("../generated/prisma/enums").PostStatus;
        slug: string;
        publishedAt: Date | null;
        authorId: string;
    }>;
    remove(id: string, user: AccessTokenPayload): Promise<{
        message: string;
    }>;
}

import { PrismaService } from '../database/prisma.service';
import type { CreatePostDto } from './dto/create-post.dto';
import type { RoleName } from '../roles/constants/role.constants';
import type { UpdatePostDto } from './dto/update-post.dto';
import { PostStatus } from '../../generated/prisma/client';
export declare class PostsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(authorId: string, dto: CreatePostDto): Promise<{
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
        slug: string;
        content: string;
        status: PostStatus;
        publishedAt: Date | null;
        authorId: string;
    }>;
    findAll(page: number, limit: number, search?: string, sort?: 'newest' | 'oldest', author?: string, category?: string, tag?: string): Promise<{
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
            slug: string;
            content: string;
            status: PostStatus;
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
        slug: string;
        content: string;
        status: PostStatus;
        publishedAt: Date | null;
        authorId: string;
    }>;
    findMine(authorId: string, page: number, limit: number): Promise<{
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            slug: string;
            content: string;
            status: PostStatus;
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
    findMineById(postId: string, currentUserId: string, currentUserRole: RoleName): Promise<{
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
        slug: string;
        content: string;
        status: PostStatus;
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
        slug: string;
        content: string;
        status: PostStatus;
        publishedAt: Date | null;
        authorId: string;
    }>;
    update(postId: string, currentUserId: string, currentUserRole: RoleName, dto: UpdatePostDto): Promise<{
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
        slug: string;
        content: string;
        status: PostStatus;
        publishedAt: Date | null;
        authorId: string;
    }>;
    private generateUniqueSlug;
    remove(postId: string, currentUserId: string, currentUserRole: RoleName): Promise<{
        message: string;
    }>;
}

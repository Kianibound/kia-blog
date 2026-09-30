import { PostStatus } from '../../generated/prisma/client';
import { PrismaService } from '../database/prisma.service';
export declare class BookmarksService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(userId: string, postId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        postId: string;
    }>;
    remove(userId: string, postId: string): Promise<{
        message: string;
    }>;
    findMine(userId: string): Promise<({
        post: {
            tags: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
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
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        postId: string;
    })[]>;
}

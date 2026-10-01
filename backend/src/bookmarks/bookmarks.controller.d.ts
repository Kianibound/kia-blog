import type { AccessTokenPayload } from '../auth/types/access-token-payload.type';
import { BookmarksService } from './bookmarks.service';
export declare class BookmarksController {
    private readonly bookmarksService;
    constructor(bookmarksService: BookmarksService);
    create(postId: string, user: AccessTokenPayload): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        postId: string;
    }>;
    remove(postId: string, user: AccessTokenPayload): Promise<{
        message: string;
    }>;
    findMine(user: AccessTokenPayload): Promise<({
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
            content: string;
            status: import("../generated/prisma/enums").PostStatus;
            slug: string;
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

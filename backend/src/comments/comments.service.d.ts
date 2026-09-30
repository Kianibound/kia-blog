import { PrismaService } from '../database/prisma.service';
import type { CreateCommentDto } from './dto/create-comment.dto';
import type { RoleName } from '../roles/constants/role.constants';
import type { UpdateCommentDto } from './dto/update-comment.dto';
export declare class CommentsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(postId: string, authorId: string, dto: CreateCommentDto): Promise<{
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
        content: string;
        authorId: string;
        postId: string;
        parentId: string | null;
    }>;
    findByPost(postId: string): Promise<({
        author: {
            id: string;
            username: string;
            name: string | null;
            avatarUrl: string | null;
        };
        replies: ({
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
            content: string;
            authorId: string;
            postId: string;
            parentId: string | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        authorId: string;
        postId: string;
        parentId: string | null;
    })[]>;
    reply(parentCommentId: string, authorId: string, dto: CreateCommentDto): Promise<{
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
        content: string;
        authorId: string;
        postId: string;
        parentId: string | null;
    }>;
    update(commentId: string, currentUserId: string, currentUserRole: RoleName, dto: UpdateCommentDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        authorId: string;
        postId: string;
        parentId: string | null;
    }>;
    remove(commentId: string, currentUserId: string, currentUserRole: RoleName): Promise<{
        message: string;
    }>;
}

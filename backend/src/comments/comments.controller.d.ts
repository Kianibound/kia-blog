import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import type { AccessTokenPayload } from '../auth/types/access-token-payload.type';
import { UpdateCommentDto } from './dto/update-comment.dto';
export declare class CommentsController {
    private readonly commentsService;
    constructor(commentsService: CommentsService);
    create(postId: string, user: AccessTokenPayload, dto: CreateCommentDto): Promise<{
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
    reply(commentId: string, user: AccessTokenPayload, dto: CreateCommentDto): Promise<{
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
    update(commentId: string, user: AccessTokenPayload, dto: UpdateCommentDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        authorId: string;
        postId: string;
        parentId: string | null;
    }>;
    remove(commentId: string, user: AccessTokenPayload): Promise<{
        message: string;
    }>;
}

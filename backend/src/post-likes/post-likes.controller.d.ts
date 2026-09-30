import type { AccessTokenPayload } from '../auth/types/access-token-payload.type';
import { PostLikesService } from './post-likes.service';
export declare class PostLikesController {
    private readonly postLikesService;
    constructor(postLikesService: PostLikesService);
    create(postId: string, user: AccessTokenPayload): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        postId: string;
    }>;
    remove(postId: string, user: AccessTokenPayload): Promise<{
        message: string;
    }>;
    count(postId: string): Promise<{
        postId: string;
        likes: number;
    }>;
}

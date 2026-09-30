import { PrismaService } from '../database/prisma.service';
export declare class PostLikesService {
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
    count(postId: string): Promise<{
        postId: string;
        likes: number;
    }>;
}

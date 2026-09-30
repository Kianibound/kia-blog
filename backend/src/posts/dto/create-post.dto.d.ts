import { PostStatus } from '../../../generated/prisma/client';
export declare class CreatePostDto {
    title: string;
    content: string;
    status?: PostStatus;
    categoryIds?: string[];
    tagIds?: string[];
}

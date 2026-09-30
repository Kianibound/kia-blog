import { PostStatus } from '../../../generated/prisma/client';
export declare class UpdatePostDto {
    title?: string;
    content?: string;
    status?: PostStatus;
    categoryIds?: string[];
    tagIds?: string[];
}

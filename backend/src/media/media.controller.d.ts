import type { AccessTokenPayload } from '../auth/types/access-token-payload.type';
import { MediaService } from './media.service';
export declare class MediaController {
    private readonly mediaService;
    constructor(mediaService: MediaService);
    uploadImage(user: AccessTokenPayload, file: Express.Multer.File): Promise<{
        bytes: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        url: string;
        publicId: string;
        resourceType: string;
        format: string;
        width: number | null;
        height: number | null;
        ownerId: string;
    }>;
    remove(mediaId: string, user: AccessTokenPayload): Promise<{
        message: string;
    }>;
    updateAvatar(user: AccessTokenPayload, file: Express.Multer.File): Promise<{
        role: {
            name: string;
        } | null;
        id: string;
        email: string;
        username: string;
        name: string | null;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}

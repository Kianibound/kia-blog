import { PrismaService } from '../database/prisma.service';
import { CloudinaryService } from './cloudinary.service';
import { RoleName } from '../roles/constants/role.constants';
export declare class MediaService {
    private readonly prisma;
    private readonly cloudinaryService;
    constructor(prisma: PrismaService, cloudinaryService: CloudinaryService);
    uploadImage(ownerId: string, file: Express.Multer.File): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        url: string;
        publicId: string;
        resourceType: string;
        format: string;
        bytes: number;
        width: number | null;
        height: number | null;
        ownerId: string;
    }>;
    remove(mediaId: string, currentUserId: string, currentUserRole: RoleName): Promise<{
        message: string;
    }>;
    updateAvatar(userId: string, file: Express.Multer.File): Promise<{
        id: string;
        email: string;
        username: string;
        name: string | null;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        role: {
            name: string;
        } | null;
    }>;
}

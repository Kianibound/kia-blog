import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { CloudinaryService } from './cloudinary.service';
import { ROLE, RoleName } from '../roles/constants/role.constants';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async uploadImage(ownerId: string, file: Express.Multer.File) {
    // Upload the actual file to Cloudinary
    const uploaded = await this.cloudinaryService.uploadImage(file);

    // Store only metadata and the remote URL in our database
    return this.prisma.media.create({
      data: {
        ownerId,
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        resourceType: uploaded.resource_type,
        format: uploaded.format,
        bytes: uploaded.bytes,
        width: uploaded.width ?? null,
        height: uploaded.height ?? null,
      },
    });
  }

  async remove(
    mediaId: string,
    currentUserId: string,
    currentUserRole: RoleName,
  ) {
    // Load media first so we can check ownership
    const media = await this.prisma.media.findUnique({
      where: {
        id: mediaId,
      },
    });

    if (!media) {
      throw new NotFoundException('Media not found.');
    }

    const isOwner = media.ownerId === currentUserId;
    const isAdmin = currentUserRole === ROLE.ADMIN;

    // Users can only delete their own media.
    // Admins can delete any media.
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to delete this media.',
      );
    }

    // Delete the actual image from Cloudinary first
    await this.cloudinaryService.deleteImage(media.publicId);

    // Remove its metadata from our database
    await this.prisma.media.delete({
      where: {
        id: media.id,
      },
    });

    return {
      message: 'Media deleted successfully.',
    };
  }
}

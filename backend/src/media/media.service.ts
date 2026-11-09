import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { CloudinaryService } from './cloudinary.service';
import { ROLE, RoleName } from '../roles/constants/role.constants';
import { Prisma } from '../generated/prisma/client';
import { avatarUserSelect } from '../users/user.select';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async uploadImage(ownerId: string, file: Express.Multer.File) {
    // Upload the actual file to Cloudinary
    const uploaded = await this.cloudinaryService.uploadImage(file);

    try {
      // Store only metadata and the remote URL in our database.
      return await this.prisma.media.create({
        data: this.toMediaData(ownerId, uploaded),
      });
    } catch (error) {
      // The upload already happened, so compensate if persistence fails.
      await this.deleteRemoteImageBestEffort(
        uploaded.public_id,
        'rolling back an image whose database record could not be created',
      );
      throw error;
    }
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

    try {
      // Delete in an open transaction first: the restrictive FK blocks any
      // referenced image before remote I/O and serializes concurrent attachment.
      // Remote failure rolls metadata back; remote deletion is idempotent.
      await this.prisma.$transaction(async (transaction) => {
        await transaction.media.delete({ where: { id: media.id } });
        await this.cloudinaryService.deleteImage(media.publicId);
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003')
          throw new ConflictException(
            'Media is referenced by an article. Remove its image node first.',
          );
        if (error.code === 'P2025')
          throw new NotFoundException('Media not found.');
      }
      throw error;
    }

    return {
      message: 'Media deleted successfully.',
    };
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    // Load the current avatar before uploading the new one
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        avatarMedia: {
          select: {
            id: true,
            publicId: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const uploaded = await this.cloudinaryService.uploadImage(file);

    let updatedUser;

    try {
      // Creating Media and activating it as the Avatar are one database
      // workflow. A failure rolls both writes back.
      updatedUser = await this.prisma.$transaction(async (transaction) => {
        const newMedia = await transaction.media.create({
          data: this.toMediaData(userId, uploaded),
        });

        return transaction.user.update({
          where: {
            id: userId,
          },
          data: {
            avatarMediaId: newMedia.id,
            avatarUrl: newMedia.url,
          },
          select: avatarUserSelect,
        });
      });
    } catch (error) {
      // Roll back the external side effect when the database transaction fails.
      await this.deleteRemoteImageBestEffort(
        uploaded.public_id,
        'rolling back an avatar whose database transaction failed',
      );
      throw error;
    }

    // The new Avatar is already committed. Cleanup is deliberately best-effort
    // so a remote failure does not turn a successful replacement into a false
    // error response. Keeping the old row makes cleanup safely retryable.
    if (user.avatarMedia) {
      try {
        await this.remove(user.avatarMedia.id, userId, ROLE.USER);
      } catch (error) {
        // A shared article image is deliberately retained, not a cleanup error.
        if (error instanceof ConflictException) return updatedUser;
        this.logger.error(
          `Failed to clean up previous avatar ${user.avatarMedia.id}.`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    return updatedUser;
  }

  async removeAvatar(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        avatarMedia: {
          select: {
            id: true,
            publicId: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Idempotent when no avatar exists: return the safe projection without any
    // write, so a concurrent upload can never be clobbered by a no-op removal.
    if (!user.avatarMedia) {
      const currentUser = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: avatarUserSelect,
      });
      if (!currentUser) {
        throw new NotFoundException('User not found.');
      }
      return currentUser;
    }

    const detachedMedia = user.avatarMedia;

    // Conditional clear: the update only matches while avatarMediaId is still
    // the value observed above. A concurrent replacement (M1 -> M2) therefore
    // fails the condition instead of wiping the freshly committed avatar.
    let updatedUser;
    try {
      updatedUser = await this.prisma.user.update({
        where: {
          id: userId,
          avatarMediaId: detachedMedia.id,
        },
        data: {
          avatarMediaId: null,
          avatarUrl: null,
        },
        select: avatarUserSelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        const stillExists = await this.prisma.user.findUnique({
          where: {
            id: userId,
          },
          select: { id: true },
        });
        if (!stillExists) {
          throw new NotFoundException('User not found.');
        }
        throw new ConflictException(
          'Avatar changed concurrently; reload and retry.',
        );
      }
      throw error;
    }

    // Only the media actually detached by this request is cleaned up; a
    // concurrent replacement keeps its own new avatar. Article body/cover media
    // is retained by the media service (FK RESTRICT -> 409), and a Cloudinary
    // failure stays best-effort while the avatar is already removed.
    try {
      await this.remove(detachedMedia.id, userId, ROLE.USER);
    } catch (error) {
      if (error instanceof ConflictException) return updatedUser;
      this.logger.error(
        `Failed to clean up removed avatar ${detachedMedia.id}.`,
        error instanceof Error ? error.stack : undefined,
      );
    }

    return updatedUser;
  }

  private toMediaData(
    ownerId: string,
    uploaded: Awaited<ReturnType<CloudinaryService['uploadImage']>>,
  ) {
    return {
      ownerId,
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
      resourceType: uploaded.resource_type,
      format: uploaded.format,
      bytes: uploaded.bytes,
      width: uploaded.width ?? null,
      height: uploaded.height ?? null,
    };
  }

  private async deleteRemoteImageBestEffort(
    publicId: string,
    context: string,
  ): Promise<void> {
    try {
      await this.cloudinaryService.deleteImage(publicId);
    } catch (error) {
      this.logger.error(
        `Failed to delete Cloudinary image ${publicId} while ${context}.`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}

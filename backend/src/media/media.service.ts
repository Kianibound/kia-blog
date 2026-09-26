import { Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { CloudinaryService } from './cloudinary.service';

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
}

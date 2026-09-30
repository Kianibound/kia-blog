"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const cloudinary_service_1 = require("./cloudinary.service");
const role_constants_1 = require("../roles/constants/role.constants");
let MediaService = class MediaService {
    prisma;
    cloudinaryService;
    constructor(prisma, cloudinaryService) {
        this.prisma = prisma;
        this.cloudinaryService = cloudinaryService;
    }
    async uploadImage(ownerId, file) {
        const uploaded = await this.cloudinaryService.uploadImage(file);
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
    async remove(mediaId, currentUserId, currentUserRole) {
        const media = await this.prisma.media.findUnique({
            where: {
                id: mediaId,
            },
        });
        if (!media) {
            throw new common_1.NotFoundException('Media not found.');
        }
        const isOwner = media.ownerId === currentUserId;
        const isAdmin = currentUserRole === role_constants_1.ROLE.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new common_1.ForbiddenException('You do not have permission to delete this media.');
        }
        await this.cloudinaryService.deleteImage(media.publicId);
        await this.prisma.media.delete({
            where: {
                id: media.id,
            },
        });
        return {
            message: 'Media deleted successfully.',
        };
    }
    async updateAvatar(userId, file) {
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
            throw new common_1.NotFoundException('User not found.');
        }
        const newMedia = await this.uploadImage(userId, file);
        const updatedUser = await this.prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                avatarMediaId: newMedia.id,
                avatarUrl: newMedia.url,
            },
            select: {
                id: true,
                email: true,
                username: true,
                name: true,
                avatarUrl: true,
                createdAt: true,
                updatedAt: true,
                role: {
                    select: {
                        name: true,
                    },
                },
            },
        });
        if (user.avatarMedia) {
            await this.cloudinaryService.deleteImage(user.avatarMedia.publicId);
            await this.prisma.media.delete({
                where: {
                    id: user.avatarMedia.id,
                },
            });
        }
        return updatedUser;
    }
};
exports.MediaService = MediaService;
exports.MediaService = MediaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cloudinary_service_1.CloudinaryService])
], MediaService);
//# sourceMappingURL=media.service.js.map
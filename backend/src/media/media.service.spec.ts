import { Logger } from '@nestjs/common';
import { jest } from '@jest/globals';

import type { PrismaService } from '../database/prisma.service';
import type { CloudinaryService } from './cloudinary.service';
import { MediaService } from './media.service';

describe('MediaService', () => {
  const file = { buffer: Buffer.from('image') } as Express.Multer.File;
  const uploaded = {
    secure_url: 'https://cloudinary.example/new-image',
    public_id: 'new-public-id',
    resource_type: 'image',
    format: 'png',
    bytes: 128,
    width: 10,
    height: 10,
  };

  const createFixture = () => {
    const transaction = {
      media: {
        create: jest.fn(),
      },
      user: {
        update: jest.fn(),
      },
    };

    const prisma = {
      media: {
        create: jest.fn(),
        delete: jest.fn(),
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(
        async (callback: (client: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
    };

    const cloudinary = {
      uploadImage: jest.fn(),
      deleteImage: jest.fn(),
    };

    const service = new MediaService(
      prisma as unknown as PrismaService,
      cloudinary as unknown as CloudinaryService,
    );

    return { cloudinary, prisma, service, transaction };
  };

  it('deletes the uploaded asset when creating its database record fails', async () => {
    const { cloudinary, prisma, service } = createFixture();
    const databaseError = new Error('database unavailable');

    cloudinary.uploadImage.mockResolvedValue(uploaded);
    cloudinary.deleteImage.mockResolvedValue({ result: 'ok' });
    prisma.media.create.mockRejectedValue(databaseError);

    await expect(service.uploadImage('user-id', file)).rejects.toBe(
      databaseError,
    );
    expect(cloudinary.deleteImage).toHaveBeenCalledWith('new-public-id');
  });

  it('deletes the new remote avatar when its database transaction fails', async () => {
    const { cloudinary, prisma, service, transaction } = createFixture();
    const databaseError = new Error('user update failed');

    prisma.user.findUnique.mockResolvedValue({
      id: 'user-id',
      avatarMedia: { id: 'old-media-id', publicId: 'old-public-id' },
    });
    cloudinary.uploadImage.mockResolvedValue(uploaded);
    cloudinary.deleteImage.mockResolvedValue({ result: 'ok' });
    transaction.media.create.mockResolvedValue({
      id: 'new-media-id',
      url: uploaded.secure_url,
    });
    transaction.user.update.mockRejectedValue(databaseError);

    await expect(service.updateAvatar('user-id', file)).rejects.toBe(
      databaseError,
    );

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(cloudinary.deleteImage).toHaveBeenCalledTimes(1);
    expect(cloudinary.deleteImage).toHaveBeenCalledWith('new-public-id');
    expect(prisma.media.delete).not.toHaveBeenCalled();
  });

  it('keeps a successful avatar replacement when old-image cleanup fails', async () => {
    const { cloudinary, prisma, service, transaction } = createFixture();
    const loggerError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const updatedUser = {
      id: 'user-id',
      avatarUrl: uploaded.secure_url,
    };

    prisma.user.findUnique.mockResolvedValue({
      id: 'user-id',
      avatarMedia: { id: 'old-media-id', publicId: 'old-public-id' },
    });
    cloudinary.uploadImage.mockResolvedValue(uploaded);
    cloudinary.deleteImage.mockRejectedValue(new Error('Cloudinary timeout'));
    transaction.media.create.mockResolvedValue({
      id: 'new-media-id',
      url: uploaded.secure_url,
    });
    transaction.user.update.mockResolvedValue(updatedUser);

    await expect(service.updateAvatar('user-id', file)).resolves.toBe(
      updatedUser,
    );
    expect(cloudinary.deleteImage).toHaveBeenCalledWith('old-public-id');
    expect(prisma.media.delete).not.toHaveBeenCalled();
    loggerError.mockRestore();
  });
});

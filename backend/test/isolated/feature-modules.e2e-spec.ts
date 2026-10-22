import { vi as jest } from 'vitest';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DatabaseModule } from '../../src/database/database.module';
import { PrismaService } from '../../src/database/prisma.service';
import { AuthModule } from '../../src/auth/auth.module';
import { UsersModule } from '../../src/users/users.module';
import { RolesModule } from '../../src/roles/roles.module';
import { PostsModule } from '../../src/posts/posts.module';
import { PublishedPostsModule } from '../../src/published-posts/published-posts.module';
import { CategoriesModule } from '../../src/categories/categories.module';
import { TagsModule } from '../../src/tags/tags.module';
import { CommentsModule } from '../../src/comments/comments.module';
import { BookmarksModule } from '../../src/bookmarks/bookmarks.module';
import { PostLikesModule } from '../../src/post-likes/post-likes.module';
import { MediaModule } from '../../src/media/media.module';
import { AdminModule } from '../../src/admin/admin.module';
import { MailService } from '../../src/mail/mail.service';
import { CloudinaryService } from '../../src/media/cloudinary.service';

const featureModules = [
  AuthModule,
  UsersModule,
  RolesModule,
  PostsModule,
  PublishedPostsModule,
  CategoriesModule,
  TagsModule,
  CommentsModule,
  BookmarksModule,
  PostLikesModule,
  MediaModule,
  AdminModule,
];
const config = {
  getOrThrow: (key: string) => {
    const values: Record<string, string> = {
      JWT_ACCESS_SECRET: 'module-isolation-test-secret',
      JWT_ACCESS_EXPIRES_IN: '900',
    };
    const value = values[key];
    if (!value) throw new Error(`Unexpected configuration: ${key}`);
    return value;
  },
};

// No AppModule and no root DatabaseModule: each feature must declare its own dependencies.
describe('Explicit database module wiring', () => {
  it.each(featureModules)(
    '%p initializes independently with substituted I/O',
    async (feature) => {
      const persistence = {
        onModuleInit: jest.fn(),
        onModuleDestroy: jest.fn(),
      };
      const module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
          feature,
        ],
      })
        .overrideProvider(ConfigService)
        .useValue(config)
        .overrideProvider(PrismaService)
        .useValue(persistence)
        .overrideProvider(MailService)
        .useValue({})
        .overrideProvider(CloudinaryService)
        .useValue({})
        .compile();
      try {
        await module.init();
        expect(module.get(PrismaService)).toBe(persistence);
        expect(persistence.onModuleInit).toHaveBeenCalledTimes(1);
      } finally {
        await module.close();
      }
      expect(persistence.onModuleDestroy).toHaveBeenCalledTimes(1);
    },
  );

  it('shares one database adapter when several features import the same module', async () => {
    const persistence = { onModuleInit: jest.fn(), onModuleDestroy: jest.fn() };
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        ...featureModules,
      ],
    })
      .overrideProvider(ConfigService)
      .useValue(config)
      .overrideProvider(PrismaService)
      .useValue(persistence)
      .overrideProvider(MailService)
      .useValue({})
      .overrideProvider(CloudinaryService)
      .useValue({})
      .compile();
    try {
      await module.init();
      expect(persistence.onModuleInit).toHaveBeenCalledTimes(1);
    } finally {
      await module.close();
    }
    expect(persistence.onModuleDestroy).toHaveBeenCalledTimes(1);
  });

  it('does not leak Prisma from a root/sibling import into an undeclared consumer', async () => {
    @Module({
      providers: [
        {
          provide: 'undeclared-consumer',
          inject: [PrismaService],
          useFactory: (prisma: PrismaService) => prisma,
        },
      ],
    })
    class UndeclaredDatabaseConsumer {}
    await expect(
      Test.createTestingModule({
        imports: [DatabaseModule, UndeclaredDatabaseConsumer],
      })
        .overrideProvider(PrismaService)
        .useValue({})
        .compile(),
    ).rejects.toThrow('PrismaService');
  });
});

import {
  Module,
  type NestModule,
  type MiddlewareConsumer,
} from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { PostsModule } from './posts/posts.module';
import { CategoriesModule } from './categories/categories.module';
import { TagsModule } from './tags/tags.module';
import { CommentsModule } from './comments/comments.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { PostLikesModule } from './post-likes/post-likes.module';
import { MediaModule } from './media/media.module';
import { AdminModule } from './admin/admin.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
    UsersModule,
    AuthModule,
    RolesModule,
    PostsModule,
    CategoriesModule,
    TagsModule,
    CommentsModule,
    BookmarksModule,
    PostLikesModule,
    MediaModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((request: Request, response: Response, next: NextFunction) => {
        if (
          request.headers.authorization ||
          request.originalUrl.toLowerCase().startsWith('/auth/')
        ) {
          response.setHeader('Cache-Control', 'private, no-store');
          response.setHeader('Pragma', 'no-cache');
        }
        next();
      })
      .forRoutes('{*path}');
  }
}

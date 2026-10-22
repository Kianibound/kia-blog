import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PublishedPosts } from './published-posts';

@Module({
  imports: [DatabaseModule],
  providers: [PublishedPosts],
  exports: [PublishedPosts],
})
export class PublishedPostsModule {}

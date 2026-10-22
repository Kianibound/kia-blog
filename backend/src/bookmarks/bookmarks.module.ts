import { PublishedPostsModule } from '../published-posts/published-posts.module';
import { Module } from '@nestjs/common';

import { AccessControlModule } from '../access-control/access-control.module';
import { BookmarksController } from './bookmarks.controller';
import { BookmarksService } from './bookmarks.service';

@Module({
  imports: [AccessControlModule, PublishedPostsModule],
  controllers: [BookmarksController],
  providers: [BookmarksService],
})
export class BookmarksModule {}

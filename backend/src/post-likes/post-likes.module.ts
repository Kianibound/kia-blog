import { DatabaseModule } from '../database/database.module';
import { PublishedPostsModule } from '../published-posts/published-posts.module';
import { Module } from '@nestjs/common';

import { AccessControlModule } from '../access-control/access-control.module';
import { PostLikesController } from './post-likes.controller';
import { PostLikesService } from './post-likes.service';

@Module({
  imports: [DatabaseModule, AccessControlModule, PublishedPostsModule],
  controllers: [PostLikesController],
  providers: [PostLikesService],
})
export class PostLikesModule {}

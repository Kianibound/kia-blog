import { DatabaseModule } from '../database/database.module';
import { PublishedPostsModule } from '../published-posts/published-posts.module';
import { Module } from '@nestjs/common';

import { AccessControlModule } from '../access-control/access-control.module';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [DatabaseModule, AccessControlModule, PublishedPostsModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}

import { DatabaseModule } from '../database/database.module';
import { Module } from '@nestjs/common';
import { AccessControlModule } from '../access-control/access-control.module';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PostCommands } from './post-commands';
import { PostQueries } from './post-queries';
import { PublishedPostsModule } from '../published-posts/published-posts.module';

@Module({
  imports: [DatabaseModule, AccessControlModule, PublishedPostsModule],
  controllers: [PostsController],
  providers: [PostsService, PostCommands, PostQueries],
})
export class PostsModule {}

import { Module } from '@nestjs/common';
import { AccessControlModule } from '../access-control/access-control.module';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [AccessControlModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}

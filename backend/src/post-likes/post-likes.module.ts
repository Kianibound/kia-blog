import { Module } from '@nestjs/common';

import { AccessControlModule } from '../access-control/access-control.module';
import { PostLikesController } from './post-likes.controller';
import { PostLikesService } from './post-likes.service';

@Module({
  imports: [AccessControlModule],
  controllers: [PostLikesController],
  providers: [PostLikesService],
})
export class PostLikesModule {}

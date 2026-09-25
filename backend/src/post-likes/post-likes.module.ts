import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PostLikesController } from './post-likes.controller';
import { PostLikesService } from './post-likes.service';

@Module({
  imports: [AuthModule],
  controllers: [PostLikesController],
  providers: [PostLikesService],
})
export class PostLikesModule {}

import { Module } from '@nestjs/common';

import { AccessControlModule } from '../access-control/access-control.module';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [AccessControlModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}

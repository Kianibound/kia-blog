import { Module } from '@nestjs/common';

import { AccessControlModule } from '../access-control/access-control.module';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';

@Module({
  imports: [AccessControlModule],
  controllers: [TagsController],
  providers: [TagsService],
})
export class TagsModule {}

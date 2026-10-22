import { DatabaseModule } from '../database/database.module';
import { Module } from '@nestjs/common';

import { AccessControlModule } from '../access-control/access-control.module';
import { CloudinaryService } from './cloudinary.service';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

@Module({
  imports: [DatabaseModule, AccessControlModule],
  controllers: [MediaController],
  providers: [MediaService, CloudinaryService],
  exports: [MediaService],
})
export class MediaModule {}

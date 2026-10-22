import { DatabaseModule } from '../database/database.module';
import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';

@Module({
  imports: [DatabaseModule],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}

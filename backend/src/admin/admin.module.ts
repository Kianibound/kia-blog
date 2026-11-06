import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';

import { AccessControlModule } from '../access-control/access-control.module';
import { UsersModule } from '../users/users.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [DatabaseModule, AccessControlModule, UsersModule],
  controllers: [AdminController],
})
export class AdminModule {}

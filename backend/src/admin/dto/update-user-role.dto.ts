import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

import { ROLE, type RoleName } from '../../roles/constants/role.constants';

export class UpdateUserRoleDto {
  @ApiProperty({ enum: ROLE, type: String })
  @IsIn(Object.values(ROLE))
  role: RoleName;
}

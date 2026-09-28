import { IsIn } from 'class-validator';

import { ROLE, type RoleName } from '../../roles/constants/role.constants';

export class UpdateUserRoleDto {
  @IsIn(Object.values(ROLE))
  role: RoleName;
}

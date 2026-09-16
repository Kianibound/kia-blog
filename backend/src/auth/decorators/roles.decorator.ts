import { SetMetadata } from '@nestjs/common';
import type { RoleName } from '../../roles/constants/role.constants';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);

import type { RoleName } from '../../roles/constants/role.constants';

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: RoleName;
};

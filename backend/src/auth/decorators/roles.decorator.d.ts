import type { RoleName } from '../../roles/constants/role.constants';
export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: RoleName[]) => import("@nestjs/common", { with: { "resolution-mode": "import" } }).CustomDecorator<string>;

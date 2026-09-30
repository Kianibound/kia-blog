import { PrismaService } from '../database/prisma.service';
import { UserResponseDto } from './dto/user-response.dto';
import { RolesService } from '../roles/roles.service';
import { RoleName } from '../roles/constants/role.constants';
export declare class UsersService {
    private readonly prisma;
    private readonly rolesService;
    constructor(prisma: PrismaService, rolesService: RolesService);
    findAll(): Promise<UserResponseDto[]>;
    findById(id: string): Promise<UserResponseDto>;
    create(data: {
        email: string;
        username: string;
        name: string;
        passwordHash: string;
        roleId: string;
    }): Promise<UserResponseDto>;
    findByEmailForAuth(email: string): Promise<({
        role: {
            name: string;
        } | null;
    } & {
        id: string;
        email: string;
        username: string;
        name: string | null;
        avatarUrl: string | null;
        passwordHash: string | null;
        roleId: string | null;
        emailVerified: boolean;
        avatarMediaId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    updateRole(userId: string, roleName: RoleName): Promise<UserResponseDto>;
}

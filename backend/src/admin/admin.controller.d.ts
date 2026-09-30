import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UsersService } from '../users/users.service';
export declare class AdminController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findUsers(): Promise<import("../users/dto/user-response.dto").UserResponseDto[]>;
    updateUserRole(id: string, dto: UpdateUserRoleDto): Promise<import("../users/dto/user-response.dto").UserResponseDto>;
    findUserById(id: string): Promise<import("../users/dto/user-response.dto").UserResponseDto>;
}

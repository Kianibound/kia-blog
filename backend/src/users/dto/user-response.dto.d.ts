export declare class UserRoleResponseDto {
    name: string;
}
export declare class UserResponseDto {
    id: string;
    email: string;
    username: string;
    name: string | null;
    avatarUrl: string | null;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    role: UserRoleResponseDto | null;
}

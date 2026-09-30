export declare const ROLE: {
    readonly USER: "USER";
    readonly AUTHOR: "AUTHOR";
    readonly ADMIN: "ADMIN";
};
export type RoleName = (typeof ROLE)[keyof typeof ROLE];
export declare function isRoleName(value: string): value is RoleName;

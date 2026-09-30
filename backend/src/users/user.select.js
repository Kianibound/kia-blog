"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userPublicSelect = void 0;
exports.userPublicSelect = {
    id: true,
    email: true,
    username: true,
    name: true,
    avatarUrl: true,
    emailVerified: true,
    createdAt: true,
    updatedAt: true,
    role: {
        select: {
            name: true,
        },
    },
};
//# sourceMappingURL=user.select.js.map
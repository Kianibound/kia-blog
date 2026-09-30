"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE = void 0;
exports.isRoleName = isRoleName;
exports.ROLE = {
    USER: 'USER',
    AUTHOR: 'AUTHOR',
    ADMIN: 'ADMIN',
};
function isRoleName(value) {
    return Object.values(exports.ROLE).includes(value);
}
//# sourceMappingURL=role.constants.js.map
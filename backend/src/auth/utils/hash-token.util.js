"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashToken = hashToken;
const node_crypto_1 = require("node:crypto");
function hashToken(token) {
    return (0, node_crypto_1.createHash)('sha256').update(token).digest('hex');
}
//# sourceMappingURL=hash-token.util.js.map
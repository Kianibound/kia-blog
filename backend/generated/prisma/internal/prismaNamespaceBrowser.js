"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.NullsOrder = exports.QueryMode = exports.SortOrder = exports.MediaScalarFieldEnum = exports.PostLikeScalarFieldEnum = exports.BookmarkScalarFieldEnum = exports.CommentScalarFieldEnum = exports.TagScalarFieldEnum = exports.CategoryScalarFieldEnum = exports.PostScalarFieldEnum = exports.PasswordResetTokenScalarFieldEnum = exports.EmailVerificationTokenScalarFieldEnum = exports.RefreshTokenScalarFieldEnum = exports.RoleScalarFieldEnum = exports.UserScalarFieldEnum = exports.TransactionIsolationLevel = exports.ModelName = exports.AnyNull = exports.JsonNull = exports.DbNull = exports.NullTypes = exports.Decimal = void 0;
const runtime = __importStar(require("@prisma/client/runtime/index-browser"));
exports.Decimal = runtime.Decimal;
exports.NullTypes = {
    DbNull: runtime.NullTypes.DbNull,
    JsonNull: runtime.NullTypes.JsonNull,
    AnyNull: runtime.NullTypes.AnyNull,
};
exports.DbNull = runtime.DbNull;
exports.JsonNull = runtime.JsonNull;
exports.AnyNull = runtime.AnyNull;
exports.ModelName = {
    User: 'User',
    Role: 'Role',
    RefreshToken: 'RefreshToken',
    EmailVerificationToken: 'EmailVerificationToken',
    PasswordResetToken: 'PasswordResetToken',
    Post: 'Post',
    Category: 'Category',
    Tag: 'Tag',
    Comment: 'Comment',
    Bookmark: 'Bookmark',
    PostLike: 'PostLike',
    Media: 'Media'
};
exports.TransactionIsolationLevel = runtime.makeStrictEnum({
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
});
exports.UserScalarFieldEnum = {
    id: 'id',
    email: 'email',
    username: 'username',
    name: 'name',
    avatarUrl: 'avatarUrl',
    passwordHash: 'passwordHash',
    roleId: 'roleId',
    emailVerified: 'emailVerified',
    avatarMediaId: 'avatarMediaId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.RoleScalarFieldEnum = {
    id: 'id',
    name: 'name',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.RefreshTokenScalarFieldEnum = {
    id: 'id',
    tokenHash: 'tokenHash',
    userId: 'userId',
    expiresAt: 'expiresAt',
    revokedAt: 'revokedAt',
    createdAt: 'createdAt'
};
exports.EmailVerificationTokenScalarFieldEnum = {
    id: 'id',
    tokenHash: 'tokenHash',
    userId: 'userId',
    expiresAt: 'expiresAt',
    usedAt: 'usedAt',
    createdAt: 'createdAt'
};
exports.PasswordResetTokenScalarFieldEnum = {
    id: 'id',
    tokenHash: 'tokenHash',
    userId: 'userId',
    expiresAt: 'expiresAt',
    usedAt: 'usedAt',
    createdAt: 'createdAt'
};
exports.PostScalarFieldEnum = {
    id: 'id',
    title: 'title',
    slug: 'slug',
    content: 'content',
    status: 'status',
    publishedAt: 'publishedAt',
    authorId: 'authorId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.CategoryScalarFieldEnum = {
    id: 'id',
    name: 'name',
    slug: 'slug',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.TagScalarFieldEnum = {
    id: 'id',
    name: 'name',
    slug: 'slug',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.CommentScalarFieldEnum = {
    id: 'id',
    content: 'content',
    postId: 'postId',
    authorId: 'authorId',
    parentId: 'parentId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.BookmarkScalarFieldEnum = {
    id: 'id',
    userId: 'userId',
    postId: 'postId',
    createdAt: 'createdAt'
};
exports.PostLikeScalarFieldEnum = {
    id: 'id',
    userId: 'userId',
    postId: 'postId',
    createdAt: 'createdAt'
};
exports.MediaScalarFieldEnum = {
    id: 'id',
    url: 'url',
    publicId: 'publicId',
    resourceType: 'resourceType',
    format: 'format',
    bytes: 'bytes',
    width: 'width',
    height: 'height',
    ownerId: 'ownerId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.SortOrder = {
    asc: 'asc',
    desc: 'desc'
};
exports.QueryMode = {
    default: 'default',
    insensitive: 'insensitive'
};
exports.NullsOrder = {
    first: 'first',
    last: 'last'
};
//# sourceMappingURL=prismaNamespaceBrowser.js.map
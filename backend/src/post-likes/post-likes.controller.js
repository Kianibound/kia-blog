"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostLikesController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const post_likes_service_1 = require("./post-likes.service");
let PostLikesController = class PostLikesController {
    postLikesService;
    constructor(postLikesService) {
        this.postLikesService = postLikesService;
    }
    create(postId, user) {
        return this.postLikesService.create(user.sub, postId);
    }
    remove(postId, user) {
        return this.postLikesService.remove(user.sub, postId);
    }
    count(postId) {
        return this.postLikesService.count(postId);
    }
};
exports.PostLikesController = PostLikesController;
__decorate([
    (0, common_1.Post)('posts/:postId/like'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('postId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PostLikesController.prototype, "create", null);
__decorate([
    (0, common_1.Delete)('posts/:postId/like'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('postId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PostLikesController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('posts/:postId/likes'),
    __param(0, (0, common_1.Param)('postId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PostLikesController.prototype, "count", null);
exports.PostLikesController = PostLikesController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [post_likes_service_1.PostLikesService])
], PostLikesController);
//# sourceMappingURL=post-likes.controller.js.map
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
exports.CommentsController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const auth_session_service_1 = require("../auth/auth-session.service");
const supabase_service_1 = require("../supabase/supabase.service");
class AddCommentDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddCommentDto.prototype, "slug", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], AddCommentDto.prototype, "body", void 0);
let CommentsController = class CommentsController {
    constructor(supabase, authSessions) {
        this.supabase = supabase;
        this.authSessions = authSessions;
    }
    async add(dto, req, res) {
        const user = await this.authSessions.requireUser(req, res);
        const authorName = user.user_metadata?.['full_name'] ?? user.user_metadata?.['name'] ?? 'Anónimo';
        const { data: comment, error: insertError } = await this.supabase.admin
            .from('comments')
            .insert({
            post_slug: dto.slug,
            user_id: user.id,
            author_name: authorName,
            body: dto.body,
            reported: false,
        })
            .select('id, post_slug, user_id, author_name, body, created_at')
            .single();
        if (insertError)
            throw new common_1.BadRequestException(insertError.message);
        return {
            ok: true,
            comment: {
                id: comment.id,
                author: comment.author_name,
                body: comment.body,
                date: this.formatCommentDate(comment.created_at),
            },
        };
    }
    formatCommentDate(value) {
        return new Intl.DateTimeFormat('es-EC', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(value));
    }
};
exports.CommentsController = CommentsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AddCommentDto, Object, Object]),
    __metadata("design:returntype", Promise)
], CommentsController.prototype, "add", null);
exports.CommentsController = CommentsController = __decorate([
    (0, common_1.Controller)('comments'),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        auth_session_service_1.AuthSessionService])
], CommentsController);
//# sourceMappingURL=comments.controller.js.map
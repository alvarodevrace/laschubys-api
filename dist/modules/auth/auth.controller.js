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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_session_service_1 = require("./auth-session.service");
let AuthController = class AuthController {
    constructor(authSessions) {
        this.authSessions = authSessions;
    }
    async me(req, res) {
        const user = await this.authSessions.getCurrentUser(req, res);
        return { user };
    }
    async google(req, res, next, origin) {
        const authUrl = await this.authSessions.getGoogleAuthUrl(req, res, next, origin);
        return res.redirect(authUrl);
    }
    async callback(req, res, code, next, origin) {
        const redirectTarget = this.authSessions.resolveRedirectTarget(origin, next);
        if (!code) {
            return res.redirect(`${redirectTarget.startsWith('http') ? new URL('/auth/login', redirectTarget).toString() : '/auth/login'}?error=oauth`);
        }
        try {
            await this.authSessions.finishOAuth(req, res, code);
            return res.redirect(redirectTarget);
        }
        catch {
            const loginUrl = new URL('/auth/login', redirectTarget);
            loginUrl.searchParams.set('redirect', next && next.startsWith('/') ? next : '/blog');
            loginUrl.searchParams.set('error', 'oauth');
            return res.redirect(loginUrl.toString());
        }
    }
    logout(res) {
        this.authSessions.clearSession(res);
        return { ok: true };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "me", null);
__decorate([
    (0, common_1.Get)('google'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)('next')),
    __param(3, (0, common_1.Query)('origin')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "google", null);
__decorate([
    (0, common_1.Get)('callback'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)('code')),
    __param(3, (0, common_1.Query)('next')),
    __param(4, (0, common_1.Query)('origin')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "callback", null);
__decorate([
    (0, common_1.Get)('logout'),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_session_service_1.AuthSessionService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthSessionService = void 0;
const common_1 = require("@nestjs/common");
const supabase_js_1 = require("@supabase/supabase-js");
const env_1 = require("../../shared/config/env");
const supabase_service_1 = require("../supabase/supabase.service");
let AuthSessionService = class AuthSessionService {
    constructor(supabase) {
        this.supabase = supabase;
        this.accessCookieName = 'lc_access_token';
        this.refreshCookieName = 'lc_refresh_token';
    }
    async getCurrentUser(req, res) {
        const session = await this.resolveSession(req, res);
        return session?.user ? this.toAuthUserView(session.user) : null;
    }
    async requireUser(req, res) {
        const session = await this.resolveSession(req, res);
        if (!session?.user) {
            throw new common_1.UnauthorizedException('Se requiere autenticación');
        }
        return session.user;
    }
    async getGoogleAuthUrl(req, res, next, origin) {
        const frontendOrigin = this.normalizeOrigin(origin);
        const callbackUrl = new URL('/api/auth/callback', frontendOrigin);
        callbackUrl.searchParams.set('next', this.normalizeNextPath(next));
        callbackUrl.searchParams.set('origin', frontendOrigin);
        const client = this.createBrowserAuthClient(req, res);
        const { data, error } = await client.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: callbackUrl.toString(),
                queryParams: { access_type: 'offline', prompt: 'consent' },
                skipBrowserRedirect: true,
            },
        });
        if (error || !data.url) {
            throw new common_1.UnauthorizedException(error?.message || 'No se pudo iniciar el acceso con Google');
        }
        return data.url;
    }
    async finishOAuth(req, res, code) {
        const client = this.createBrowserAuthClient(req, res);
        const { data, error } = await client.auth.exchangeCodeForSession(code);
        if (error || !data.session || !data.user) {
            this.clearSessionCookies(res);
            throw new common_1.UnauthorizedException(error?.message || 'No se pudo completar el acceso');
        }
        this.writeSessionCookies(res, data.session);
        return this.toAuthUserView(data.user);
    }
    clearSession(res) {
        this.clearSessionCookies(res);
    }
    resolveRedirectTarget(origin, next) {
        return `${this.normalizeOrigin(origin)}${this.normalizeNextPath(next)}`;
    }
    async resolveSession(req, res) {
        const cookies = this.parseCookies(req.headers.cookie);
        const accessToken = cookies[this.accessCookieName];
        const refreshToken = cookies[this.refreshCookieName];
        if (!accessToken && !refreshToken) {
            return null;
        }
        const client = this.createBrowserAuthClient(req, res);
        const response = accessToken && refreshToken
            ? await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
            : refreshToken
                ? await client.auth.refreshSession({ refresh_token: refreshToken })
                : { data: { session: null, user: null }, error: new Error('Sesión incompleta') };
        if (response.error || !response.data.session || !response.data.user) {
            if (res) {
                this.clearSessionCookies(res);
            }
            return null;
        }
        if (res) {
            this.writeSessionCookies(res, response.data.session);
        }
        return response.data.session;
    }
    async toAuthUserView(user) {
        const { data: profile } = await this.supabase.admin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        return {
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.['full_name'] ||
                user.user_metadata?.['name'] ||
                user.email ||
                'Cat Mom',
            avatar: user.user_metadata?.['avatar_url'] || null,
            role: profile?.role ?? 'user',
        };
    }
    createBrowserAuthClient(req, res) {
        const cookieOptions = {
            httpOnly: true,
            sameSite: 'lax',
            secure: env_1.env.isProduction,
            path: '/',
        };
        return (0, supabase_js_1.createClient)(env_1.env.supabaseUrl, env_1.env.supabaseAnonKey, {
            auth: {
                autoRefreshToken: false,
                detectSessionInUrl: false,
                flowType: 'pkce',
                persistSession: true,
                storage: {
                    getItem: async (key) => this.parseCookies(req.headers.cookie)[key] ?? null,
                    setItem: async (key, value) => {
                        if (res) {
                            res.cookie(key, value, cookieOptions);
                        }
                    },
                    removeItem: async (key) => {
                        if (res) {
                            res.clearCookie(key, cookieOptions);
                        }
                    },
                },
            },
            global: {
                headers: { 'X-Client-Info': 'laschubys-api/auth-session' },
            },
        });
    }
    writeSessionCookies(res, session) {
        res.cookie(this.accessCookieName, session.access_token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: env_1.env.isProduction,
            path: '/',
            maxAge: Math.max(session.expires_in, 60) * 1000,
        });
        res.cookie(this.refreshCookieName, session.refresh_token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: env_1.env.isProduction,
            path: '/',
            maxAge: 1000 * 60 * 60 * 24 * 30,
        });
    }
    clearSessionCookies(res) {
        const cookieOptions = {
            httpOnly: true,
            sameSite: 'lax',
            secure: env_1.env.isProduction,
            path: '/',
        };
        res.clearCookie(this.accessCookieName, cookieOptions);
        res.clearCookie(this.refreshCookieName, cookieOptions);
    }
    normalizeOrigin(value) {
        const normalized = value?.trim().replace(/\/+$/, '');
        if (normalized && env_1.env.allowedOrigins.includes(normalized)) {
            return normalized;
        }
        return env_1.env.allowedOrigins[0];
    }
    normalizeNextPath(value) {
        if (!value || !value.startsWith('/') || value.startsWith('//')) {
            return '/blog';
        }
        return value;
    }
    parseCookies(raw = '') {
        return raw
            .split(';')
            .map((chunk) => chunk.trim())
            .filter(Boolean)
            .reduce((acc, entry) => {
            const separator = entry.indexOf('=');
            if (separator === -1) {
                return acc;
            }
            const key = entry.slice(0, separator);
            const value = entry.slice(separator + 1);
            acc[key] = decodeURIComponent(value);
            return acc;
        }, {});
    }
};
exports.AuthSessionService = AuthSessionService;
exports.AuthSessionService = AuthSessionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], AuthSessionService);
//# sourceMappingURL=auth-session.service.js.map
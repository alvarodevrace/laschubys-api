import { User } from '@supabase/supabase-js';
import { Request, Response } from 'express';
import { SupabaseService } from '../supabase/supabase.service';
type AuthUserView = {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
    role: 'admin' | 'user';
};
export declare class AuthSessionService {
    private readonly supabase;
    private readonly accessCookieName;
    private readonly refreshCookieName;
    constructor(supabase: SupabaseService);
    getCurrentUser(req: Request, res?: Response): Promise<AuthUserView | null>;
    requireUser(req: Request, res?: Response): Promise<User>;
    getGoogleAuthUrl(req: Request, res: Response, next: string | undefined, origin: string | undefined): Promise<string>;
    finishOAuth(req: Request, res: Response, code: string): Promise<AuthUserView>;
    clearSession(res: Response): void;
    resolveRedirectTarget(origin: string | undefined, next: string | undefined): string;
    private resolveSession;
    private toAuthUserView;
    private createBrowserAuthClient;
    private writeSessionCookies;
    private clearSessionCookies;
    private normalizeOrigin;
    private normalizeNextPath;
    private parseCookies;
}
export {};

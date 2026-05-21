import { Request, Response } from 'express';
import { AuthSessionService } from './auth-session.service';
export declare class AuthController {
    private readonly authSessions;
    constructor(authSessions: AuthSessionService);
    me(req: Request, res: Response): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            avatar: string | null;
            role: "admin" | "user";
        } | null;
    }>;
    google(req: Request, res: Response, next?: string, origin?: string): Promise<void>;
    callback(req: Request, res: Response, code?: string, next?: string, origin?: string): Promise<void>;
    logout(res: Response): {
        ok: boolean;
    };
}

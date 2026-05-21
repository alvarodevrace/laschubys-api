import { Request, Response } from 'express';
import { AuthSessionService } from '../auth/auth-session.service';
import { SupabaseService } from '../supabase/supabase.service';
declare class AddCommentDto {
    slug: string;
    body: string;
}
export declare class CommentsController {
    private readonly supabase;
    private readonly authSessions;
    constructor(supabase: SupabaseService, authSessions: AuthSessionService);
    add(dto: AddCommentDto, req: Request, res: Response): Promise<{
        ok: boolean;
        comment: {
            id: any;
            author: any;
            body: any;
            date: string;
        };
    }>;
    private formatCommentDate;
}
export {};

import { SupabaseService } from '../supabase/supabase.service';
export declare class HealthController {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    check(): Promise<{
        status: string;
        detail: string;
    } | {
        status: string;
        detail?: undefined;
    }>;
}

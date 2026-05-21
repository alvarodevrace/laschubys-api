import { SupabaseService } from '../supabase/supabase.service';
export declare class ContentController {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    getPosts(limit?: string): Promise<{
        slug: string;
        category: string;
        title: string;
        excerpt: string;
        author: string;
        readTime: string;
        publishedAt: string;
        content: string[];
        comments: never[];
        coverImage: string | null;
    }[]>;
    getPost(slug: string): Promise<{
        comments: {
            id: string;
            author: string;
            body: string;
            date: string;
        }[];
        slug: string;
        category: string;
        title: string;
        excerpt: string;
        author: string;
        readTime: string;
        publishedAt: string;
        content: string[];
        coverImage: string | null;
    } | null>;
    getProducts(): Promise<{
        id: string;
        tag: string;
        source: "owned" | "affiliate";
        audience: string;
        name: string;
        price: string;
        priceValue: number;
        copy: string;
        description: string;
        images: string[];
        affiliateUrl: string | undefined;
        shippingNote: string;
    }[]>;
    private toBlogPostView;
    private toCommentView;
    private toProductView;
    private classifyProductAudience;
    private estimateReadTime;
    private formatPostDate;
    private formatCommentDate;
}

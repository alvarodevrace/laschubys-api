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
exports.ContentController = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let ContentController = class ContentController {
    constructor(supabase) {
        this.supabase = supabase;
    }
    async getPosts(limit) {
        const query = this.supabase.anon
            .from('blog_posts')
            .select('id, slug, title, excerpt, content, category, read_time, cover_image, author, published_at, created_at')
            .order('published_at', { ascending: false });
        const parsedLimit = Number(limit);
        const { data } = Number.isFinite(parsedLimit) && parsedLimit > 0 ? await query.limit(parsedLimit) : await query;
        return (data || []).map((row) => this.toBlogPostView(row));
    }
    async getPost(slug) {
        const [{ data: posts }, { data: comments }] = await Promise.all([
            this.supabase.anon
                .from('blog_posts')
                .select('id, slug, title, excerpt, content, category, read_time, cover_image, author, published_at, created_at')
                .eq('slug', slug)
                .limit(1),
            this.supabase.anon
                .from('comments')
                .select('id, author_name, body, created_at')
                .eq('post_slug', slug)
                .eq('reported', false)
                .order('created_at', { ascending: false }),
        ]);
        const post = (posts || [])[0];
        if (!post) {
            return null;
        }
        return {
            ...this.toBlogPostView(post),
            comments: (comments || []).map((comment) => this.toCommentView(comment)),
        };
    }
    async getProducts() {
        const { data } = await this.supabase.anon
            .from('products')
            .select('id, name, price, source, tag, copy, description, images, affiliate_url, shipping_note, active, created_at')
            .eq('active', true)
            .order('created_at', { ascending: false });
        return (data || []).map((row) => this.toProductView(row));
    }
    toBlogPostView(row) {
        return {
            slug: row.slug,
            category: row.category || 'Blog',
            title: row.title,
            excerpt: row.excerpt || '',
            author: row.author || 'Mamá de Las Chubys',
            readTime: row.read_time || this.estimateReadTime(row.content || []),
            publishedAt: this.formatPostDate(row.published_at || row.created_at),
            content: Array.isArray(row.content) ? row.content : [],
            comments: [],
            coverImage: row.cover_image,
        };
    }
    toCommentView(row) {
        return {
            id: row.id,
            author: row.author_name,
            body: row.body,
            date: this.formatCommentDate(row.created_at),
        };
    }
    toProductView(row) {
        const priceValue = Number(row.price || 0);
        return {
            id: row.id,
            tag: row.tag || (row.source === 'owned' ? 'Las Chubys' : 'Amazon'),
            source: row.source,
            audience: this.classifyProductAudience(row),
            name: row.name,
            price: `$${priceValue.toFixed(0)}`,
            priceValue,
            copy: row.copy || '',
            description: row.description || '',
            images: Array.isArray(row.images) ? row.images : [],
            affiliateUrl: row.affiliate_url || undefined,
            shippingNote: row.shipping_note || '',
        };
    }
    classifyProductAudience(row) {
        const haystack = `${row.name} ${row.copy || ''} ${row.description || ''} ${row.tag || ''}`.toLowerCase();
        const keywords = ['taza', 'mug', 'manta', 'decor', 'humano', 'camiseta', 'hoodie', 'poster', 'cafe'];
        return keywords.some((keyword) => haystack.includes(keyword)) ? 'michi-lovers' : 'michis';
    }
    estimateReadTime(paragraphs) {
        const words = paragraphs.join(' ').trim().split(/\s+/).filter(Boolean).length;
        return `${Math.max(1, Math.ceil(words / 180))} min`;
    }
    formatPostDate(value) {
        if (!value) {
            return 'Sin fecha';
        }
        return new Intl.DateTimeFormat('es-EC', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC',
        }).format(new Date(value));
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
exports.ContentController = ContentController;
__decorate([
    (0, common_1.Get)('posts'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getPosts", null);
__decorate([
    (0, common_1.Get)('posts/:slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getPost", null);
__decorate([
    (0, common_1.Get)('products'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getProducts", null);
exports.ContentController = ContentController = __decorate([
    (0, common_1.Controller)('content'),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], ContentController);
//# sourceMappingURL=content.controller.js.map
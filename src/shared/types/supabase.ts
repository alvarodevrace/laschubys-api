export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  laschubys: {
    Tables: {
      categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          sort_order: number | null;
          active: boolean | null;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          sort_order?: number | null;
          active?: boolean | null;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          sort_order?: number | null;
          active?: boolean | null;
        };
        Relationships: [];
      };
      blog_posts: {
        Row: {
          id: string;
          slug: string;
          title: string;
          excerpt: string | null;
          content: string[] | null;
          category: string | null;
          read_time: string | null;
          cover_image: string | null;
          author: string;
          published_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          excerpt?: string | null;
          content?: string[] | null;
          category?: string | null;
          read_time?: string | null;
          cover_image?: string | null;
          author: string;
          published_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          excerpt?: string | null;
          content?: string[] | null;
          category?: string | null;
          read_time?: string | null;
          cover_image?: string | null;
          author?: string;
          published_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          price: number;
          source: 'owned' | 'affiliate';
          tag: string | null;
          copy: string | null;
          description: string | null;
          details: string | null;
          specifications: string | null;
          images: string[] | null;
          affiliate_url: string | null;
          shipping_note: string | null;
          active: boolean;
          created_at: string;
          category_id: string | null;
          product_type: 'physical' | 'link' | null;
          slug: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          price: number;
          source: 'owned' | 'affiliate';
          tag?: string | null;
          copy?: string | null;
          description?: string | null;
          details?: string | null;
          specifications?: string | null;
          images?: string[] | null;
          affiliate_url?: string | null;
          shipping_note?: string | null;
          active?: boolean;
          created_at?: string;
          category_id?: string | null;
          product_type?: 'physical' | 'link' | null;
          slug?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          price?: number;
          source?: 'owned' | 'affiliate';
          tag?: string | null;
          copy?: string | null;
          description?: string | null;
          details?: string | null;
          specifications?: string | null;
          images?: string[] | null;
          affiliate_url?: string | null;
          shipping_note?: string | null;
          active?: boolean;
          created_at?: string;
          category_id?: string | null;
          product_type?: 'physical' | 'link' | null;
          slug?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      comments: {
        Row: {
          id: string;
          post_slug: string;
          user_id: string;
          author_name: string;
          body: string;
          created_at: string;
          reported: boolean;
        };
        Insert: {
          id?: string;
          post_slug: string;
          user_id: string;
          author_name: string;
          body: string;
          created_at?: string;
          reported?: boolean;
        };
        Update: {
          id?: string;
          post_slug?: string;
          user_id?: string;
          author_name?: string;
          body?: string;
          created_at?: string;
          reported?: boolean;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          role: string;
        };
        Insert: {
          id: string;
          role?: string;
        };
        Update: {
          id?: string;
          role?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          name: string;
          phone: string;
          email: string;
          province: string;
          address: string;
          notes: string | null;
          items: Json;
          total: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          email: string;
          province: string;
          address: string;
          notes?: string | null;
          items: Json;
          total?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          email?: string;
          province?: string;
          address?: string;
          notes?: string | null;
          items?: Json;
          total?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          id: string;
          name: string;
          email: string;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          message: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          message?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

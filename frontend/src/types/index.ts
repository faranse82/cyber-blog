// Add these interfaces to your existing types file

export interface CreatePostRequest {
    title: string;
    content: string;
    excerpt?: string;
    published?: boolean;
}

export interface Post {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    published: boolean;
    author_id: string;
    created_at: string;
    updated_at: string;
}

// If you need user authentication types
export interface User {
    id: string;
    username: string;
    email: string;
    is_admin?: boolean;
}

export interface AuthClaims {
    sub: string; // user id
    username: string;
    is_admin: boolean;
    exp: number;
}
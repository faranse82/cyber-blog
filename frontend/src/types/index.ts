export interface User {
    id: string;
    username: string;
    email: string;
    profile_pic_url?: string;
    is_admin: boolean;
}

export interface AuthorInfo {
    id: string;
    username: string;
    profile_pic_url?: string;
}

export interface Post {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    published: boolean;
    author: AuthorInfo;
    created_at: string;
    updated_at: string;
}

export interface Comment {
    id: string;
    content: string;
    author: AuthorInfo;
    created_at: string;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface RegisterData {
    username: string;
    email: string;
    password: string;
    profile_pic_url: string;
}
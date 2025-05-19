CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    excerpt TEXT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPZ NOT NULL DEFAULT NOW(),
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    profile_pic_url VARCHAR(255),
    bio VARCHAR(255)
    created_at TIMESTAMPZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPZ NOT NULL DEFAULT NOW(),

);

CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPZ NOT NULL DEFAULT NOW(),
);

-- trigger for updated_at columns
CREATE OR REPLACE FUNCTIONO update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_post_modtime ON posts;
CREATE TRIGGER update_post_modtime
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
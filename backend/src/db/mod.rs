use sqlx::postgres::{PgPool, PgPoolOptions};
use std::env;
use std::time::Duration;

pub async fn create_pool() -> Result<PgPool, sqlx::Error> {
    let database_url = env::var("DATABASE_URL").expect("Database url must be set");

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(Duration::from_secs(3))
        .connect(&database_url)
        .await?;

    initialize_database(&pool).await?;
    Ok(pool)
}

async fn initialize_database(pool: &PgPool) -> Result<(), sqlx::Error> {
    println!("Applying database schema...");

    let statements = vec![
        "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"",
        r#"CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email VARCHAR(255) NOT NULL UNIQUE,
            username VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            is_admin BOOLEAN NOT NULL DEFAULT FALSE,
            profile_pic_url VARCHAR(255),
            bio VARCHAR(255),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )"#,
        r#"CREATE TABLE IF NOT EXISTS posts (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            author_id UUID NOT NULL REFERENCES users(id),
            content TEXT NOT NULL,
            excerpt TEXT,
            published BOOLEAN NOT NULL DEFAULT FALSE,
            title VARCHAR(255) NOT NULL,
            slug VARCHAR(255) NOT NULL UNIQUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )"#,
        r#"CREATE TABLE IF NOT EXISTS comments (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
            author_id UUID NOT NULL REFERENCES users(id),
            content TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )"#,
        r#"CREATE TABLE IF NOT EXISTS files (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            filename VARCHAR(255) NOT NULL UNIQUE,
            original_name VARCHAR(255) NOT NULL,
            mime_type VARCHAR(100) NOT NULL,
            size BIGINT NOT NULL,
            url VARCHAR(500) NOT NULL,
            uploader_id UUID NOT NULL REFERENCES users(id),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )"#,
    ];

    for statement in statements {
        match sqlx::query(statement).execute(pool).await {
            Ok(_) => {
                println!(
                    "✓ Executed: {}",
                    statement
                        .split_whitespace()
                        .take(3)
                        .collect::<Vec<_>>()
                        .join(" ")
                );
            }
            Err(e) => {
                eprintln!("✗ Failed to execute statement: {}", e);
                eprintln!("Statement: {}", statement);
            }
        }
    }

    println!("Schema applied successfully!");
    Ok(())
}

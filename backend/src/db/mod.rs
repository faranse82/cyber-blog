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
    let schema = include_str!("../schema.sql");

    sqlx::query(schema).execute(pool).await?;

    Ok(())
}

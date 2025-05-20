use actix_web::{web, Error, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth::{create_token, hash_password, verify_passowrd};
use crate::models::user::{CreateUserRequest, LoginRequest, User};

pub async fn register(
    pool: web::Data<PgPool>,
    user_req: web::Json<CreateUserRequest>,
) -> Result<HttpResponse, Error> {
    let existing_user = sqlx::query!(
        r#"SELECT id FROM users WHERE username = $1 or email = $2"#,
        user_req.username,
        user_req.email
    )
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln("Database error: {}", e);
        actix_web::error::ErrorInternalServerError("Database Error")
    })?;

    if existing_user.is_some() {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "error": "This username or email is already registered"
        })));
    }

    let hash_password = hash_password(&user_req.password).map_err(|e| {
        eprintln("Password hashing error: {}", e);
        actix_web::error::ErrorInternalServerError("Password Hashing Error")
    })?;

    let user = sqlx::query_as!(
        User,
        r#"INSERT INTO users (username, email, password_hash, is_admin)
        VALUES ($1, $2, $3, $4)
        RETURNING id, username, email, password_hash, is_admin, created_at, updated_at"#,
        user_req.username,
        user_req.email,
        password_hash,
        false
    )
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("Database error: {}", e);
        actix_web::error::ErrorInternalServerError("Failed to create user")
    })?;

    let token = create_token(user.id, user.is_admin)?;

    Ok(HttpResponse::Created().json(serde_json::json!({
        "message": "user created successfully",
        "token": token,
        "user": user.to_response()
    })))
}

pub async fn login(
    pool: web::Data<PgPool>,
    login_req: web::Json<LoginRequest>,
) -> Result<HttpResponse, Error> {
    let user = sqlx::query_as!(
        User,
        r#"SELECT id, username, password_hash, is_admin, created_at, updated_at
        FROM users WHERE username = $1"#,
        login_req.username
    )
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|_| {
        eprintln!("Database error: {}", e);
        actix_web::error::ErrorInternalServerError("Database error")
    })?;

    let user = match user {
        Some(user) => user,
        None => {
            return Ok(HttpResponse::Unauthorized().json(serde_json::json!({
                "error": "Invalid credentials"
            })));
        }
    };

    let valid_password =
        verify_passowrd(&user.password_hash, &login_req.password).map_err(|e| {
            eprintln!("Password verification failed: {}", e);
            actix_web::error::ErrorInternalServerError("Password verification failed")
        })?;

    if !valid_password {
        return Ok(HttpResponse::Unauthorized().json(serde_json::json!({
            "error": "Invalid credentials"
        })));
    }

    let token = create_token(user.id, user.is_admin)?;
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "token": token,
        "user": user.to_response()
    })))
}

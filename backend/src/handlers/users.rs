use actix_web::{web, Error, HttpRequest, HttpResponse};
use log::{error, info, warn};
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth::{self, create_token, verify_password};
use crate::models::user::{CreateUserRequest, LoginRequest, UpdateUserRequest, User, UserResponse};

pub async fn register(
    pool: web::Data<PgPool>,
    user_req: web::Json<CreateUserRequest>,
) -> Result<HttpResponse, Error> {
    let existing_user = sqlx::query!(
        r#"
        SELECT id FROM users
        WHERE username = $1 OR email = $2
        "#,
        user_req.username,
        user_req.email
    )
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| {
        error!("Database error while checking existing user: {}", e);
        actix_web::error::ErrorInternalServerError("Database error")
    })?;

    if existing_user.is_some() {
        warn!(
            "Attempt to register with existing username/email: {}",
            user_req.username
        );
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Username or email already exists"
        })));
    }

    let password_hash = auth::hash_password(&user_req.password).map_err(|e| {
        error!("Password hashing error: {}", e);
        actix_web::error::ErrorInternalServerError("Password hashing error")
    })?;

    let user = sqlx::query_as!(
        User,
        r#"
        INSERT INTO users (username, email, password_hash, profile_pic_url, is_admin)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, username, email, password_hash, profile_pic_url, is_admin, created_at, updated_at
        "#,
        user_req.username,
        user_req.email,
        password_hash,
        user_req.profile_pic_url,
        false
    )
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| {
        error!("Database error while creating user: {}", e);
        actix_web::error::ErrorInternalServerError("Failed to create user")
    })?;

    let token = auth::create_token(user.id, user.is_admin)?;

    info!("New user registered: {}", user.username);

    Ok(HttpResponse::Created().json(serde_json::json!({
        "message": "User created successfully",
        "token": token,
        "user": user.to_response()
    })))
}

pub async fn user_info(pool: web::Data<PgPool>, req: HttpRequest) -> Result<HttpResponse, Error> {
    let claims = auth::validate_token(&req)?;
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| actix_web::error::ErrorUnauthorized("Invalid user token"))?;

    let user = sqlx::query_as!(
        UserResponse,
        r#"
        SELECT id, username, email, profile_pic_url, is_admin
        FROM users
        WHERE id = $1
        "#,
        user_id
    )
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| {
        error!("Database error while fetching user info: {}", e);
        actix_web::error::ErrorInternalServerError("Database error")
    })?;

    let user = match user {
        Some(user) => user,
        None => {
            warn!("User not found for ID: {}", user_id);
            return Err(actix_web::error::ErrorNotFound("User not found"));
        }
    };

    info!("User info retrieved for user ID: {}", user.id);

    Ok(HttpResponse::Ok().json(serde_json::json!(user)))
}

pub async fn login(
    pool: web::Data<PgPool>,
    login_req: web::Json<LoginRequest>,
    req: HttpRequest,
) -> Result<HttpResponse, Error> {
    let client_ip = req
        .peer_addr()
        .map(|addr| addr.ip().to_string())
        .unwrap_or_else(|| "unknown".to_string());

    let user = sqlx::query_as!(
        User,
        r#"
        SELECT id, username, email, password_hash, profile_pic_url, is_admin, created_at, updated_at
        FROM users
        WHERE username = $1
        "#,
        login_req.username
    )
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| {
        error!("Database error during login: {}", e);
        actix_web::error::ErrorInternalServerError("Database error")
    })?;

    let user = match user {
        Some(user) => user,
        None => {
            warn!(
                "Failed login: user not found; username={}, ip={}",
                login_req.username, client_ip
            );
            return Ok(HttpResponse::Unauthorized().json(serde_json::json!({
                "error": "Invalid credentials"
            })));
        }
    };

    let valid_password =
        verify_password(&user.password_hash, &login_req.password).map_err(|e| {
            error!("Password verification error: {}", e);
            actix_web::error::ErrorInternalServerError("Password verification failed")
        })?;

    if !valid_password {
        warn!(
            "Failed login: invalid password; username={}, ip={}",
            user.username, client_ip
        );
        return Ok(HttpResponse::Unauthorized().json(serde_json::json!({
            "error": "Invalid credentials"
        })));
    }

    info!(
        "Successful login: username={}, ip={}",
        user.username, client_ip
    );

    let token = create_token(user.id, user.is_admin)?;
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "token": token,
        "user": user.to_response()
    })))
}

pub async fn update_profile(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    profile_data: web::Json<UpdateUserRequest>,
) -> Result<HttpResponse, Error> {
    let claims = auth::validate_token(&req)?;
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| actix_web::error::ErrorInternalServerError("Invalid user ID in token"))?;

    if profile_data.username.is_some() || profile_data.email.is_some() {
        let existing = sqlx::query!(
            r#"
            SELECT id FROM users
            WHERE (username = $1 OR email = $2) AND id != $3
            "#,
            profile_data.username,
            profile_data.email,
            user_id
        )
        .fetch_optional(pool.get_ref())
        .await
        .map_err(|e| {
            error!(
                "Database error while checking for username/email conflicts: {}",
                e
            );
            actix_web::error::ErrorInternalServerError("Database error")
        })?;

        if existing.is_some() {
            warn!(
                "Profile update conflict: username/email already exists for user ID {}",
                user_id
            );
            return Ok(HttpResponse::BadRequest().json(serde_json::json!({
                "error": "Username or email already exists"
            })));
        }
    }

    let password_hash = if let Some(password) = &profile_data.password {
        Some(auth::hash_password(password).map_err(|e| {
            error!("Password hashing error during profile update: {}", e);
            actix_web::error::ErrorInternalServerError("Password hashing error")
        })?)
    } else {
        None
    };

    let updated_user = sqlx::query_as!(
        User,
        r#"
        UPDATE users
        SET
            username = COALESCE($1, username),
            email = COALESCE($2, email),
            password_hash = COALESCE($3, password_hash),
            profile_pic_url = $4,
            updated_at = NOW()
        WHERE id = $5
        RETURNING id, username, email, password_hash, profile_pic_url, is_admin, created_at, updated_at
        "#,
        profile_data.username,
        profile_data.email,
        password_hash,
        profile_data.profile_pic_url,
        user_id
    )
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| {
        error!("Database error while updating profile for user {}: {}", user_id, e);
        actix_web::error::ErrorInternalServerError("Failed to update profile")
    })?;

    info!("Profile updated successfully for user ID {}", user_id);

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Profile updated successfully",
        "user": updated_user.to_response()
    })))
}

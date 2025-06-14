use actix_web::{web, HttpRequest, HttpResponse};
use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth;

#[derive(serde::Serialize, serde::Deserialize)]
pub struct CreateCommentRequest {
    pub content: String,
    pub post_id: Uuid,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct CommentResponse {
    pub id: Uuid,
    pub content: String,
    pub post_id: Uuid,
    pub user_id: Uuid,
    pub username: String,
    pub profile_pic_url: Option<String>,
    pub created_at: DateTime<Utc>,
}

pub async fn create_comment(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    comment_data: web::Json<CreateCommentRequest>,
) -> Result<HttpResponse, actix_web::Error> {
    let claims = auth::validate_token(&req)?;

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| actix_web::error::ErrorInternalServerError("Invalid user ID in token"))?;

    let comment = sqlx::query!(
        r#"
        INSERT INTO comments (content, post_id, author_id)
        VALUES ($1, $2, $3)
        RETURNING id, content, post_id, author_id, created_at
        "#,
        comment_data.content,
        comment_data.post_id,
        user_id
    )
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("Database error: {}", e);
        actix_web::error::ErrorInternalServerError("Failed to create comment")
    })?;

    // Get user info for the response
    let user_info = sqlx::query!(
        r#"
        SELECT username, profile_pic_url FROM users WHERE id = $1
        "#,
        user_id
    )
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("Database error fetching user: {}", e);
        actix_web::error::ErrorInternalServerError("Failed to fetch user info")
    })?;

    let response = CommentResponse {
        id: comment.id,
        content: comment.content,
        post_id: comment.post_id,
        user_id: comment.author_id,
        username: user_info.username,
        profile_pic_url: user_info.profile_pic_url,
        created_at: comment.created_at,
    };

    Ok(HttpResponse::Created().json(response))
}

pub async fn get_comments_for_post(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, actix_web::Error> {
    let post_id = path.into_inner();

    let comments = sqlx::query!(
        r#"
        SELECT
            c.id, c.content, c.post_id, c.author_id, c.created_at,
            u.username, u.profile_pic_url
        FROM comments c
        JOIN users u ON c.author_id = u.id
        WHERE c.post_id = $1
        ORDER BY c.created_at DESC
        "#,
        post_id
    )
    .fetch_all(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("Database error: {}", e);
        actix_web::error::ErrorInternalServerError("Failed to fetch comments")
    })?;

    let comment_responses: Vec<CommentResponse> = comments
        .into_iter()
        .map(|row| CommentResponse {
            id: row.id,
            content: row.content,
            post_id: row.post_id,
            user_id: row.author_id,
            username: row.username,
            profile_pic_url: row.profile_pic_url,
            created_at: row.created_at,
        })
        .collect();

    Ok(HttpResponse::Ok().json(comment_responses))
}

pub async fn update_comment(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
    comment_data: web::Json<CreateCommentRequest>,
) -> Result<HttpResponse, actix_web::Error> {
    let comment_id = path.into_inner();
    let claims = auth::validate_token(&req)?;

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| actix_web::error::ErrorInternalServerError("Invalid user ID in token"))?;

    let existing_comment = sqlx::query!(
        r#"
        SELECT author_id FROM comments WHERE id = $1
        "#,
        comment_id
    )
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("Database error: {}", e);
        actix_web::error::ErrorInternalServerError("Failed to check comment")
    })?;

    let existing_comment = match existing_comment {
        Some(comment) => comment,
        None => return Ok(HttpResponse::NotFound().json("Comment not found")),
    };

    if existing_comment.author_id != user_id && !claims.is_admin {
        return Ok(HttpResponse::Forbidden().json("Not authorized to update this comment"));
    }

    let updated_comment = sqlx::query!(
        r#"
        UPDATE comments
        SET content = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, content, post_id, author_id, created_at
        "#,
        comment_data.content,
        comment_id
    )
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("Database error: {}", e);
        actix_web::error::ErrorInternalServerError("Failed to update comment")
    })?;

    // Get user info for the response
    let user_info = sqlx::query!(
        r#"
        SELECT username, profile_pic_url FROM users WHERE id = $1
        "#,
        updated_comment.author_id
    )
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("Database error fetching user: {}", e);
        actix_web::error::ErrorInternalServerError("Failed to fetch user info")
    })?;

    let response = CommentResponse {
        id: updated_comment.id,
        content: updated_comment.content,
        post_id: updated_comment.post_id,
        user_id: updated_comment.author_id,
        username: user_info.username,
        profile_pic_url: user_info.profile_pic_url,
        created_at: updated_comment.created_at,
    };

    Ok(HttpResponse::Ok().json(response))
}

pub async fn delete_comment(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, actix_web::Error> {
    let comment_id = path.into_inner();
    let claims = auth::validate_token(&req)?;

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| actix_web::error::ErrorInternalServerError("Invalid user ID in token"))?;

    let existing_comment = sqlx::query!(
        r#"
        SELECT author_id FROM comments WHERE id = $1
        "#,
        comment_id
    )
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("Database error: {}", e);
        actix_web::error::ErrorInternalServerError("Failed to check comment")
    })?;

    let existing_comment = match existing_comment {
        Some(comment) => comment,
        None => return Ok(HttpResponse::NotFound().json("Comment not found")),
    };

    if existing_comment.author_id != user_id && !claims.is_admin {
        return Ok(HttpResponse::Forbidden().json("Not authorized to delete this comment"));
    }

    sqlx::query!(
        r#"
        DELETE FROM comments WHERE id = $1
        "#,
        comment_id
    )
    .execute(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("Database error: {}", e);
        actix_web::error::ErrorInternalServerError("Failed to delete comment")
    })?;

    Ok(HttpResponse::Ok().json("Comment deleted successfully"))
}

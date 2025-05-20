use actix_web::{web, Error, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth::{create_token, hash_password, verify_passowrd};
use crate::models::comment::{Comment, CommentResponse};
use crate::models::post::{CreatePostRequest, Post};

pub async fn create_post(
    pool: web::Data<PgPool>,
    post_data: web::Json<CreatePostRequest>,
    req: HttpRequest,
) -> Result<HttpResponse, Error> {
    let claims = auth::validate_token(&req)?;

    if !claims.is_admin {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "error": "Not authorised to create posts"
        })));
    }

    let author_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| actix_web::error::ErrorInternalServerError("Invalid user ID in token"));
}

pub async fn update_post(
    pool: web::Data<PgPool>,
    user_req: web::Json,
) -> Result<HttpResponse, Error> {
}

pub async fn delete_post(
    pool: web::Data<PgPool>,
    user_req: web::Json,
) -> Result<HttpResponse, Error> {
}

pub async fn get_post_with_comments(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, Error> {
    let id = path.into_inner();
    let post_result = sqlx::query!(
        r#"
        SELECT
            p.id, p.title, p.content, p.excerpt,
            p.author_id, p.created_at, p.updated_at,
            u.username as author_name
        FROM posts p
        JOIN users u ON p.author_id = u.id
        WHERE p.id = $1 "#,
        id
    )
    .fetch_optional(pool.get_ref())
    .await?;

    let post = match post {
        Some(p) => p,
        None => {
            return Ok(HttpResponse::NotFound().json(serde_json::json!({
                "error": "Post not found"
            })))
        }
    };

    let comments = sqlx::query!(
        r#"
        SELECT c.id, c.content, c.created_at, c.user_id, u.username as author_name
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = $1
        ORDER BY c.created_at ASC
        "#,
        id
    )
    .fetch_all(pool.get_ref())
    .await?;

    let comment_responses: Vec<CommentResponse> = comments
        .into_iter()
        .map(|c| CommentResponse {
            id: c.id,
            content: c.content,
            user_id: c.user_id,
            author_name: c.author_name,
            created_at: c.created_at,
        })
        .collect();

    let post_with_comments = PostWithComments {
        id: post.id,
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        author_id: post.author_id,
        author_name: post.author_name,
        created_at: post.created_at,
        updated_at: post.updated_at,
        comments: comment_responses,
    };

    Ok(HttpResponse::Ok().json(post_with_comments))
}

pub async fn get_post_by_id(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, Error> {
    let id = path.into_inner();
    let post_result = sqlx::query!(
        r#"
        SELECT p.id, p.title, p.content, p.excerpt, p.author_id, p.created_at, p.updated_at, u.username as author_name
        FROM posts p
        JOIN users u ON p.author_id = u.id
        WHERE p.id = $1"#,
        id
    )
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("Database Error: {}", e);
        actix_web::error::ErrorInternalServerError("Database Error")
    })?;

    match post_result {
        Some(row) => {
            let post_response = PostResponse {
                id: row.id,
                title: row.title,
                content: row.content,
                excerpt: row.excerpt,
                author_id: row.author_id,
                author_name: row.author_name,
                created_at: row.created_at,
                updated_at: row.updated_at,
            };
            Ok(HttpResponse::Ok().json(post_response))
        }
        None => Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "Post not found"
        }))),
    }
}

pub async fn get_all_posts(pool: web::Data<PgPool>) -> Result<HttpResponse, Error> {
    let post_result = sqlx::query!(
        r#"
        SELECT p.id, p.title, p.content, p.excerpt, p.author_id, p.created_at, p.updated_at, u.username as author_name
        FROM posts p
        JOIN users u ON p.author_id = u.id
        ORDER BY p.created_at DESC
        "#,
    )
    .fetch_all(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("Database Error: {}", e);
        actix_web::error::ErrorInternalServerError("Database Error")
    })?;

    let post_responses: Vec<PostResponse> = posts
        .into_iter()
        .map(|row| PostResponse {
            id: row.id,
            title: row.title,
            content: row.content,
            excerpt: row.excerpt,
            author_id: row.author_id,
            author_name: row.author_name,
            created_at: row.created_at,
            updated_at: row.updated_at,
        })
        .collect();
    Ok(HttpResponse::Ok().json(post_responses))
}

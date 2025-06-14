use actix_web::{web, Error, HttpRequest, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;
use validator::Validate;

use crate::auth::{self};
use crate::models::post::{
    AuthorInfo, CreatePostRequest, PostResponse, PostWithComments, UpdatePostRequest,
};
use crate::models::post::{CommentResponse, Post};
use crate::sanitize;

pub async fn create_post(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    post_data: web::Json<CreatePostRequest>,
) -> Result<HttpResponse, actix_web::Error> {
    // validating input length
    post_data
        .validate()
        .map_err(|e| actix_web::error::ErrorBadRequest(format!("Validation error: {}", e)))?;

    let claims = auth::validate_token(&req)?;

    if !claims.is_admin {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "error": "Unauthorised access"
        })));
    }

    let author_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| actix_web::error::ErrorInternalServerError("Invalid user ID in token"))?;

    let slug = slug::slugify(&post_data.title);

    // Sanitize the content to prevent XSS
    let sanitized_content = sanitize::sanitize_editor_content(&post_data.content)
        .map_err(|e| actix_web::error::ErrorBadRequest(format!("Invalid content format: {}", e)))?;

    // Sanitize the excerpt if provided
    let sanitized_excerpt = post_data
        .excerpt
        .as_ref()
        .map(|e| sanitize::sanitize_html(e));

    let post = sqlx::query_as!(
        Post,
        r#"
        INSERT INTO posts (title, slug, content, excerpt, published, author_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, title, slug, content, excerpt, published, author_id, created_at, updated_at
        "#,
        post_data.title,
        slug,
        sanitized_content,
        sanitized_excerpt,
        post_data.published.unwrap_or(false),
        author_id
    )
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| {
        if e.to_string().contains("duplicate key") && e.to_string().contains("slug") {
            return actix_web::error::ErrorBadRequest("A post with this title already exists");
        }

        eprintln!("Database error: {}", e);
        actix_web::error::ErrorInternalServerError("Failed to create post")
    })?;

    Ok(HttpResponse::Created().json(post))
}

pub async fn delete_post(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, Error> {
    let claims = auth::validate_token(&req)?;

    if !claims.is_admin {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "error": "Not authorised to create posts"
        })));
    }

    let post_id = path.into_inner();

    let result = sqlx::query!(
        r#"
        DELETE FROM posts
        WHERE id = $1
        RETURNING id
        "#,
        post_id
    )
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("Database error: {}", e);
        actix_web::error::ErrorInternalServerError("Failed to delete post")
    })?;

    match result {
        Some(_) => Ok(HttpResponse::Ok().json(serde_json::json!({
            "message": "Post deleted successfully"
        }))),
        None => Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "Post not found"
        }))),
    }
}

pub async fn update_post(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
    post_data: web::Json<UpdatePostRequest>,
) -> Result<HttpResponse, Error> {
    let claims = auth::validate_token(&req)?;

    if !claims.is_admin {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "error": "Only administrators can update posts"
        })));
    }

    let post_id = path.into_inner();

    let existing_post = sqlx::query!(
        r#"
        SELECT id FROM posts WHERE id = $1
        "#,
        post_id
    )
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("Database error: {}", e);
        actix_web::error::ErrorInternalServerError("Failed to check if post exists")
    })?;

    if existing_post.is_none() {
        return Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "Post not found"
        })));
    }

    let new_slug = post_data.title.as_ref().map(|title| slug::slugify(title));

    let updated_post = sqlx::query_as!(
        Post,
        r#"
        UPDATE posts
        SET
            title = COALESCE($1, title),
            slug = COALESCE($2, slug),
            content = COALESCE($3, content),
            excerpt = COALESCE($4, excerpt),
            published = COALESCE($5, published),
            updated_at = NOW()
        WHERE id = $6
        RETURNING id, title, slug, content, excerpt, published, author_id, created_at, updated_at
        "#,
        post_data.title.as_ref(),
        new_slug.as_ref(),
        post_data.content.as_ref(),
        post_data.excerpt.as_ref(),
        post_data.published,
        post_id
    )
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| {
        if e.to_string().contains("duplicate key") && e.to_string().contains("slug") {
            return actix_web::error::ErrorBadRequest("A post with this title already exists");
        }

        eprintln!("Database error: {}", e);
        actix_web::error::ErrorInternalServerError("Failed to update post")
    })?;

    Ok(HttpResponse::Ok().json(updated_post))
}

pub async fn get_post_with_comments(
    pool: web::Data<PgPool>,
    path: web::Path<String>,
) -> Result<HttpResponse, Error> {
    let slug = path.into_inner();

    let post = sqlx::query!(
        r#"
        SELECT
            p.id, p.title, p.slug, p.content, p.excerpt,
            p.published, p.author_id, p.created_at, p.updated_at,
            u.username as author_name
        FROM posts p
        JOIN users u ON p.author_id = u.id
        WHERE p.slug = $1 AND p.published = true
        "#,
        slug
    )
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("Database Error: {}", e);
        actix_web::error::ErrorInternalServerError("Database Error")
    })?;

    let post = match post {
        Some(p) => p,
        None => {
            return Ok(HttpResponse::NotFound().json(serde_json::json!({
                "error": "Post not found"
            })));
        }
    };

    let comments = sqlx::query!(
        r#"
    SELECT
        c.id, c.content, c.created_at, c.author_id,
        u.username as author_name
    FROM comments c
    JOIN users u ON c.author_id = u.id
    WHERE c.post_id = $1
    ORDER BY c.created_at ASC
    "#,
        post.id
    )
    .fetch_all(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("Database Error: {}", e);
        actix_web::error::ErrorInternalServerError("Database Error")
    })?;

    let comment_responses: Vec<CommentResponse> = comments
        .into_iter()
        .map(|c| CommentResponse {
            id: c.id,
            content: c.content,
            author: AuthorInfo {
                id: c.author_id,
                username: c.author_name,
                profile_pic_url: None,
            },
            created_at: c.created_at,
        })
        .collect();

    let post_with_comments = PostWithComments {
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        published: post.published,
        author_id: post.author_id,
        author_name: post.author_name,
        created_at: post.created_at,
        updated_at: post.updated_at,
        comments: comment_responses,
    };

    Ok(HttpResponse::Ok().json(post_with_comments))
}

pub async fn get_post_by_slug(
    pool: web::Data<PgPool>,
    path: web::Path<String>,
) -> Result<HttpResponse, Error> {
    let slug = path.into_inner();

    let post_result = sqlx::query!(
        r#"
        SELECT
        p.id, p.title, p.slug, p.content, p.excerpt,
        p.published, p.created_at, p.updated_at, p.author_id,
        u.username as author_name, u.profile_pic_url
        FROM posts p
        JOIN users u ON p.author_id = u.id
        WHERE p.slug = $1
    "#,
        slug
    )
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("Database error: {}", e);
        actix_web::error::ErrorInternalServerError("Database error")
    })?;

    match post_result {
        Some(row) => {
            let post_response = PostResponse {
                id: row.id,
                title: row.title,
                slug: row.slug,
                content: row.content,
                excerpt: row.excerpt,
                published: row.published,
                author: AuthorInfo {
                    id: row.author_id,
                    username: row.author_name,
                    profile_pic_url: row.profile_pic_url,
                },
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
    let posts = sqlx::query!(
        r#"
    SELECT
        p.id, p.title, p.slug, p.content, p.excerpt,
        p.published, p.created_at, p.updated_at, p.author_id,
        u.username as author_name, u.profile_pic_url
    FROM posts p
    JOIN users u ON p.author_id = u.id
    ORDER BY p.created_at DESC
    "#
    )
    .fetch_all(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("Database Error: {}", e);
        actix_web::error::ErrorInternalServerError("Database Error")
    })?;

    let response: Vec<PostResponse> = posts
        .into_iter()
        .map(|row| PostResponse {
            id: row.id,
            title: row.title,
            slug: row.slug,
            content: row.content,
            excerpt: row.excerpt,
            published: row.published,
            author: AuthorInfo {
                id: row.author_id,
                username: row.author_name,
                profile_pic_url: row.profile_pic_url,
            },
            created_at: row.created_at,
            updated_at: row.updated_at,
        })
        .collect();
    Ok(HttpResponse::Ok().json(response))
}
